import { MobileNav } from '@/components/shared/MobileNav'
import { AppBar } from '@/components/shared/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, Settings } from 'lucide-react'

const navItems = [
  { href: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/coach/clients', label: 'Clients', icon: Users },
  { href: '/coach/settings', label: 'Settings', icon: Settings },
]

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') redirect('/client/dashboard')

  return (
    <div className="min-h-screen bg-brand-black">
      <AppBar name={profile?.full_name} />
      <main className="px-4 pb-28 pt-2">
        {children}
      </main>
      <MobileNav items={navItems} />
    </div>
  )
}
