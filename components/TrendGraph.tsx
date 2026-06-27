'use client'

import { useState } from 'react'
import { LogEntry } from '@/hooks/useDailyLog'

interface Props {
  entries: LogEntry[]
  showAdded?: boolean
  height?: number
  vw?: number // viewBox width — larger = shorter/flatter render in wide containers
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TrendGraph({ entries, showAdded = true, height = 88, vw = 280 }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  if (entries.length < 2) {
    return (
      <p className="text-gray-700 text-xs text-center py-6">
        {entries.length === 0 ? 'No history yet' : 'Need 2+ days to show trend'}
      </p>
    )
  }

  const W = vw
  const H = height
  const PAD = { top: 22, right: 12, bottom: 18, left: 30 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const counts = entries.map(e => e.count)
  const minVal = Math.min(...counts)
  const maxVal = Math.max(...counts)
  const range = maxVal - minVal || 1

  const x = (i: number) => PAD.left + (i / (entries.length - 1)) * innerW
  const y = (val: number) => PAD.top + innerH - ((val - minVal) / range) * innerH

  const points = entries.map((e, i) => ({ x: x(i), y: y(e.count), ...e }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = [
    `M ${points[0].x} ${PAD.top + innerH}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${PAD.top + innerH}`,
    'Z',
  ].join(' ')

  const yTicks = Array.from(new Set([minVal, maxVal]))
  const xLabels = [
    { i: 0, label: formatShortDate(entries[0].date) },
    { i: entries.length - 1, label: formatShortDate(entries[entries.length - 1].date) },
  ]

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const trend = last.count < prev.count ? 'down' : last.count > prev.count ? 'up' : 'flat'
  const trendColor = trend === 'down' ? '#34d399' : trend === 'up' ? '#f87171' : '#9ca3af'

  const hp = hover != null ? points[hover] : null

  // Per-day done/added — recent first (skip first day; no prior to diff added)
  const addedEntries = entries.slice(1)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-500 text-xs uppercase tracking-wide">Backlog</span>
        <span className="text-xs tabular-nums" style={{ color: trendColor }}>
          {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'} {last.count}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#area-grad)" />
        <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left - 3} y1={y(v)} x2={PAD.left + innerW} y2={y(v)} stroke="#374151" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="8" fill="#4b5563">{v}</text>
          </g>
        ))}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={x(i)} y={H - 3} textAnchor={i === 0 ? 'start' : 'end'} fontSize="7.5" fill="#4b5563">{label}</text>
        ))}

        {/* Hover guide */}
        {hp && (
          <line x1={hp.x} y1={PAD.top} x2={hp.x} y2={PAD.top + innerH} stroke="#6366f1" strokeWidth="0.75" strokeDasharray="2 2" />
        )}

        {/* Data dots + always-visible count labels */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1
          const isHovered = hover === i
          return (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r={isHovered ? 4 : isLast ? 3 : 2}
                fill={isHovered ? '#fff' : isLast ? trendColor : '#6366f1'}
                stroke={isLast ? '#1e1b4b' : 'none'} strokeWidth="1" />
              <text
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize="9"
                fontWeight={isLast ? '700' : '500'}
                fill={isLast ? trendColor : '#9ca3af'}
              >
                {p.count}
              </text>
            </g>
          )
        })}

        {/* Invisible wide hit targets */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.date}`}
            x={p.x - innerW / (entries.length - 1) / 2}
            y={0}
            width={innerW / (entries.length - 1)}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* Tooltip */}
        {hp && (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={Math.min(Math.max(hp.x - 26, 0), W - 52)} y={Math.max(hp.y - 24, 0)} width="52" height="18" rx="4" fill="#020617" stroke="#312e44" strokeWidth="0.5" />
            <text x={Math.min(Math.max(hp.x - 26, 0), W - 52) + 26} y={Math.max(hp.y - 24, 0) + 12} textAnchor="middle" fontSize="8.5" fill="#e5e7eb">
              {formatShortDate(hp.date)}: {hp.count}
            </text>
          </g>
        )}
      </svg>

      {showAdded && (
        <div className="mt-3">
          <div className="flex items-baseline">
            <span className="text-[10px]"><span style={{ color: '#34d399' }}>✓done</span> <span style={{ color: '#f87171' }}>+added</span> <span className="text-gray-600">· per day</span></span>
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {addedEntries.slice(-7).reverse().map(e => {
              const added = Math.max(e.added, 0)
              return (
                <div key={e.date} className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs w-14 flex-shrink-0 tabular-nums">{formatShortDate(e.date)}</span>
                  <span className="flex items-center gap-3 tabular-nums text-xs">
                    <span style={{ color: '#34d399' }}>✓{e.completed}</span>
                    <span style={{ color: '#f87171' }}>+{added}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
