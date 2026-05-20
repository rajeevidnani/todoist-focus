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

    // priority: API stores P1=4, P4=1 — sort descending so P1 comes first
    if (b.priority !== a.priority) return b.priority - a.priority

    const aDayOrder = a.day_order === -1 ? Infinity : a.day_order
    const bDayOrder = b.day_order === -1 ? Infinity : b.day_order
    return aDayOrder - bDayOrder
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
  selectedProjectIds: Set<string>,
  selectedLabelNames: Set<string>,
  selectedPriorities: Set<number>,
  projects: TodoistProject[],
) {
  const [globalTasks, setGlobalTasks] = useState<TodoistTask[]>([])
  const [queue, setQueue] = useState<TodoistTask[]>([])
  const [totalSkipped, setTotalSkipped] = useState(0)
  const [isGlobalLoading, setIsGlobalLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Tracks IDs that have been skipped this session so the derivation
  // effect always pushes them to the back of the queue.
  const skippedIdsRef = useRef(new Set<string>())

  const projectIds = projects.map(p => p.id).join(',')

  useEffect(() => {
    if (!projectIds) return
    setIsGlobalLoading(true)
    skippedIdsRef.current = new Set()  // clear skip memory on refresh
    Promise.all(projects.map(p => fetchByProject(p.id)))
      .then(results => setGlobalTasks(sortTasks(dedupe(results.flat()))))
      .catch(err => setError(err.message))
      .finally(() => setIsGlobalLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds, refreshKey])

  // Derive queue from globalTasks + active filters.
  // Reads skippedIdsRef (not state) so this effect only re-runs when
  // tasks or filters change — not on every skip.
  useEffect(() => {
    const filtered = globalTasks
      .filter(t => selectedProjectIds.size === 0 || selectedProjectIds.has(t.project_id))
      .filter(t => selectedLabelNames.size === 0 || t.labels.some(l => selectedLabelNames.has(l)))
      .filter(t => selectedPriorities.size === 0 || selectedPriorities.has(t.priority))
    const skipped = skippedIdsRef.current
    setQueue([
      ...filtered.filter(t => !skipped.has(t.id)),
      ...filtered.filter(t => skipped.has(t.id)),
    ])
  }, [globalTasks, selectedProjectIds, selectedLabelNames, selectedPriorities])

  const allTasks = globalTasks
  const currentTask = queue[0] ?? null
  const isLoading = isGlobalLoading

  function handleSkip() {
    if (queue.length === 0) return
    skippedIdsRef.current = new Set([...skippedIdsRef.current, queue[0].id])
    setQueue(q => [...q.slice(1), q[0]])
    setTotalSkipped(c => c + 1)
  }

  async function handleDone(onSuccess?: () => void) {
    if (!currentTask) return
    setIsCompleting(true)
    try {
      const res = await fetch(`/api/tasks/${currentTask.id}/close`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to complete task')
      skippedIdsRef.current.delete(currentTask.id)
      setQueue(q => q.slice(1))
      setGlobalTasks(all => all.filter(t => t.id !== currentTask.id))
      onSuccess?.()
    } catch {
      setError('Could not complete task — please try again')
    } finally {
      setIsCompleting(false)
    }
  }

  function removeTask(id: string) {
    setGlobalTasks(all => all.filter(t => t.id !== id))
  }

  async function rescheduleTask(id: string, date: string) {
    try {
      const res = await fetch(`/api/tasks/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) throw new Error('Failed to reschedule')
      skippedIdsRef.current.delete(id)
      setQueue(q => q.filter(t => t.id !== id))
      setGlobalTasks(all => all.filter(t => t.id !== id))
    } catch {
      setError('Could not reschedule task — please try again')
    }
  }

  function refreshAll() {
    setRefreshKey(k => k + 1)
  }

  function clearError() { setError(null) }

  return {
    currentTask, queue, allTasks,
    isLoading, isCompleting, totalSkipped,
    error, handleSkip, handleDone, removeTask, rescheduleTask, refreshAll, clearError,
  }
}
