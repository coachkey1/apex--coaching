import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, createStripeCustomer, createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }

    // Get client record
    const { data: client } = await supabase
      .from('clients')
      .select('*, profile:profiles(*)')
      .eq('id', user.id)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = client.stripe_customer_id

    if (!customerId) {
      const customer = await createStripeCustomer(
        client.profile?.email ?? user.email!,
        client.profile?.full_name ?? 'Client'
      )
      customerId = customer.id

      await supabase
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await createCheckoutSession({
      customerId,
      priceId,
      clientId: user.id,
      coachId: client.coach_id ?? '',
      successUrl: `${baseUrl}/client/settings?success=true`,
      cancelUrl: `${baseUrl}/client/settings?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
