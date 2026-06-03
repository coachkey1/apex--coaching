import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { WeightChart } from '@/components/shared/WeightChart'
import { ScoreBar } from '@/components/shared/StatCard'
import { formatWeek, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Weight, Moon, Footprints, Flame, MessageSquare,
  ChevronRight, TrendingDown, TrendingUp, Minus
} from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select('starting_weight_kg')
    .eq('id', user.id)
    .single()

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('client_id', user.id)
    .order('week_start', { ascending: false })
    .limit(20)

  const weightCheckins = (checkins ?? []).filter(c => c.body_weight_kg !== null)
  let weightChange: number | null = null
  if (weightCheckins.length >= 2) {
    const first = weightCheckins[weightCheckins.length - 1].body_weight_kg
    const last = weightCheckins[0].body_weight_kg
    weightChange = Math.round((last - first) * 10) / 10
  }

  return (
    <div>
      <PageHeader title="History" subtitle={`${checkins?.length ?? 0} check-ins`} />

      {/* Weight chart */}
      {weightCheckins.length > 1 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl tracking-wider">Weight Progress</h2>
            {weightChange !== null && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-mono font-medium',
                weightChange < 0 ? 'text-green-400' : weightChange > 0 ? 'text-red-400' : 'text-brand-muted'
              )}>
                {weightChange < 0
                  ? <TrendingDown className="w-4 h-4" />
                  : weightChange > 0
                    ? <TrendingUp className="w-4 h-4" />
                    : <Minus className="w-4 h-4" />
                }
                {weightChange > 0 ? '+' : ''}{weightChange} kg
              </div>
            )}
          </div>
          <WeightChart checkins={checkins ?? []} startingWeight={client?.starting_weight_kg} />
        </div>
      )}

      {/* Check-in list */}
      <div className="space-y-3 stagger-children">
        {(!checkins || checkins.length === 0) && (
          <div className="card text-center py-12">
            <p className="text-brand-muted text-sm">No check-ins yet.</p>
            <Link href="/client/checkin" className="btn-primary inline-flex mt-4">Submit your first check-in</Link>
          </div>
        )}

        {checkins?.map(checkin => (
          <div key={checkin.id} className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">{formatWeek(checkin.week_start)}</p>
                <p className="text-brand-muted text-xs">
                  {new Date(checkin.submitted_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              {checkin.coach_feedback
                ? <span className="badge-green flex items-center gap-1"><MessageSquare className="w-3 h-3" />Reviewed</span>
                : <span className="badge-gray">Pending</span>
              }
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { icon: Weight, value: checkin.body_weight_kg ? `${checkin.body_weight_kg}kg` : '—', label: 'Weight' },
                { icon: Moon, value: checkin.avg_sleep_hours ? `${checkin.avg_sleep_hours}h` : '—', label: 'Sleep' },
                { icon: Footprints, value: checkin.avg_daily_steps ? `${(checkin.avg_daily_steps / 1000).toFixed(1)}k` : '—', label: 'Steps' },
                { icon: Flame, value: checkin.sessions_completed !== null ? `${checkin.sessions_completed}/${checkin.sessions_planned ?? '?'}` : '—', label: 'Sessions' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <Icon className="w-4 h-4 text-brand-muted mx-auto mb-0.5" />
                  <p className="font-mono text-white text-xs font-medium">{value}</p>
                  <p className="text-brand-muted text-[10px]">{label}</p>
                </div>
              ))}
            </div>

            {/* Wellness bars */}
            {(checkin.energy_level || checkin.stress_level) && (
              <div className="space-y-2 mb-3">
                <ScoreBar label="Energy" value={checkin.energy_level} />
                <ScoreBar label="Stress" value={checkin.stress_level} colorByValue={false} />
              </div>
            )}

            {/* Coach feedback */}
            {checkin.coach_feedback && (
              <div className="bg-brand-gray rounded-lg px-3 py-2 mt-2">
                <p className="text-xs text-brand-orange mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Coach Feedback
                </p>
                <p className="text-white text-xs leading-relaxed line-clamp-3">{checkin.coach_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
