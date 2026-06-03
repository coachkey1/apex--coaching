'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDropzone } from 'react-dropzone'
import { Checkin } from '@/types'
import {
  Weight, Ruler, Moon, Footprints, Flame, Trophy, AlertTriangle,
  Camera, X, ChevronDown, ChevronUp, CheckCircle, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckinFormProps {
  clientId: string
  weekStart: string
  existing: Checkin | null
  sport: string | null
}

type Section = 'body' | 'measurements' | 'recovery' | 'training' | 'basketball' | 'notes' | 'photos'

interface PhotoFile {
  file: File
  preview: string
  type: 'front' | 'side' | 'back' | 'other'
}

const PHOTO_TYPES = ['front', 'side', 'back', 'other'] as const

export function CheckinForm({ clientId, weekStart, existing, sport }: CheckinFormProps) {
  const router = useRouter()
  const isBasketball = sport?.toLowerCase().includes('basketball')

  const [expanded, setExpanded] = useState<Section[]>(['body'])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!existing && !isNewSubmission(existing))
  const [photos, setPhotos] = useState<PhotoFile[]>([])

  // Form state — pre-fill from existing
  const [bodyWeight, setBodyWeight] = useState(existing?.body_weight_kg?.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(existing?.body_fat_pct?.toString() ?? '')
  const [chest, setChest] = useState(existing?.chest_cm?.toString() ?? '')
  const [waist, setWaist] = useState(existing?.waist_cm?.toString() ?? '')
  const [hips, setHips] = useState(existing?.hips_cm?.toString() ?? '')
  const [leftArm, setLeftArm] = useState(existing?.left_arm_cm?.toString() ?? '')
  const [rightArm, setRightArm] = useState(existing?.right_arm_cm?.toString() ?? '')
  const [leftThigh, setLeftThigh] = useState(existing?.left_thigh_cm?.toString() ?? '')
  const [rightThigh, setRightThigh] = useState(existing?.right_thigh_cm?.toString() ?? '')
  const [sleep, setSleep] = useState(existing?.avg_sleep_hours?.toString() ?? '')
  const [steps, setSteps] = useState(existing?.avg_daily_steps?.toString() ?? '')
  const [energy, setEnergy] = useState(existing?.energy_level?.toString() ?? '')
  const [stress, setStress] = useState(existing?.stress_level?.toString() ?? '')
  const [sessionsDone, setSessionsDone] = useState(existing?.sessions_completed?.toString() ?? '')
  const [sessionsPlanned, setSessionsPlanned] = useState(existing?.sessions_planned?.toString() ?? '')
  const [rpe, setRpe] = useState(existing?.avg_session_rpe?.toString() ?? '')
  const [shooting, setShooting] = useState(existing?.shooting_pct?.toString() ?? '')
  const [vertical, setVertical] = useState(existing?.vertical_jump_cm?.toString() ?? '')
  const [sprint, setSprint] = useState(existing?.sprint_time_sec?.toString() ?? '')
  const [wins, setWins] = useState(existing?.wins ?? '')
  const [struggles, setStruggles] = useState(existing?.struggles ?? '')
  const [notes, setNotes] = useState(existing?.client_notes ?? '')

  function isNewSubmission(c: Checkin) {
    return !c.body_weight_kg && !c.avg_sleep_hours
  }

  const toggle = (section: Section) => {
    setExpanded(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    )
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.slice(0, 4 - photos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'other' as const,
    }))
    setPhotos(prev => [...prev, ...newPhotos])
  }, [photos.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 4,
    disabled: photos.length >= 4,
  })

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const updatePhotoType = (index: number, type: PhotoFile['type']) => {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, type } : p))
  }

  const num = (v: string) => v === '' ? null : parseFloat(v)
  const int = (v: string) => v === '' ? null : parseInt(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const payload = {
      client_id: clientId,
      week_start: weekStart,
      body_weight_kg: num(bodyWeight),
      body_fat_pct: num(bodyFat),
      chest_cm: num(chest),
      waist_cm: num(waist),
      hips_cm: num(hips),
      left_arm_cm: num(leftArm),
      right_arm_cm: num(rightArm),
      left_thigh_cm: num(leftThigh),
      right_thigh_cm: num(rightThigh),
      avg_sleep_hours: num(sleep),
      avg_daily_steps: int(steps),
      energy_level: int(energy),
      stress_level: int(stress),
      sessions_completed: int(sessionsDone),
      sessions_planned: int(sessionsPlanned),
      avg_session_rpe: num(rpe),
      shooting_pct: num(shooting),
      vertical_jump_cm: num(vertical),
      sprint_time_sec: num(sprint),
      wins: wins || null,
      struggles: struggles || null,
      client_notes: notes || null,
    }

    let checkinId = existing?.id

    if (existing) {
      await supabase.from('checkins').update(payload).eq('id', existing.id)
    } else {
      const { data } = await supabase.from('checkins').insert(payload).select().single()
      checkinId = data?.id
    }

    // Upload photos
    if (checkinId && photos.length > 0) {
      await Promise.all(
        photos.map(async (photo) => {
          const ext = photo.file.name.split('.').pop()
          const path = `${clientId}/${checkinId}/${Date.now()}-${photo.type}.${ext}`

          const { error: uploadErr } = await supabase.storage
            .from('progress-photos')
            .upload(path, photo.file, { upsert: false })

          if (!uploadErr) {
            await supabase.from('progress_photos').insert({
              checkin_id: checkinId,
              client_id: clientId,
              storage_path: path,
              photo_type: photo.type,
            })
          }
        })
      )
    }

    setLoading(false)
    setSaved(true)
    router.push('/client/dashboard')
  }

  const SectionHeader = ({
    id, icon: Icon, title, subtitle
  }: {
    id: Section, icon: React.ElementType, title: string, subtitle?: string
  }) => (
    <button
      type="button"
      onClick={() => toggle(id)}
      className="w-full flex items-center gap-3 p-4 bg-brand-charcoal border border-brand-border rounded-xl transition-colors hover:border-brand-muted/50 active:scale-[0.99]"
    >
      <div className="w-8 h-8 rounded-lg bg-brand-gray flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-orange" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-white font-medium text-sm">{title}</p>
        {subtitle && <p className="text-brand-muted text-xs">{subtitle}</p>}
      </div>
      {expanded.includes(id)
        ? <ChevronUp className="w-4 h-4 text-brand-muted" />
        : <ChevronDown className="w-4 h-4 text-brand-muted" />
      }
    </button>
  )

  const RatingInput = ({
    label, value, onChange, colorful = true
  }: {
    label: string, value: string, onChange: (v: string) => void, colorful?: boolean
  }) => {
    const num = parseInt(value)
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">{label}</label>
          <span className={cn(
            'font-mono text-sm font-medium',
            value === '' ? 'text-brand-muted' :
            colorful ? (num >= 7 ? 'text-green-400' : num >= 4 ? 'text-yellow-400' : 'text-red-400') : 'text-white'
          )}>
            {value || '—'}/10
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n.toString() ? '' : n.toString())}
              className={cn(
                'flex-1 h-8 rounded text-xs font-medium transition-all',
                value === n.toString()
                  ? 'bg-brand-orange text-white'
                  : n <= parseInt(value || '0')
                    ? 'bg-brand-orange/30 text-brand-orange'
                    : 'bg-brand-gray text-brand-muted hover:bg-brand-border'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-4">

      {/* === BODY METRICS === */}
      <SectionHeader id="body" icon={Weight} title="Body Metrics" subtitle="Weight & body composition" />
      {expanded.includes('body') && (
        <div className="card space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Body Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={e => setBodyWeight(e.target.value)}
                className="input-base"
                placeholder="75.5"
              />
            </div>
            <div>
              <label className="label">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                className="input-base"
                placeholder="15.0"
              />
            </div>
          </div>
        </div>
      )}

      {/* === MEASUREMENTS === */}
      <SectionHeader id="measurements" icon={Ruler} title="Measurements" subtitle="Body measurements in cm" />
      {expanded.includes('measurements') && (
        <div className="card space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Chest (cm)', chest, setChest],
              ['Waist (cm)', waist, setWaist],
              ['Hips (cm)', hips, setHips],
              ['Left Arm (cm)', leftArm, setLeftArm],
              ['Right Arm (cm)', rightArm, setRightArm],
              ['Left Thigh (cm)', leftThigh, setLeftThigh],
              ['Right Thigh (cm)', rightThigh, setRightThigh],
            ].map(([label, value, setter]) => (
              <div key={label as string}>
                <label className="label">{label as string}</label>
                <input
                  type="number"
                  step="0.1"
                  value={value as string}
                  onChange={e => (setter as (v: string) => void)(e.target.value)}
                  className="input-base"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === RECOVERY === */}
      <SectionHeader id="recovery" icon={Moon} title="Recovery & Lifestyle" subtitle="Sleep, steps, energy" />
      {expanded.includes('recovery') && (
        <div className="card space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Avg Sleep (hrs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleep}
                onChange={e => setSleep(e.target.value)}
                className="input-base"
                placeholder="7.5"
              />
            </div>
            <div>
              <label className="label">Avg Daily Steps</label>
              <input
                type="number"
                step="100"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                className="input-base"
                placeholder="8000"
              />
            </div>
          </div>
          <RatingInput label="Energy Level" value={energy} onChange={setEnergy} />
          <RatingInput label="Stress Level" value={stress} onChange={setStress} colorful={false} />
        </div>
      )}

      {/* === TRAINING === */}
      <SectionHeader id="training" icon={Flame} title="Training Performance" subtitle="Sessions completed & intensity" />
      {expanded.includes('training') && (
        <div className="card space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sessions Done</label>
              <input
                type="number"
                min="0"
                value={sessionsDone}
                onChange={e => setSessionsDone(e.target.value)}
                className="input-base"
                placeholder="4"
              />
            </div>
            <div>
              <label className="label">Sessions Planned</label>
              <input
                type="number"
                min="0"
                value={sessionsPlanned}
                onChange={e => setSessionsPlanned(e.target.value)}
                className="input-base"
                placeholder="5"
              />
            </div>
          </div>
          <RatingInput label="Avg Session RPE" value={rpe} onChange={setRpe} />
        </div>
      )}

      {/* === BASKETBALL (conditional) === */}
      {isBasketball && (
        <>
          <SectionHeader id="basketball" icon={Trophy} title="Basketball Performance" subtitle="Sport-specific metrics" />
          {expanded.includes('basketball') && (
            <div className="card space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Shooting % (avg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={shooting}
                    onChange={e => setShooting(e.target.value)}
                    className="input-base"
                    placeholder="45.0"
                  />
                </div>
                <div>
                  <label className="label">Vertical Jump (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={vertical}
                    onChange={e => setVertical(e.target.value)}
                    className="input-base"
                    placeholder="65.0"
                  />
                </div>
                <div>
                  <label className="label">3/4 Court Sprint (sec)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sprint}
                    onChange={e => setSprint(e.target.value)}
                    className="input-base"
                    placeholder="3.85"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* === NOTES === */}
      <SectionHeader id="notes" icon={AlertTriangle} title="Wins & Struggles" subtitle="Reflect on your week" />
      {expanded.includes('notes') && (
        <div className="card space-y-4 animate-fade-in">
          <div>
            <label className="label">🏆 Wins — What went well?</label>
            <textarea
              value={wins}
              onChange={e => setWins(e.target.value)}
              className="input-base resize-none min-h-[80px]"
              placeholder="I hit all my sessions, slept 8hrs..."
            />
          </div>
          <div>
            <label className="label">Struggles — What was hard?</label>
            <textarea
              value={struggles}
              onChange={e => setStruggles(e.target.value)}
              className="input-base resize-none min-h-[80px]"
              placeholder="Cravings on the weekend, missed a session..."
            />
          </div>
          <div>
            <label className="label">Additional Notes for Coach</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-base resize-none min-h-[80px]"
              placeholder="Anything else your coach should know..."
            />
          </div>
        </div>
      )}

      {/* === PHOTOS === */}
      <SectionHeader id="photos" icon={Camera} title="Progress Photos" subtitle="Front, side, back (optional)" />
      {expanded.includes('photos') && (
        <div className="card space-y-4 animate-fade-in">
          {/* Dropzone */}
          {photos.length < 4 && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-brand-orange bg-brand-orange/10'
                  : 'border-brand-border hover:border-brand-muted/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-brand-muted mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Drop photos here</p>
              <p className="text-brand-muted text-xs mt-1">or tap to select • Max 4 photos • JPG, PNG, HEIC</p>
            </div>
          )}

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <div className="mt-1.5">
                    <select
                      value={photo.type}
                      onChange={e => updatePhotoType(index, e.target.value as PhotoFile['type'])}
                      className="input-base py-1.5 text-xs"
                    >
                      {PHOTO_TYPES.map(t => (
                        <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              {existing ? 'Update Check-in' : 'Submit Check-in'}
            </>
          )}
        </button>
        <p className="text-center text-brand-muted text-xs mt-2">
          Your coach will be notified automatically
        </p>
      </div>
    </form>
  )
}
