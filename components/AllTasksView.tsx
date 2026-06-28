'use client'

import { useMemo } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
}

const BUCKETS = [
  { key: 'fresh',   label: 'Fresh',   subtitle: '< 30 days',    color: '#818cf8', dot: '#818cf8', min: 0,   max: 30  },
  { key: 'aging',   label: 'Aging',   subtitle: '30 – 90 days', color: '#f59e0b', dot: '#f59e0b', min: 30,  max: 90  },
  { key: 'old',     label: 'Old',     subtitle: '90 – 180 days',color: '#f97316', dot: '#f97316', min: 90,  max: 180 },
  { key: 'ancient', label: 'Ancient', subtitle: '180 + days',   color: '#ef4444', dot: '#ef4444', min: 180, max: Infinity },
]

const PRIORITY_DOT: Record<number, string> = {
  4: '#f87171', 3: '#fb923c', 2: '#60a5fa', 1: '#6b728050',
}

function daysSince(addedAt: string) {
  return Math.floor((Date.now() - new Date(addedAt).getTime()) / 86400000)
}

function TaskRow({ task, project, onClose }: {
  task: TodoistTask
  project?: TodoistProject
  onClose: () => void
}) {
  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800/40 group">
      <button
        onClick={onClose}
        className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full border border-gray-700 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors"
        title="Mark done"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 leading-snug truncate">{task.content}</p>
        {project && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">{project.name}</p>
        )}
      </div>
      {task.priority > 1 && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} />
      )}
    </div>
  )
}

function Column({ bucket, tasks, projects, onCloseTask }: {
  bucket: typeof BUCKETS[0]
  tasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bucket.dot }} />
        <span className="text-xs font-semibold text-gray-300">{bucket.label}</span>
        <span className="text-[10px] text-gray-600">{bucket.subtitle}</span>
        <span className="ml-auto text-[10px] text-gray-500 tabular-nums">{tasks.length}</span>
      </div>

      {/* Scrollable task list */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-1.5 flex flex-col gap-0.5">
        {tasks.length === 0 ? (
          <p className="text-gray-700 text-xs text-center py-4">Nothing here</p>
        ) : (
          tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              project={projects.find(p => p.id === t.project_id)}
              onClose={() => onCloseTask(t.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function AllTasksView({ allTasks, projects, onCloseTask }: Props) {
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
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-2 pb-1">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <span className="text-gray-500 text-xs">{allTasks.length} remaining tasks</span>
      </div>
      <div className="flex gap-3 flex-1 min-h-0">
        {BUCKETS.map(b => (
          <Column
            key={b.key}
            bucket={b}
            tasks={bucketed[b.key]}
            projects={projects}
            onCloseTask={onCloseTask}
          />
        ))}
      </div>
    </div>
  )
}
