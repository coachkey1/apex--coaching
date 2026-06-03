import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import Link from 'next/link'
import { getInitials, formatWeek, cn } from '@/lib/utils'
import { ChevronRight, Search } from 'lucide-react'

export default async function CoachClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      profile:profiles(*),
      checkins(id, week_start, body_weight_kg, coach_reviewed_at)
    `)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${clients?.length ?? 0} total`} />

      <div className="space-y-2 stagger-children">
        {clients?.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-brand-muted text-sm">No clients yet. Share your coach ID to onboard clients.</p>
            <div className="mt-4 bg-brand-gray rounded-lg px-4 py-3">
              <p className="text-xs text-brand-muted mb-1">Your Coach ID</p>
              <p className="font-mono text-brand-orange text-sm">{user.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        )}

        {clients?.map(client => {
          const pendingCount = client.checkins?.filter((c: any) => !c.coach_reviewed_at).length ?? 0
          const lastCheckin = client.checkins?.[0]

          return (
            <Link
              key={client.id}
              href={`/coach/clients/${client.id}`}
              className="card flex items-center gap-3 hover:border-brand-muted/40 transition-colors active:scale-[0.98] group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-gray flex items-center justify-center text-white font-semibold flex-shrink-0 group-hover:bg-brand-orange/20 transition-colors">
                {getInitials(client.profile?.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-medium truncate">{client.profile?.full_name ?? 'Unknown'}</p>
                  {pendingCount > 0 && (
                    <span className="badge-orange">{pendingCount}</span>
                  )}
                </div>
                <p className="text-brand-muted text-xs truncate">
                  {client.profile?.email}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {client.sport && (
                    <span className="text-xs text-brand-muted capitalize">{client.sport}</span>
                  )}
                  {lastCheckin && (
                    <span className="text-xs text-brand-muted">
                      Last: {formatWeek(lastCheckin.week_start)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  'badge text-xs',
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
    </div>
  )
}
