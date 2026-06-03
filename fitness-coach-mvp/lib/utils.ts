import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, addWeeks } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWeekStart(date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

export function formatWeek(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d')
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 100) / 100
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10
}

export function getRpeLabel(rpe: number): string {
  if (rpe <= 3) return 'Easy'
  if (rpe <= 5) return 'Moderate'
  if (rpe <= 7) return 'Hard'
  if (rpe <= 9) return 'Very Hard'
  return 'Max Effort'
}

export function getScoreColor(value: number, max = 10): string {
  const pct = value / max
  if (pct >= 0.7) return 'text-green-400'
  if (pct >= 0.4) return 'text-yellow-400'
  return 'text-red-400'
}

export function weightTrend(checkins: Array<{ body_weight_kg: number | null }>): 'up' | 'down' | 'stable' {
  const weights = checkins
    .filter(c => c.body_weight_kg !== null)
    .map(c => c.body_weight_kg as number)

  if (weights.length < 2) return 'stable'
  const diff = weights[weights.length - 1] - weights[0]
  if (Math.abs(diff) < 0.5) return 'stable'
  return diff > 0 ? 'up' : 'down'
}
