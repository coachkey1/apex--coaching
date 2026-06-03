import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import Link from 'next/link'
import { formatWeek, getInitials, cn } from '@/lib/utils'
import { Users, ClipboardCheck, Clock, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react'

export default async function CoachDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all clients
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      profile:profiles(*),
      checkins(id, week_start, coach_reviewed_at, body_weight_kg, submitted_at)
    `)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  const totalClients = clients?.length ?? 0

  // Recent check-ins needing review
  const pendingReview = clients?.flatMap(c =>
    (c.checkins ?? [])
      .filter((ci: any) => !ci.coach_reviewed_at)
      .map((ci: any) => ({ ...ci, client: c }))
  ).sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()) ?? []

  // Active subscriptions
  const activeClients = clients?.filter(c => c.subscription_status === 'active').length ?? 0

  return (
    <div className="stagger-children">
      <PageHeader
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Clients"
          value={totalClients}
          icon={Users}
          accent
        />
        <StatCard
          label="Active"
          value={activeClients}
          icon={TrendingUp}
        />
        <StatCard
          label="Pending"
          value={pendingReview.length}
          icon={ClipboardCheck}
        />
      </div>

      {/* Pending Check-ins */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl tracking-wider">Needs Review</h2>
          {pendingReview.length > 0 && (
            <span className="badge-orange">{pendingReview.length} pending</span>
          )}
        </div>

        {pendingReview.length === 0 ? (
          <div className="card text-center py-8">
            <ClipboardCheck className="w-8 h-8 text-brand-muted mx-auto mb-2" />
            <p className="text-brand-muted text-sm">All check-ins reviewed!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingReview.slice(0, 5).map((ci: any) => (
              <Link
                key={ci.id}
                href={`/coach/clients/${ci.client.id}?checkin=${ci.id}`}
                className="card flex items-center gap-3 hover:border-brand-orange/40 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-brand-gray flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {getInitials(ci.client.profile?.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {ci.client.profile?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-brand-muted text-xs">
                    Week of {formatWeek(ci.week_start)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-orange">New</span>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Client Overview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl tracking-wider">Your Clients</h2>
          <Link href="/coach/clients" className="text-xs text-brand-orange">View all</Link>
        </div>

        {totalClients === 0 ? (
          <div className="card text-center py-10">
            <Users className="w-8 h-8 text-brand-muted mx-auto mb-2" />
            <p className="text-white font-medium mb-1">No clients yet</p>
            <p className="text-brand-muted text-sm">Share your coach link to onboard clients.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients?.slice(0, 5).map(client => {
              const lastCheckin = client.checkins?.[0]
              const hasNew = client.checkins?.some((ci: any) => !ci.coach_reviewed_at)
              return (
                <Link
                  key={client.id}
                  href={`/coach/clients/${client.id}`}
                  className="card flex items-center gap-3 hover:border-brand-muted/50 transition-colors active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-gray flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {getInitials(client.profile?.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">
                        {client.profile?.full_name ?? 'Unknown'}
                      </p>
                      {hasNew && <div className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />}
                    </div>
                    <p className="text-brand-muted text-xs">
                      {client.sport ? `${client.sport} • ` : ''}
                      {lastCheckin
                        ? `Last check-in ${formatWeek(lastCheckin.week_start)}`
                        : 'No check-ins yet'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'badge',
                      client.subscription_status === 'active' ? 'badge-green' : 'badge-gray'
                    )}>
                      {client.subscription_status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
