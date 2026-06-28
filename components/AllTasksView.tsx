'use client'

import { useMemo, useState } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
}

const BUCKETS = [
  { key: 'fresh',   label: 'Fresh',   subtitle: '< 30 days',     dot: '#818cf8', min: 0,   max: 30       },
  { key: 'aging',   label: 'Aging',   subtitle: '30 – 90 days',  dot: '#f59e0b', min: 30,  max: 90       },
  { key: 'old',     label: 'Old',     subtitle: '90 – 180 days', dot: '#f97316', min: 90,  max: 180      },
  { key: 'ancient', label: 'Ancient', subtitle: '180 + days',    dot: '#ef4444', min: 180, max: Infinity },
]

const PRIORITY_DOT: Record<number, string>   = { 4: '#f87171', 3: '#fb923c', 2: '#60a5fa', 1: '#6b728050' }
const PRIORITY_LABEL: Record<number, string> = { 4: 'P1 · Urgent', 3: 'P2 · High', 2: 'P3 · Medium', 1: 'P4 · Normal' }
const PRIORITY_COLOR: Record<number, string> = { 4: 'text-red-400', 3: 'text-orange-400', 2: 'text-blue-400', 1: 'text-gray-500' }

function daysSince(addedAt: string) {
  return Math.floor((Date.now() - new Date(addedAt).getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Task detail modal ──────────────────────────────────────────────────────
function TaskModal({ task, project, onClose, onDone }: {
  task: TodoistTask
  project?: TodoistProject
  onClose: () => void
  onDone: () => void
}) {
  const days = daysSince(task.added_at)
  const bucket = BUCKETS.find(b => days >= b.min && days < b.max)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <p className="text-white font-medium text-base leading-snug pr-6">{task.content}</p>

        {/* Meta grid */}
        <div className="mt-4 flex flex-col gap-2.5">
          {project && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-16 flex-shrink-0">Project</span>
              <span className="text-gray-300 text-xs">{project.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-16 flex-shrink-0">Priority</span>
            <span className={`text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]}
            </span>
          </div>

          {task.due && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-16 flex-shrink-0">Due</span>
              <span className="text-gray-300 text-xs">{formatDate(task.due.date)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-16 flex-shrink-0">Added</span>
            <span className="text-xs" style={{ color: bucket?.dot ?? '#9ca3af' }}>
              {formatDate(task.added_at)} · {days} days ago
            </span>
          </div>

          {task.labels.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 text-xs w-16 flex-shrink-0 mt-0.5">Labels</span>
              <div className="flex flex-wrap gap-1">
                {task.labels.map(l => (
                  <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{l}</span>
                ))}
              </div>
            </div>
          )}

          {task.description && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 text-xs w-16 flex-shrink-0 mt-0.5">Notes</span>
              <p className="text-gray-400 text-xs leading-relaxed">{task.description}</p>
            </div>
          )}
        </div>

        {/* Done button */}
        <button
          onClick={() => { onDone(); onClose() }}
          className="mt-5 w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
        >
          Mark done
        </button>
      </div>
    </div>
  )
}

// ── Task row ───────────────────────────────────────────────────────────────
function TaskRow({ task, project, onClose, onExpand }: {
  task: TodoistTask
  project?: TodoistProject
  onClose: () => void
  onExpand: () => void
}) {
  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800/40 group">
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full border border-gray-700 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors"
        title="Mark done"
      />
      <button className="flex-1 min-w-0 text-left" onClick={onExpand}>
        <p className="text-xs text-gray-300 leading-snug truncate">{task.content}</p>
        {project && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">{project.name}</p>
        )}
      </button>
      {task.priority > 1 && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} />
      )}
    </div>
  )
}

// ── Column ─────────────────────────────────────────────────────────────────
function Column({ bucket, tasks, projects, onCloseTask, onExpand }: {
  bucket: typeof BUCKETS[0]
  tasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
  onExpand: (task: TodoistTask) => void
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bucket.dot }} />
        <span className="text-xs font-semibold text-gray-300">{bucket.label}</span>
        <span className="text-[10px] text-gray-600">{bucket.subtitle}</span>
        <span className="ml-auto text-[10px] text-gray-500 tabular-nums">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none p-1.5 flex flex-col gap-0.5">
        {tasks.length === 0 ? (
          <p className="text-gray-700 text-xs text-center py-4">Nothing here</p>
        ) : tasks.map(t => (
          <TaskRow
            key={t.id}
            task={t}
            project={projects.find(p => p.id === t.project_id)}
            onClose={() => onCloseTask(t.id)}
            onExpand={() => onExpand(t)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main view ──────────────────────────────────────────────────────────────
export default function AllTasksView({ allTasks, projects, onCloseTask }: Props) {
  const [selected, setSelected] = useState<TodoistTask | null>(null)

  const bucketed = useMemo(() => {
    const out: Record<string, TodoistTask[]> = { fresh: [], aging: [], old: [], ancient: [] }
    for (const t of allTasks) {
      const days = daysSince(t.added_at)
      const bucket = BUCKETS.find(b => days >= b.min && days < b.max)
      if (bucket) out[bucket.key].push(t)
    }
    return out
  }, [allTasks])

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-2 pb-1">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <span className="text-gray-500 text-xs">{allTasks.length} remaining · click any task to see details</span>
        </div>
        <div className="flex gap-3 flex-1 min-h-0">
          {BUCKETS.map(b => (
            <Column
              key={b.key}
              bucket={b}
              tasks={bucketed[b.key]}
              projects={projects}
              onCloseTask={onCloseTask}
              onExpand={setSelected}
            />
          ))}
        </div>
      </div>

      {selected && (
        <TaskModal
          task={selected}
          project={projects.find(p => p.id === selected.project_id)}
          onClose={() => setSelected(null)}
          onDone={() => { onCloseTask(selected.id); setSelected(null) }}
        />
      )}
    </>
  )
}
