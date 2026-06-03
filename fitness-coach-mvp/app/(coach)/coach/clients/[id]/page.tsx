import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard, ScoreBar } from '@/components/shared/StatCard'
import { WeightChart } from '@/components/shared/WeightChart'
import { CoachFeedbackForm } from '@/components/coach/CoachFeedbackForm'
import { PhotoGrid } from '@/components/coach/PhotoGrid'
import { formatWeek, getInitials, cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Weight, Moon, Footprints, Flame, Target } from 'lucide-react'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { checkin?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: client } = await supabase
    .from('clients')
    .select(`*, profile:profiles(*)`)
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single()

  if (!client) notFound()

  const { data: checkins } = await supabase
    .from('checkins')
    .select(`*, progress_photos(*)`)
    .eq('client_id', params.id)
    .order('week_start', { ascending: false })
    .limit(12)

  // Get signed URLs for photos
  const checkinList = await Promise.all(
    (checkins ?? []).map(async (ci) => {
      const photos = await Promise.all(
        (ci.progress_photos ?? []).map(async (photo: any) => {
          const { data } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(photo.storage_path, 3600)
          return { ...photo, url: data?.signedUrl }
        })
      )
      return { ...ci, progress_photos: photos }
    })
  )

  // Active checkin (from query or most recent)
  const activeCheckinId = searchParams.checkin ?? checkinList[0]?.id
  const activeCheckin = checkinList.find(c => c.id === activeCheckinId) ?? checkinList[0]

  return (
    <div>
      {/* Back */}
      <Link href="/coach/clients" className="flex items-center gap-1 text-brand-muted text-sm mb-4 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Clients
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full bg-brand-gray flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {getInitials(client.profile?.full_name)}
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-wider">{client.profile?.full_name}</h1>
          <p className="text-brand-muted text-sm">{client.profile?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {client.sport && <span className="badge-gray capitalize">{client.sport}</span>}
            {client.position && <span className="badge-gray">{client.position}</span>}
            <span className={cn('badge', client.subscription_status === 'active' ? 'badge-green' : 'badge-gray')}>
              {client.subscription_status}
            </span>
          </div>
        </div>
      </div>

      {/* Goal */}
      {client.goal && (
        <div className="card mb-4 border-brand-orange/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-brand-orange" />
            <span className="text-xs text-brand-muted uppercase tracking-wider">Goal</span>
          </div>
          <p className="text-white text-sm">{client.goal}</p>
        </div>
      )}

      {/* Weight Chart */}
      {checkinList.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-display text-lg tracking-wider mb-3">Weight Trend</h2>
          <WeightChart checkins={checkinList} startingWeight={client.starting_weight_kg} />
        </div>
      )}

      {/* Check-in history tabs */}
      {checkinList.length > 0 && (
        <section className="mb-4">
          <h2 className="font-display text-lg tracking-wider mb-3">Check-ins</h2>

          {/* Scrollable week selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {checkinList.map(ci => (
              <Link
                key={ci.id}
                href={`/coach/clients/${params.id}?checkin=${ci.id}`}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                  ci.id === activeCheckinId
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-brand-border bg-brand-gray text-brand-muted hover:border-brand-muted'
                )}
              >
                <div>{formatWeek(ci.week_start)}</div>
                {!ci.coach_reviewed_at && (
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mx-auto mt-1" />
                )}
              </Link>
            ))}
          </div>

          {/* Active check-in detail */}
          {activeCheckin && (
            <div className="space-y-4">
              {/* Body Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Weight" value={activeCheckin.body_weight_kg} unit="kg" icon={Weight} accent={!!activeCheckin.body_weight_kg} />
                <StatCard label="Body Fat" value={activeCheckin.body_fat_pct} unit="%" />
              </div>

              {/* Recovery */}
              <div className="card">
                <h3 className="font-display text-base tracking-wider mb-3">Recovery</h3>
                <div className="space-y-3">
                  <ScoreBar label="Energy Level" value={activeCheckin.energy_level} />
                  <ScoreBar label="Stress Level" value={activeCheckin.stress_level} colorByValue={false} />
                  {activeCheckin.avg_sleep_hours && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-brand-muted" />
                        <span className="text-sm text-brand-muted">Sleep</span>
                      </div>
                      <span className="font-mono text-white">{activeCheckin.avg_sleep_hours}h avg</span>
                    </div>
                  )}
                  {activeCheckin.avg_daily_steps && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-brand-muted" />
                        <span className="text-sm text-brand-muted">Steps</span>
                      </div>
                      <span className="font-mono text-white">{activeCheckin.avg_daily_steps.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Training */}
              <div className="card">
                <h3 className="font-display text-base tracking-wider mb-3">Training</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="font-mono text-xl text-white">{activeCheckin.sessions_completed ?? '—'}</div>
                    <div className="text-xs text-brand-muted">Done</div>
                  </div>
                  <div className="text-center border-x border-brand-border">
                    <div className="font-mono text-xl text-white">{activeCheckin.sessions_planned ?? '—'}</div>
                    <div className="text-xs text-brand-muted">Planned</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xl text-white">{activeCheckin.avg_session_rpe ?? '—'}</div>
                    <div className="text-xs text-brand-muted">Avg RPE</div>
                  </div>
                </div>

                {/* Basketball specific */}
                {(activeCheckin.shooting_pct || activeCheckin.vertical_jump_cm || activeCheckin.sprint_time_sec) && (
                  <>
                    <div className="divider" />
                    <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">Basketball</p>
                    <div className="grid grid-cols-3 gap-2">
                      {activeCheckin.shooting_pct && (
                        <div className="text-center">
                          <div className="font-mono text-lg text-white">{activeCheckin.shooting_pct}%</div>
                          <div className="text-xs text-brand-muted">Shooting</div>
                        </div>
                      )}
                      {activeCheckin.vertical_jump_cm && (
                        <div className="text-center">
                          <div className="font-mono text-lg text-white">{activeCheckin.vertical_jump_cm}cm</div>
                          <div className="text-xs text-brand-muted">Vertical</div>
                        </div>
                      )}
                      {activeCheckin.sprint_time_sec && (
                        <div className="text-center">
                          <div className="font-mono text-lg text-white">{activeCheckin.sprint_time_sec}s</div>
                          <div className="text-xs text-brand-muted">Sprint</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Measurements */}
              {(activeCheckin.chest_cm || activeCheckin.waist_cm || activeCheckin.hips_cm) && (
                <div className="card">
                  <h3 className="font-display text-base tracking-wider mb-3">Measurements</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ['Chest', activeCheckin.chest_cm],
                      ['Waist', activeCheckin.waist_cm],
                      ['Hips', activeCheckin.hips_cm],
                      ['L. Arm', activeCheckin.left_arm_cm],
                      ['R. Arm', activeCheckin.right_arm_cm],
                      ['Thigh', activeCheckin.left_thigh_cm],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string}>
                        <div className="font-mono text-white text-sm">{value}cm</div>
                        <div className="text-xs text-brand-muted">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client notes */}
              {(activeCheckin.client_notes || activeCheckin.wins || activeCheckin.struggles) && (
                <div className="card">
                  <h3 className="font-display text-base tracking-wider mb-3">Client Notes</h3>
                  <div className="space-y-3">
                    {activeCheckin.wins && (
                      <div>
                        <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Wins 🏆</p>
                        <p className="text-white text-sm">{activeCheckin.wins}</p>
                      </div>
                    )}
                    {activeCheckin.struggles && (
                      <div>
                        <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Struggles</p>
                        <p className="text-white text-sm">{activeCheckin.struggles}</p>
                      </div>
                    )}
                    {activeCheckin.client_notes && (
                      <div>
                        <p className="text-xs text-brand-muted uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-white text-sm">{activeCheckin.client_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Photos */}
              {activeCheckin.progress_photos?.length > 0 && (
                <div className="card">
                  <h3 className="font-display text-base tracking-wider mb-3">Progress Photos</h3>
                  <PhotoGrid photos={activeCheckin.progress_photos} />
                </div>
              )}

              {/* Coach Feedback */}
              <CoachFeedbackForm
                checkinId={activeCheckin.id}
                existingFeedback={activeCheckin.coach_feedback}
                reviewed={!!activeCheckin.coach_reviewed_at}
              />
            </div>
          )}
        </section>
      )}

      {checkinList.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-brand-muted text-sm">This client hasn't submitted any check-ins yet.</p>
        </div>
      )}
    </div>
  )
}
