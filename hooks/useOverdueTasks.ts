'use client'

import { useState, useCallback } from 'react'
import { TodoistTask } from '@/lib/types'
import { localToday } from './useTaskQueue'

export function useOverdueTasks(allTasks: TodoistTask[], onReschedule: (id: string) => void) {
  const [rescheduling, setRescheduling] = useState<Record<string, boolean>>({})
  const [rescheduled, setRescheduled] = useState<Set<string>>(new Set())

  const overdue = allTasks
    .filter(t => t.due && t.due.date < localToday())
    .sort((a, b) => {
      const aDate = a.due!.date
      const bDate = b.due!.date
      if (aDate !== bDate) return aDate < bDate ? -1 : 1
      return a.child_order - b.child_order
    })

  const reschedule = useCallback(async (task: TodoistTask, dueString: string) => {
    setRescheduling(r => ({ ...r, [task.id]: true }))
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_string: dueString }),
      })
      if (!res.ok) throw new Error('Failed to reschedule')
      setRescheduled(s => new Set(s).add(task.id))
      // Brief delay so the user sees the "done" state before it disappears
      setTimeout(() => onReschedule(task.id), 600)
    } catch {
      // silently fail — task stays in list
    } finally {
      setRescheduling(r => ({ ...r, [task.id]: false }))
    }
  }, [onReschedule])

  return { overdue, rescheduling, rescheduled, reschedule }
}
