'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LucideIcon, LogOut } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MobileNavProps {
  items: NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-charcoal border-t border-brand-border z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all min-w-[56px]',
                active
                  ? 'text-brand-orange'
                  : 'text-brand-muted hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium tracking-wide', active && 'text-brand-orange')}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-brand-muted hover:text-red-400 transition-colors min-w-[56px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">Out</span>
        </button>
      </div>
    </nav>
  )
}
