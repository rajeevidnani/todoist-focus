'use client'

import { useState, useEffect } from 'react'
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
  const [totalSkipped, setTotalSkipped] = useState(0)
  const [isGlobalLoading, setIsGlobalLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Stable key from project IDs — fires when projects first load or on manual refresh
  const projectIds = projects.map(p => p.id).join(',')

  useEffect(() => {
    if (!projectIds) return
    setIsGlobalLoading(true)
    Promise.all(projects.map(p => fetchByProject(p.id)))
      .then(results => setGlobalTasks(sortTasks(dedupe(results.flat()))))
      .catch(err => setError(err.message))
      .finally(() => setIsGlobalLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds, refreshKey])

  // Per-project fetch when a specific project is selected
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
  }, [globalTasks, projectTasks, activeLabel, activeProjectId])

  const allTasks = globalTasks
  const currentTask = queue[0] ?? null
  const isLoading = isGlobalLoading || projectLoadingId !== null

  function handleSkip() {
    if (queue.length === 0) return
    // Permanently remove from session queue — don't cycle back
    setQueue(q => q.slice(1))
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

  function refreshAll() {
    setRefreshKey(k => k + 1)
  }

  function clearError() { setError(null) }

  return {
    currentTask, queue, allTasks,
    isLoading, isCompleting, totalSkipped,
    error, handleSkip, handleDone, removeTask, refreshAll, clearError,
  }
}
