import { Zap } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="font-display text-3xl tracking-wider text-white leading-none">{title}</h1>
        {subtitle && <p className="text-brand-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}

export function AppBar({ name }: { name?: string | null }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2 mb-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-orange rounded flex items-center justify-center">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-display text-xl tracking-widest">APEX</span>
      </div>
      {name && (
        <span className="text-sm text-brand-muted truncate max-w-[140px]">{name}</span>
      )}
    </div>
  )
}
