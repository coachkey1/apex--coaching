export type Role = 'coach' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Coach {
  id: string
  bio: string | null
  specialties: string[] | null
  instagram_handle: string | null
  stripe_customer_id: string | null
  stripe_account_id: string | null
  created_at: string
  profile?: Profile
}

export interface Client {
  id: string
  coach_id: string | null
  date_of_birth: string | null
  height_cm: number | null
  starting_weight_kg: number | null
  goal: string | null
  sport: string | null
  position: string | null
  stripe_customer_id: string | null
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
  subscription_id: string | null
  subscription_price_id: string | null
  created_at: string
  profile?: Profile
}

export interface Checkin {
  id: string
  client_id: string
  week_start: string
  submitted_at: string

  // Body
  body_weight_kg: number | null
  body_fat_pct: number | null

  // Measurements
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  left_arm_cm: number | null
  right_arm_cm: number | null
  left_thigh_cm: number | null
  right_thigh_cm: number | null

  // Recovery
  avg_sleep_hours: number | null
  avg_daily_steps: number | null
  energy_level: number | null
  stress_level: number | null

  // Training
  sessions_completed: number | null
  sessions_planned: number | null
  avg_session_rpe: number | null

  // Basketball
  shooting_pct: number | null
  vertical_jump_cm: number | null
  sprint_time_sec: number | null

  // Notes
  client_notes: string | null
  wins: string | null
  struggles: string | null

  // Coach
  coach_feedback: string | null
  coach_reviewed_at: string | null

  // Relations
  progress_photos?: ProgressPhoto[]
  client?: Client & { profile: Profile }
}

export interface ProgressPhoto {
  id: string
  checkin_id: string
  client_id: string
  storage_path: string
  photo_type: 'front' | 'side' | 'back' | 'other'
  uploaded_at: string
  url?: string // signed URL added on fetch
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
}

export type CheckinFormData = Omit<Checkin,
  'id' | 'client_id' | 'submitted_at' | 'coach_feedback' | 'coach_reviewed_at' | 'progress_photos' | 'client'
>
