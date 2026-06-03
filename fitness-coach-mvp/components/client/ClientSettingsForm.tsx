'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Client } from '@/types'
import { CheckCircle, ExternalLink, CreditCard, User, Target, Dumbbell } from 'lucide-react'

interface ClientSettingsFormProps {
  profile: Profile | null
  client: any
}

const SPORTS = ['General Fitness', 'Basketball', 'Football', 'Track & Field', 'Soccer', 'Swimming', 'CrossFit', 'Other']
const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']

export function ClientSettingsForm({ profile, client }: ClientSettingsFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [goal, setGoal] = useState(client?.goal ?? '')
  const [sport, setSport] = useState(client?.sport ?? '')
  const [position, setPosition] = useState(client?.position ?? '')
  const [heightCm, setHeightCm] = useState(client?.height_cm?.toString() ?? '')
  const [startingWeight, setStartingWeight] = useState(client?.starting_weight_kg?.toString() ?? '')
  const [coachId, setCoachId] = useState(client?.coach_id ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  const isBasketball = sport.toLowerCase() === 'basketball'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const supabase = createClient()

    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName }).eq('id', profile?.id),
      supabase.from('clients').update({
        goal: goal || null,
        sport: sport || null,
        position: isBasketball ? (position || null) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        starting_weight_kg: startingWeight ? parseFloat(startingWeight) : null,
        coach_id: coachId || null,
      }).eq('id', profile?.id),
    ])

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setBillingLoading(false)
  }

  const handleSubscribe = async (priceId: string) => {
    setBillingLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setBillingLoading(false)
  }

  return (
    <div className="space-y-4 stagger-children">

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-brand-orange" />
          <h2 className="font-display text-lg tracking-wider">Profile</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input-base"
              placeholder="Your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className="input-base"
                placeholder="175"
              />
            </div>
            <div>
              <label className="label">Starting Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={startingWeight}
                onChange={e => setStartingWeight(e.target.value)}
                className="input-base"
                placeholder="80.0"
              />
            </div>
          </div>

          <div className="divider" />

          {/* Sport & Goals */}
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-brand-orange" />
            <h3 className="font-display text-base tracking-wider">Sport & Goals</h3>
          </div>

          <div>
            <label className="label">Sport / Training Type</label>
            <select
              value={sport}
              onChange={e => setSport(e.target.value)}
              className="input-base"
            >
              <option value="">Select sport...</option>
              {SPORTS.map(s => (
                <option key={s} value={s.toLowerCase()}>{s}</option>
              ))}
            </select>
          </div>

          {isBasketball && (
            <div>
              <label className="label">Position</label>
              <select
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="input-base"
              >
                <option value="">Select position...</option>
                {POSITIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Primary Goal</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="input-base resize-none min-h-[80px]"
              placeholder="Lose 10kg, improve vertical jump, make varsity team..."
            />
          </div>

          <div className="divider" />

          {/* Coach connection */}
          <div>
            <label className="label">Coach ID</label>
            <input
              type="text"
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              className="input-base font-mono text-sm"
              placeholder="Paste your coach's ID here"
            />
            {client?.coach?.profile && (
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected to {client.coach.profile.full_name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Saved!
              </span>
            ) : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Subscription */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-brand-orange" />
          <h2 className="font-display text-lg tracking-wider">Subscription</h2>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-brand-gray rounded-lg">
          <span className="text-sm text-brand-muted">Status</span>
          <span className={`badge ${client?.subscription_status === 'active' ? 'badge-green' : 'badge-gray'}`}>
            {client?.subscription_status ?? 'Inactive'}
          </span>
        </div>

        {client?.subscription_status === 'active' ? (
          <button
            onClick={handleManageBilling}
            disabled={billingLoading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {billingLoading ? 'Loading...' : 'Manage Billing'}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-brand-muted text-sm mb-3">
              Subscribe to unlock weekly coaching, feedback, and full progress tracking.
            </p>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '')}
              disabled={billingLoading}
              className="btn-primary w-full"
            >
              {billingLoading ? 'Loading...' : 'Subscribe — Monthly'}
            </button>
            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_QUARTERLY_PRICE_ID ?? '')}
              disabled={billingLoading}
              className="btn-secondary w-full"
            >
              {billingLoading ? 'Loading...' : 'Subscribe — Quarterly (Save 15%)'}
            </button>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="font-display text-lg tracking-wider mb-3">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Email</span>
            <span className="text-white">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Role</span>
            <span className="badge-gray">Client</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Member since</span>
            <span className="text-white">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '—'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
