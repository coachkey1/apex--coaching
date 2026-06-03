import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { CoachSettingsForm } from '@/components/coach/CoachSettingsForm'

export default async function CoachSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: coach } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <PageHeader title="Settings" />
      <CoachSettingsForm profile={profile} coach={coach} />
    </div>
  )
}
