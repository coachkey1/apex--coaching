'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Checkin } from '@/types'
import { formatDate } from '@/lib/utils'

interface WeightChartProps {
  checkins: Checkin[]
  startingWeight?: number | null
}

export function WeightChart({ checkins, startingWeight }: WeightChartProps) {
  const data = checkins
    .filter(c => c.body_weight_kg !== null)
    .map(c => ({
      date: formatDate(c.week_start),
      weight: c.body_weight_kg,
    }))
    .reverse()

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-brand-muted text-sm">
        No weight data yet
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-charcoal border border-brand-border rounded-lg px-3 py-2">
          <p className="text-xs text-brand-muted mb-0.5">{label}</p>
          <p className="font-mono text-white font-medium">{payload[0].value} kg</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#6B6B6B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B6B6B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          {startingWeight && (
            <ReferenceLine
              y={startingWeight}
              stroke="#2E2E2E"
              strokeDasharray="4 4"
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ fill: '#F97316', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#F97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
