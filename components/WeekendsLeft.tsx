'use client'

import { useMemo } from 'react'

const BIRTH = new Date(1995, 10, 20) // Nov 20, 1995 (month is 0-indexed)
const TARGET_AGE = 75

function countSaturdays(from: Date, to: Date): number {
  if (to <= from) return 0
  const d = new Date(from)
  // advance to the next Saturday (day 6)
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7))
  let count = 0
  while (d <= to) {
    count++
    d.setDate(d.getDate() + 7)
  }
  return count
}

export default function WeekendsLeft() {
  const { left, lived, total, pctLeft } = useMemo(() => {
    const now = new Date()
    const end = new Date(BIRTH)
    end.setFullYear(end.getFullYear() + TARGET_AGE)
    const total = countSaturdays(BIRTH, end)
    const left = countSaturdays(now, end)
    const lived = total - left
    return { left, lived, total, pctLeft: Math.round((left / total) * 100) }
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 flex-shrink-0">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Weekends left</p>
      <div className="text-2xl font-bold text-white tabular-nums">{left.toLocaleString()}</div>

      {/* Thin life progress bar */}
      <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-violet-400/70"
          style={{ width: `${100 - pctLeft}%` }}
          title={`${lived.toLocaleString()} weekends lived`}
        />
      </div>
      <p className="text-gray-600 text-xs mt-2 tracking-wide">until 75</p>
    </div>
  )
}
