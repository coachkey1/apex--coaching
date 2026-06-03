'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, CheckCircle } from 'lucide-react'

interface CoachFeedbackFormProps {
  checkinId: string
  existingFeedback: string | null
  reviewed: boolean
}

export function CoachFeedbackForm({ checkinId, existingFeedback, reviewed }: CoachFeedbackFormProps) {
  const [feedback, setFeedback] = useState(existingFeedback ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(reviewed)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('checkins')
      .update({
        coach_feedback: feedback,
        coach_reviewed_at: new Date().toISOString(),
      })
      .eq('id', checkinId)

    setLoading(false)
    if (!error) setSaved(true)
  }

  return (
    <div className="card border-brand-orange/20">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-brand-orange" />
        <h3 className="font-display text-base tracking-wider">Coach Feedback</h3>
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Sent
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="input-base resize-none min-h-[120px] mb-3"
          placeholder="Write your feedback for this week's check-in..."
        />
        <button
          type="submit"
          disabled={loading || !feedback.trim()}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : saved ? 'Update Feedback' : 'Send Feedback'}
        </button>
      </form>
    </div>
  )
}
