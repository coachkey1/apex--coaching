import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { ClientSettingsForm } from '@/components/client/ClientSettingsForm'

export default async function ClientSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: client } = await supabase
    .from('clients')
    .select('*, coach:coaches(id, profile:profiles(full_name, email))')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <PageHeader title="Settings" />
      <ClientSettingsForm profile={profile} client={client} />
    </div>
  )
}
