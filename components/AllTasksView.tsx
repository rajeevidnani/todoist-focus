'use client'

import { useState, useMemo } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'
import { localToday } from '@/hooks/useTaskQueue'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
}

function ageDot(addedAt: string): { color: string; title: string } | null {
  const days = Math.floor((Date.now() - new Date(addedAt).getTime()) / 86400000)
  if (days < 30) return null
  if (days < 90)  return { color: '#f59e0b', title: `Added ${days} days ago` }
  if (days < 180) return { color: '#f97316', title: `Added ${days} days ago` }
  return { color: '#ef4444', title: `Added ${days} days ago` }
}

const PRIORITY_COLORS: Record<number, string> = {
  4: 'text-red-400',
  3: 'text-orange-400',
  2: 'text-blue-400',
  1: 'text-gray-600',
}
const PRIORITY_LABELS: Record<number, string> = { 4: 'P1', 3: 'P2', 2: 'P3', 1: 'P4' }

function TaskRow({ task, project, onClose }: {
  task: TodoistTask
  project?: TodoistProject
  onClose: () => void
}) {
  const dot = ageDot(task.added_at)
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/40 group">
      <button
        onClick={onClose}
        className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-600 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors"
        title="Mark done"
      />
      <span className="flex-1 text-sm text-gray-200 truncate">{task.content}</span>
      {dot && (
        <span
          className="flex-shrink-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: dot.color }}
          title={dot.title}
        />
      )}
      {project && (
        <span className="flex-shrink-0 text-xs text-gray-600 hidden group-hover:inline">{project.name}</span>
      )}
      <span className={`flex-shrink-0 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
        {task.priority > 1 ? PRIORITY_LABELS[task.priority] : ''}
      </span>
    </div>
  )
}

function Section({ title, tasks, projects, onCloseTask, defaultOpen = true }: {
  title: string
  tasks: TodoistTask[]
  projects: TodoistProject[]
  onCloseTask: (id: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (tasks.length === 0) return null
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-800/30 rounded-lg transition-colors"
      >
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 8 12">
          <path d="M2 0L8 6L2 12V0Z"/>
        </svg>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
        <span className="text-xs text-gray-600 tabular-nums">{tasks.length}</span>
      </button>
      {open && (
        <div className="ml-2">
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              project={projects.find(p => p.id === t.project_id)}
              onClose={() => onCloseTask(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AllTasksView({ allTasks, projects, onCloseTask }: Props) {
  const [allOpen, setAllOpen] = useState(true)

  const today = localToday()
  const thisWeekEnd = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const { overdue, dueToday, dueThisWeek, future, noDue } = useMemo(() => {
    const overdue: TodoistTask[] = []
    const dueToday: TodoistTask[] = []
    const dueThisWeek: TodoistTask[] = []
    const future: TodoistTask[] = []
    const noDue: TodoistTask[] = []

    for (const t of allTasks) {
      if (!t.due) { noDue.push(t); continue }
      const d = t.due.date
      if (d < today) overdue.push(t)
      else if (d === today) dueToday.push(t)
      else if (d <= thisWeekEnd) dueThisWeek.push(t)
      else future.push(t)
    }
    return { overdue, dueToday, dueThisWeek, future, noDue }
  }, [allTasks, today, thisWeekEnd])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{allTasks.length} tasks</span>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> 30–90d
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-1" /> 90–180d
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1" /> 180d+
          </div>
        </div>
        <button
          onClick={() => setAllOpen(o => !o)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 space-y-1">
        {overdue.length > 0 && (
          <Section title="Overdue" tasks={overdue} projects={projects} onCloseTask={onCloseTask} defaultOpen={allOpen} />
        )}
        <Section title="Due today" tasks={dueToday} projects={projects} onCloseTask={onCloseTask} defaultOpen={allOpen} />
        <Section title="Due this week" tasks={dueThisWeek} projects={projects} onCloseTask={onCloseTask} defaultOpen={allOpen} />
        <Section title="Future" tasks={future} projects={projects} onCloseTask={onCloseTask} defaultOpen={allOpen} />
        <Section title="No due date" tasks={noDue} projects={projects} onCloseTask={onCloseTask} defaultOpen={allOpen} />
      </div>
    </div>
  )
}
