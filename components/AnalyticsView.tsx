'use client'

import { ProductivityStats, TodoistTask, TodoistProject } from '@/lib/types'
import { useDailyLog } from '@/hooks/useDailyLog'
import TrendGraph from './TrendGraph'

interface Props {
  stats: ProductivityStats | null
  isLoading: boolean
  totalSkipped: number
  allTasks: TodoistTask[]
  projects: TodoistProject[]
}

const RECURRING_LABEL = '♻️🤓'
const WAITING_LABEL = 'really_waiting'

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-3.5 ${className}`}>
      {title && <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">{title}</p>}
      {children}
    </div>
  )
}

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const dayLabel = (d: string) => WEEKDAY[new Date(d + 'T00:00:00').getDay()]
const weekLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// Bars where the goal is a reference line, NOT the axis cap — bars can exceed it.
// amplify=true lifts the baseline below the smallest value so differences between
// similar large numbers (e.g. weekly totals) become visible.
function MiniBars({ data, labels, goal, amplify = false }: { data: number[]; labels: string[]; goal?: number; amplify?: boolean }) {
  const maxV = Math.max(...data, 1)
  const minV = Math.min(...data)
  const floor = amplify && data.length > 1 ? Math.max(0, minV - Math.round((maxV - minV) * 0.6) - 1) : 0
  const span = maxV - floor || 1
  const SCALE = 86 // % of height bars/line may use, leaving room for value labels
  const goalVisible = goal != null && goal > 0 && goal >= floor
  return (
    <div className="relative flex items-end gap-1.5" style={{ height: 76 }}>
      {goalVisible && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-500/40 pointer-events-none"
          style={{ bottom: `${Math.min((goal! - floor) / span, 1) * SCALE}%` }}
        >
          <span className="absolute -top-2.5 right-0 text-amber-500/70 text-[9px] bg-gray-900 px-1">goal {goal}</span>
        </div>
      )}
      {data.map((v, i) => {
        const h = ((v - floor) / span) * SCALE
        const hit = goal != null && goal > 0 && v >= goal
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${labels[i]}: ${v}`}>
            <span className="text-gray-500 text-[10px] tabular-nums">{v}</span>
            <div className="w-full rounded-t" style={{ height: `${Math.max(h, 0)}%`, minHeight: 2, backgroundColor: hit ? '#34d399' : '#6366f1' }} />
            <span className="text-gray-600 text-[10px]">{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

// Diverging bar around a center 0-axis: positive (ahead) green-right, negative red-left.
function NetBar({ net, maxAbs }: { net: number; maxAbs: number }) {
  const pct = Math.min(Math.abs(net) / (maxAbs || 1), 1) * 50
  const pos = net >= 0
  const fill: React.CSSProperties = { width: `${pct}%`, backgroundColor: pos ? '#34d399' : '#f87171' }
  if (pos) fill.left = '50%'; else fill.right = '50%'
  return (
    <div className="relative flex-1 h-2 bg-gray-800/70 rounded-full">
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-600" />
      <div className="absolute top-0 bottom-0 rounded-full" style={fill} />
    </div>
  )
}

// Per-day done vs added with a diverging net bar (ahead = green-right, behind = red-left).
function CompletionRate({ entries }: { entries: { date: string; completed: number; added: number }[] }) {
  const rows = entries.slice(-7).reverse().map(e => ({ date: e.date, done: e.completed, added: Math.max(e.added, 0) }))
  if (rows.length < 1) {
    return <p className="text-gray-700 text-xs text-center py-6">No data yet</p>
  }
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.done - r.added)), 1)
  const totNet = rows.reduce((s, r) => s + (r.done - r.added), 0)
  return (
    <div>
      {/* header: legend (left) + period net (right) */}
      <div className="flex items-center justify-between mb-1.5 text-[10px]">
        <span><span style={{ color: '#34d399' }}>✓done</span> <span style={{ color: '#f87171' }}>+added</span></span>
        <span className="tabular-nums" style={{ color: totNet >= 0 ? '#34d399' : '#f87171' }}>
          net {totNet >= 0 ? `+${totNet}` : totNet}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {rows.map(r => {
          const net = r.done - r.added
          return (
            <div key={r.date} className="flex items-center gap-1.5 text-[10px] tabular-nums leading-none">
              <span className="text-gray-600 w-9 flex-shrink-0">{weekLabel(r.date)}</span>
              <span className="w-6 text-right" style={{ color: '#34d399' }}>{r.done}</span>
              <span className="w-6 text-right" style={{ color: '#f87171' }}>{r.added}</span>
              <NetBar net={net} maxAbs={maxAbs} />
              <span className="w-6 text-right" style={{ color: net >= 0 ? '#34d399' : '#f87171' }}>{net >= 0 ? `+${net}` : net}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BarList({ items, max, labelClass = 'w-16' }: { items: { label: string; count: number; color?: string }[]; max: number; labelClass?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-2.5">
          <span className={`text-xs ${labelClass} truncate flex-shrink-0`} style={{ color: it.color ?? '#9ca3af' }} title={it.label}>{it.label}</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(it.count / max) * 100}%`, backgroundColor: it.color ?? '#6366f1' }} />
          </div>
          <span className="text-gray-500 text-xs tabular-nums w-7 text-right">{it.count}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsView({ stats, isLoading, totalSkipped, allTasks, projects }: Props) {
  const done = stats?.completed_today ?? 0
  const recurringCount = allTasks.filter(t => t.due?.is_recurring).length
  const waitingCount = allTasks.filter(t => t.labels.includes(WAITING_LABEL)).length
  const totalCount = allTasks.length
  const focusTasks = allTasks.filter(t => !t.due?.is_recurring && !t.labels.includes(WAITING_LABEL))
  const focusCount = focusTasks.length
  const taskIds = isLoading ? [] : focusTasks.map(t => t.id)

  const logEntries = useDailyLog(isLoading ? null : focusCount, done, taskIds)

  // Open by priority (P1=4 … P4=1)
  const priorityItems = [4, 3, 2, 1].map(p => ({
    label: `P${5 - p}`,
    count: allTasks.filter(t => t.priority === p).length,
    color: p === 4 ? '#ef4444' : p === 3 ? '#f97316' : p === 2 ? '#3b82f6' : '#6b7280',
  }))
  const maxPriority = Math.max(...priorityItems.map(p => p.count), 1)

  // Open by project (top 6)
  const projectItems = projects
    .map(p => ({ label: p.name, count: allTasks.filter(t => t.project_id === p.id).length }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const maxProject = Math.max(...projectItems.map(p => p.count), 1)

  // Open by label (top 6)
  const labelCounts: Record<string, number> = {}
  for (const t of allTasks) for (const l of t.labels) labelCounts[l] = (labelCounts[l] ?? 0) + 1
  const labelItems = Object.entries(labelCounts)
    .map(([label, count]) => ({ label, count, color: '#a78bfa' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const maxLabel = Math.max(...labelItems.map(l => l.count), 1)

  return (
    <div className="w-full max-w-6xl mx-auto pb-2">
      <h2 className="text-white text-base font-semibold mb-2">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

        {/* Remaining */}
        <Card title="Remaining">
          <div className="text-4xl font-bold text-white tabular-nums">{isLoading ? '—' : focusCount}</div>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">{RECURRING_LABEL} recurring</span>
              <span className="text-gray-500 text-xs tabular-nums">{recurringCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">really waiting</span>
              <span className="text-gray-500 text-xs tabular-nums">{waitingCount}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/60">
              <span className="text-gray-600 text-xs">total loaded</span>
              <span className="text-gray-600 text-xs tabular-nums">{totalCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">skipped this session</span>
              <span className="text-gray-600 text-xs tabular-nums">{totalSkipped}</span>
            </div>
          </div>
        </Card>

        {/* Backlog trend — spans 2 cols, kept subtle (wide viewBox = short render) */}
        <Card title="Trend" className="lg:col-span-2">
          <TrendGraph entries={logEntries} showAdded={false} height={64} vw={560} />
        </Card>

        {/* Open by priority / project / label */}
        <Card title="Open by priority">
          <BarList items={priorityItems} max={maxPriority} />
        </Card>
        <Card title="Open by project">
          {projectItems.length ? <BarList items={projectItems} max={maxProject} labelClass="w-28" /> : <p className="text-gray-700 text-xs py-4">No open tasks</p>}
        </Card>
        <Card title="Open by label">
          {labelItems.length ? <BarList items={labelItems} max={maxLabel} labelClass="w-28" /> : <p className="text-gray-700 text-xs py-4">No labels</p>}
        </Card>

        {/* Completion rate / completed 7d / completed 4wk */}
        <Card title="Completion rate">
          <CompletionRate entries={logEntries} />
        </Card>
        <Card title="Completed · last 7 days">
          {stats?.days?.length
            ? <MiniBars data={stats.days.map(d => d.total)} labels={stats.days.map(d => dayLabel(d.date))} goal={stats.daily_goal} />
            : <p className="text-gray-700 text-xs text-center py-6">No data</p>}
        </Card>
        <Card title="Completed · last 4 weeks">
          {stats?.weeks?.length
            ? <MiniBars data={stats.weeks.map(w => w.total)} labels={stats.weeks.map(w => weekLabel(w.from))} goal={stats.weekly_goal} amplify />
            : <p className="text-gray-700 text-xs text-center py-6">No data</p>}
        </Card>

      </div>
    </div>
  )
}
