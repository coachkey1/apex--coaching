import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard, ScoreBar } from '@/components/shared/StatCard'
import { WeightChart } from '@/components/shared/WeightChart'
import Link from 'next/link'
import { formatWeek, getWeekStart } from '@/lib/utils'
import { Plus, MessageSquare, Weight, Moon, Footprints, ChevronRight, Flame } from 'lucide-react'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select(`*, profile:profiles(*), coach:coaches(*, profile:profiles(*))`)
    .eq('id', user.id)
    .single()

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('client_id', user.id)
    .order('week_start', { ascending: false })
    .limit(8)

  const latestCheckin = checkins?.[0]
  const thisWeek = getWeekStart()
  const hasThisWeek = checkins?.some(c => c.week_start === thisWeek)

  const profile = client?.profile

  return (
    <div className="stagger-children">
      <PageHeader
        title={`Hey, ${profile?.full_name?.split(' ')[0] ?? 'Athlete'} 👋`}
        subtitle="Track your progress this week"
      />

      {/* Check-in CTA */}
      {!hasThisWeek && (
        <Link
          href="/client/checkin"
          className="block card border-brand-orange/40 bg-brand-orange/5 mb-6 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-orange font-semibold text-sm mb-0.5">Weekly Check-in Due</p>
              <p className="text-brand-muted text-xs">Week of {formatWeek(thisWeek)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>
        </Link>
      )}

      {/* Latest stats */}
      {latestCheckin && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              label="Weight"
              value={latestCheckin.body_weight_kg}
              unit="kg"
              icon={Weight}
              accent={!!latestCheckin.body_weight_kg}
            />
            <StatCard
              label="Avg Sleep"
              value={latestCheckin.avg_sleep_hours}
              unit="hrs"
              icon={Moon}
            />
            <StatCard
              label="Daily Steps"
              value={latestCheckin.avg_daily_steps?.toLocaleString()}
              icon={Footprints}
            />
            <StatCard
              label="Sessions"
              value={latestCheckin.sessions_completed !== null
                ? `${latestCheckin.sessions_completed}/${latestCheckin.sessions_planned ?? '?'}`
                : null}
              icon={Flame}
            />
          </div>

          {(latestCheckin.energy_level || latestCheckin.stress_level) && (
            <div className="card mb-4">
              <h2 className="font-display text-lg tracking-wider mb-3">Wellness</h2>
              <div className="space-y-3">
                <ScoreBar label="Energy Level" value={latestCheckin.energy_level} />
                <ScoreBar label="Stress Level" value={latestCheckin.stress_level} colorByValue={false} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Weight Chart */}
      {checkins && checkins.length > 1 && (
        <div className="card mb-4">
          <h2 className="font-display text-lg tracking-wider mb-3">Weight Trend</h2>
          <WeightChart checkins={checkins} startingWeight={client?.starting_weight_kg} />
        </div>
      )}

      {/* Coach feedback */}
      {latestCheckin?.coach_feedback && (
        <div className="card border-brand-orange/20 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-brand-orange" />
            <span className="text-xs text-brand-muted uppercase tracking-wider">Coach Feedback</span>
          </div>
          <p className="text-white text-sm leading-relaxed">{latestCheckin.coach_feedback}</p>
          {client?.coach?.profile && (
            <p className="text-brand-muted text-xs mt-2">— {client.coach.profile.full_name}</p>
          )}
        </div>
      )}

      {/* No checkins yet */}
      {(!checkins || checkins.length === 0) && (
        <div className="card text-center py-10">
          <Flame className="w-8 h-8 text-brand-orange mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Ready to start?</p>
          <p className="text-brand-muted text-sm mb-4">Submit your first weekly check-in to begin tracking your progress.</p>
          <Link href="/client/checkin" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            First Check-in
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <Link href="/client/history" className="card flex items-center justify-between hover:border-brand-muted/40 transition-colors active:scale-[0.98]">
          <span className="text-sm text-white">View Check-in History</span>
          <ChevronRight className="w-4 h-4 text-brand-muted" />
        </Link>
      </div>
    </div>
  )
}
