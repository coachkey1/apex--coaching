import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number | null
  unit?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  accent?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  accent,
  className,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={cn(
      'card flex flex-col gap-2',
      accent && 'border-brand-orange/40 bg-brand-orange/5',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon className={cn('w-4 h-4', accent ? 'text-brand-orange' : 'text-brand-muted')} />}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn('stat-value', accent && 'text-brand-orange')}>
          {value ?? '—'}
        </span>
        {unit && value !== null && (
          <span className="text-brand-muted text-xs mb-1">{unit}</span>
        )}
      </div>
      {trend && trendValue && (
        <div className={cn(
          'flex items-center gap-1 text-xs',
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-brand-muted'
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}

interface ScoreBarProps {
  value: number | null
  max?: number
  label: string
  colorByValue?: boolean
}

export function ScoreBar({ value, max = 10, label, colorByValue = true }: ScoreBarProps) {
  if (value === null) return null
  const pct = (value / max) * 100
  const color = colorByValue
    ? pct >= 70 ? '#22C55E' : pct >= 40 ? '#EAB308' : '#EF4444'
    : '#F97316'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-brand-muted">{label}</span>
        <span className="text-xs font-mono font-medium text-white">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-brand-gray rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
