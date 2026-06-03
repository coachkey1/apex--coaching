'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Coach } from '@/types'
import { CheckCircle } from 'lucide-react'

interface CoachSettingsFormProps {
  profile: Profile | null
  coach: Coach | null
}

export function CoachSettingsForm({ profile, coach }: CoachSettingsFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(coach?.bio ?? '')
  const [instagram, setInstagram] = useState(coach?.instagram_handle ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const supabase = createClient()
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName }).eq('id', profile?.id),
      supabase.from('coaches').update({ bio, instagram_handle: instagram }).eq('id', profile?.id),
    ])

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4 stagger-children">
      {/* Profile section */}
      <div className="card">
        <h2 className="font-display text-lg tracking-wider mb-4">Profile</h2>
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

          <div>
            <label className="label">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="input-base resize-none min-h-[100px]"
              placeholder="Tell your clients about yourself..."
            />
          </div>

          <div>
            <label className="label">Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">@</span>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="input-base pl-7"
                placeholder="yourhandle"
              />
            </div>
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

      {/* Coach ID */}
      <div className="card">
        <h2 className="font-display text-lg tracking-wider mb-3">Your Coach ID</h2>
        <p className="text-brand-muted text-sm mb-3">
          Share this ID with clients so they can connect to you when registering.
        </p>
        <div className="bg-brand-gray rounded-lg px-4 py-3">
          <p className="font-mono text-brand-orange text-sm tracking-wider">{profile?.id}</p>
        </div>
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
            <span className="badge-orange">Coach</span>
          </div>
        </div>
      </div>
    </div>
  )
}
