import { LogEntry } from '@/hooks/useDailyLog'

interface Props {
  entries: LogEntry[]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TrendGraph({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <p className="text-gray-700 text-xs text-center py-3">
        {entries.length === 0 ? 'No history yet' : 'Need 2+ days to show trend'}
      </p>
    )
  }

  const W = 160
  const H = 72
  const PAD = { top: 8, right: 8, bottom: 18, left: 28 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const counts = entries.map(e => e.count)
  const minVal = Math.min(...counts)
  const maxVal = Math.max(...counts)
  const range = maxVal - minVal || 1

  function x(i: number) {
    return PAD.left + (i / (entries.length - 1)) * innerW
  }
  function y(val: number) {
    return PAD.top + innerH - ((val - minVal) / range) * innerH
  }

  const points = entries.map((e, i) => ({ x: x(i), y: y(e.count), ...e }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = [
    `M ${points[0].x} ${PAD.top + innerH}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${PAD.top + innerH}`,
    'Z',
  ].join(' ')

  // Y axis ticks: min and max only
  const yTicks = Array.from(new Set([minVal, maxVal]))

  // X axis: first and last date labels
  const xLabels = [
    { i: 0, label: formatShortDate(entries[0].date) },
    { i: entries.length - 1, label: formatShortDate(entries[entries.length - 1].date) },
  ]

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const trend = last.count < prev.count ? 'down' : last.count > prev.count ? 'up' : 'flat'
  const trendColor = trend === 'down' ? '#34d399' : trend === 'up' ? '#f87171' : '#9ca3af'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-500 text-xs uppercase tracking-wide">Trend</span>
        <span className="text-xs tabular-nums" style={{ color: trendColor }}>
          {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'} {last.count}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: 'visible' }}
      >
        {/* Area fill */}
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#area-grad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Y axis ticks */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left - 3} y1={y(v)}
              x2={PAD.left + innerW} y2={y(v)}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="3 3"
            />
            <text
              x={PAD.left - 6} y={y(v)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="8" fill="#4b5563"
            >
              {v}
            </text>
          </g>
        ))}

        {/* X axis date labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={x(i)} y={H - 3}
            textAnchor={i === 0 ? 'start' : 'end'}
            fontSize="7.5" fill="#4b5563"
          >
            {label}
          </text>
        ))}

        {/* Dots — all small, last one highlighted */}
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={p.x} cy={p.y}
            r={i === points.length - 1 ? 3 : 2}
            fill={i === points.length - 1 ? trendColor : '#6366f1'}
            stroke={i === points.length - 1 ? '#1e1b4b' : 'none'}
            strokeWidth="1"
          >
            <title>{formatShortDate(p.date)}: {p.count}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}
