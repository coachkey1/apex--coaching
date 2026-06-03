import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart } from '@/lib/utils'
import { CheckinForm } from '@/components/client/CheckinForm'
import { PageHeader } from '@/components/shared/PageHeader'

export default async function CheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*, profile:profiles(*)')
    .eq('id', user.id)
    .single()

  const weekStart = getWeekStart()

  // Check if already submitted this week
  const { data: existing } = await supabase
    .from('checkins')
    .select('*')
    .eq('client_id', user.id)
    .eq('week_start', weekStart)
    .single()

  return (
    <div>
      <PageHeader
        title="Weekly Check-in"
        subtitle={`Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
      />
      <CheckinForm
        clientId={user.id}
        weekStart={weekStart}
        existing={existing}
        sport={client?.sport ?? null}
      />
    </div>
  )
}
