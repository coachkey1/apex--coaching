import { MobileNav } from '@/components/shared/MobileNav'
import { AppBar } from '@/components/shared/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, ClipboardList, History, Settings } from 'lucide-react'

const navItems = [
  { href: '/client/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/client/checkin', label: 'Check-in', icon: ClipboardList },
  { href: '/client/history', label: 'History', icon: History },
  { href: '/client/settings', label: 'Settings', icon: Settings },
]

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') redirect('/coach/dashboard')

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
