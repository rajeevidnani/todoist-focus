'use client'

import { useMemo } from 'react'

function getYearStats() {
  const now = new Date()
  const year = now.getFullYear()
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const totalDays = isLeap ? 366 : 365
  const start = new Date(year, 0, 1)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1
  return { dayOfYear, totalDays, daysLeft: totalDays - dayOfYear }
}

export default function YearProgress() {
  const { dayOfYear, totalDays, daysLeft } = useMemo(getYearStats, [])

  // Grid: 18 cols × 21 rows = 378 slots, first 365/366 used
  const COLS = 18
  const DOT = 5   // px
  const GAP = 3   // px

  const dots = Array.from({ length: totalDays }, (_, i) => i < dayOfYear - 1 ? 'past' : i === dayOfYear - 1 ? 'today' : 'future')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 flex-shrink-0">
      {/* Dot grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${DOT}px)`,
          gap: `${GAP}px`,
        }}
      >
        {dots.map((type, i) => (
          <div
            key={i}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: '50%',
              backgroundColor:
                type === 'past'   ? 'var(--yp-past)' :
                type === 'today'  ? 'var(--yp-today)' :
                                    'var(--yp-future)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-gray-500 text-xs mt-3 tracking-wide">
        {daysLeft} days left in {new Date().getFullYear()}
      </p>
    </div>
  )
}
