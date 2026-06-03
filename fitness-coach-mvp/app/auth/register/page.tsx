'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Zap, AlertCircle, UserCheck, Dumbbell } from 'lucide-react'

type Role = 'client' | 'coach'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('client')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (role === 'coach') {
      router.push('/coach/dashboard')
    } else {
      router.push('/client/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      <div className="h-1 bg-gradient-to-r from-brand-orange via-yellow-500 to-brand-orange" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="font-display text-4xl tracking-widest text-white">APEX</span>
          </div>
          <p className="text-brand-muted text-sm tracking-wider uppercase">Elite Coaching Platform</p>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="card">
            <h1 className="font-display text-2xl tracking-wider mb-1">Create Account</h1>
            <p className="text-brand-muted text-sm mb-6">Start your journey today.</p>

            {/* Role Selector */}
            <div className="mb-5">
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    role === 'client'
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                      : 'border-brand-border bg-brand-gray text-brand-muted hover:border-brand-muted'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-xs font-medium">Athlete / Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('coach')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    role === 'coach'
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                      : 'border-brand-border bg-brand-gray text-brand-muted hover:border-brand-muted'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-medium">Coach</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input-base"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  `Join as ${role === 'coach' ? 'Coach' : 'Athlete'}`
                )}
              </button>
            </form>

            <div className="divider" />

            <p className="text-center text-sm text-brand-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-orange hover:text-orange-400 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
