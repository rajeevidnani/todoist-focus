'use client'

import { useState, useCallback } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onPickWinner: (task: TodoistTask) => void
}

const PRIORITY_BADGE: Record<number, { label: string; className: string }> = {
  4: { label: 'P1', className: 'text-red-400 bg-red-400/10' },
  3: { label: 'P2', className: 'text-orange-400 bg-orange-400/10' },
  2: { label: 'P3', className: 'text-blue-400 bg-blue-400/10' },
  1: { label: 'P4', className: 'text-gray-500 bg-gray-700/30' },
}

function ageDays(addedAt: string): number {
  return Math.floor((Date.now() - new Date(addedAt).getTime()) / 86400000)
}

function ageBadge(addedAt: string): { color: string; label: string } | null {
  const d = ageDays(addedAt)
  if (d < 30)  return null
  if (d < 90)  return { color: '#f59e0b', label: `${d}d old` }
  if (d < 180) return { color: '#f97316', label: `${d}d old` }
  return { color: '#ef4444', label: `${d}d old` }
}

function pickTwo(tasks: TodoistTask[], exclude?: Set<string>): [TodoistTask, TodoistTask] | null {
  const pool = exclude ? tasks.filter(t => !exclude.has(t.id)) : tasks
  if (pool.length < 2) return null
  const a = Math.floor(Math.random() * pool.length)
  let b = Math.floor(Math.random() * (pool.length - 1))
  if (b >= a) b++
  return [pool[a], pool[b]]
}

function VSCard({ task, project, onPick }: {
  task: TodoistTask
  project?: TodoistProject
  onPick: () => void
}) {
  const pb = PRIORITY_BADGE[task.priority]
  const age = ageBadge(task.added_at)

  return (
    <button
      onClick={onPick}
      className="flex-1 bg-gray-900 border-2 border-gray-800 hover:border-indigo-500 rounded-2xl p-6 flex flex-col gap-3 text-left transition-all hover:bg-gray-800/60 group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pb.className}`}>{pb.label}</span>
        {age && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: age.color, backgroundColor: `${age.color}18` }}>
            {age.label}
          </span>
        )}
      </div>
      <p className="text-white text-lg font-medium leading-snug group-hover:text-indigo-200 transition-colors">
        {task.content}
      </p>
      {project && (
        <span className="text-gray-600 text-xs">{project.name}</span>
      )}
      {task.due && (
        <span className="text-gray-500 text-xs">Due {task.due.date}</span>
      )}
      <div className="mt-auto pt-2">
        <span className="text-xs text-gray-600 group-hover:text-indigo-400 transition-colors font-medium">
          Pick this one →
        </span>
      </div>
    </button>
  )
}

export default function VSQuickView({ allTasks, projects, onPickWinner }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [pair, setPair] = useState<[TodoistTask, TodoistTask] | null>(() => pickTwo(allTasks))
  const [lastWinner, setLastWinner] = useState<TodoistTask | null>(null)

  const shuffle = useCallback(() => {
    const next = pickTwo(allTasks, done)
    setPair(next)
    setLastWinner(null)
  }, [allTasks, done])

  function pick(task: TodoistTask) {
    setLastWinner(task)
    setDone(prev => new Set([...prev, task.id]))
    onPickWinner(task)
    // Draw a fresh pair after a brief moment so user sees the pick registered
    setTimeout(() => {
      setPair(pickTwo(allTasks, new Set([...done, task.id])))
      setLastWinner(null)
    }, 600)
  }

  if (allTasks.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Need at least 2 tasks to run a VS challenge.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 py-4 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-gray-500 text-sm">Pick the one you'll do <span className="text-gray-400 font-medium">right now.</span></p>
        <div className="flex items-center gap-3">
          {done.size > 0 && <span className="text-xs text-gray-600">{done.size} done this session</span>}
          <button
            onClick={shuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5-6 6M5 3a2 2 0 0 0-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 0 0 2-2v-1M16 21h5m0 0v-5m0 5-6-6" />
            </svg>
            Shuffle
          </button>
        </div>
      </div>

      {pair ? (
        <div className="flex-1 flex items-stretch gap-6 min-h-0">
          <VSCard
            task={pair[0]}
            project={projects.find(p => p.id === pair[0].project_id)}
            onPick={() => pick(pair[0])}
          />

          <div className="flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-black text-gray-700 tracking-tight">VS</span>
          </div>

          <VSCard
            task={pair[1]}
            project={projects.find(p => p.id === pair[1].project_id)}
            onPick={() => pick(pair[1])}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          You've been through all tasks this session.{' '}
          <button onClick={() => { setDone(new Set()); shuffle() }} className="text-indigo-400 hover:text-indigo-300 ml-1 underline">Reset pool</button>
        </div>
      )}
    </div>
  )
}
