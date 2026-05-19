'use client'

import { useState, useEffect, useRef } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

export function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localDatePlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sortTasks(tasks: TodoistTask[]): TodoistTask[] {
  return [...tasks].sort((a, b) => {
    const aDate = a.due?.date ?? '9999-99-99'
    const bDate = b.due?.date ?? '9999-99-99'
    if (aDate !== bDate) return aDate < bDate ? -1 : 1

    const aDayOrder = a.day_order === -1 ? Infinity : a.day_order
    const bDayOrder = b.day_order === -1 ? Infinity : b.day_order
    if (aDayOrder !== bDayOrder) return aDayOrder - bDayOrder

    return a.child_order - b.child_order
  })
}

async function fetchByProject(projectId: string): Promise<TodoistTask[]> {
  const res = await fetch(`/api/tasks?project_id=${projectId}&limit=200`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  const cutoff = localDatePlus(30)
  // Keep overdue + next 30 days; no due date tasks are excluded
  return (data as TodoistTask[]).filter(t => t.due && t.due.date <= cutoff)
}

function dedupe(tasks: TodoistTask[]): TodoistTask[] {
  const seen = new Set<string>()
  return tasks.filter(t => seen.has(t.id) ? false : (seen.add(t.id), true))
}

export function useTaskQueue(
  activeLabel: string | null,
  activeProjectId: string | null,
  projects: TodoistProject[],
) {
  const [globalTasks, setGlobalTasks] = useState<TodoistTask[]>([])
  const [projectTasks, setProjectTasks] = useState<TodoistTask[]>([])
  const [projectLoadingId, setProjectLoadingId] = useState<string | null>(null)
  const [queue, setQueue] = useState<TodoistTask[]>([])
  const [skipCount, setSkipCount] = useState(0)
  const [totalSkipped, setTotalSkipped] = useState(0)
  const [isGlobalLoading, setIsGlobalLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const globalFetched = useRef(false)

  // Global fetch: one call per project in parallel so no project gets crowded out
  useEffect(() => {
    if (projects.length === 0 || globalFetched.current) return
    globalFetched.current = true
    setIsGlobalLoading(true)

    Promise.all(projects.map(p => fetchByProject(p.id)))
      .then(results => {
        const combined = dedupe(results.flat())
        setGlobalTasks(sortTasks(combined))
      })
      .catch(err => setError(err.message))
      .finally(() => setIsGlobalLoading(false))
  }, [projects])

  // Per-project fetch when a project filter is selected
  useEffect(() => {
    if (!activeProjectId) { setProjectTasks([]); return }
    setProjectLoadingId(activeProjectId)
    fetchByProject(activeProjectId)
      .then(tasks => setProjectTasks(sortTasks(tasks)))
      .catch(err => setError(err.message))
      .finally(() => setProjectLoadingId(null))
  }, [activeProjectId])

  // Derive queue from correct source
  useEffect(() => {
    const source = activeProjectId ? projectTasks : globalTasks
    const filtered = activeLabel ? source.filter(t => t.labels.includes(activeLabel)) : source
    setQueue(filtered)
    setSkipCount(0)
  }, [globalTasks, projectTasks, activeLabel, activeProjectId])

  const allTasks = globalTasks
  const currentTask = queue[0] ?? null
  const isFullySkipped = queue.length > 0 && skipCount >= queue.length
  const isLoading = isGlobalLoading || projectLoadingId !== null

  function handleSkip() {
    if (queue.length === 0) return
    setQueue(q => [...q.slice(1), q[0]])
    setSkipCount(c => c + 1)
    setTotalSkipped(c => c + 1)
  }

  async function handleDone(onSuccess?: () => void) {
    if (!currentTask) return
    setIsCompleting(true)
    try {
      const res = await fetch(`/api/tasks/${currentTask.id}/close`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to complete task')
      setQueue(q => q.slice(1))
      setGlobalTasks(all => all.filter(t => t.id !== currentTask.id))
      setProjectTasks(all => all.filter(t => t.id !== currentTask.id))
      setSkipCount(0)
      onSuccess?.()
    } catch {
      setError('Could not complete task — please try again')
    } finally {
      setIsCompleting(false)
    }
  }

  function removeTask(id: string) {
    setGlobalTasks(all => all.filter(t => t.id !== id))
    setProjectTasks(all => all.filter(t => t.id !== id))
  }

  function clearError() { setError(null) }

  return {
    currentTask, queue, allTasks,
    isLoading, isCompleting, isFullySkipped, totalSkipped,
    error, handleSkip, handleDone, removeTask, clearError,
  }
}
