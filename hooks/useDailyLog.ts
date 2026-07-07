'use client'

import { useState, useEffect } from 'react'
import { localToday } from './useTaskQueue'

const STORAGE_KEY = 'daily-task-log'

export interface LogEntry {
  date: string
  count: number
  completed: number
  added: number
}

interface StoredEntry {
  count: number
  completed: number
}

function readLocal(): Record<string, StoredEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const result: Record<string, StoredEntry> = {}
    for (const [date, val] of Object.entries(parsed)) {
      if (typeof val === 'number') {
        result[date] = { count: val, completed: 0 }
      } else {
        result[date] = val as StoredEntry
      }
    }
    return result
  } catch {
    return {}
  }
}

function writeLocal(log: Record<string, StoredEntry>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)) } catch {}
}

function toEntries(log: Record<string, StoredEntry>, addedToday: number | null): LogEntry[] {
  const sorted = Object.entries(log)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)

  const today = localToday()

  return sorted.map(([date, { count, completed }], i) => {
    let added: number
    if (date === today && addedToday !== null) {
      // Use the accurate server-derived count for today
      added = addedToday
    } else {
      // Fall back to derived formula for historical days
      const prev = i > 0 ? sorted[i - 1][1].count : null
      added = prev !== null ? Math.max(0, (count - prev) + completed) : 0
    }
    return { date, count, completed, added }
  })
}

async function fetchServerLog(): Promise<Record<string, StoredEntry>> {
  try {
    const res = await fetch('/api/trend-log')
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

async function pushTrendLog(log: Record<string, StoredEntry>) {
  try {
    await fetch('/api/trend-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    })
  } catch {}
}

async function pushTaskSnapshot(date: string, ids: string[]): Promise<number | null> {
  try {
    const res = await fetch('/api/task-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, ids }),
    })
    const data = await res.json()
    return typeof data.added === 'number' ? data.added : null
  } catch {
    return null
  }
}

export function useDailyLog(
  focusCount: number | null,
  completedToday: number,
  taskIds: string[] = [],
): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [addedToday, setAddedToday] = useState<number | null>(null)

  // On mount: load local, then sync with server
  useEffect(() => {
    const local = readLocal()
    setEntries(toEntries(local, null))

    fetchServerLog().then(server => {
      if (Object.keys(server).length === 0) return
      const merged = { ...server }
      for (const [date, entry] of Object.entries(local)) {
        if (entry.count > 0 && (!merged[date] || merged[date].count === 0 || entry.count < merged[date].count)) {
          merged[date] = entry
        }
      }
      writeLocal(merged)
      setEntries(toEntries(merged, null))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When tasks load: push snapshot to get accurate added count
  useEffect(() => {
    if (taskIds.length === 0) return
    const today = localToday()
    pushTaskSnapshot(today, taskIds).then(added => {
      if (added !== null) setAddedToday(added)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIds.join(',')])

  // When focusCount updates: write today's snapshot locally and push trend log
  useEffect(() => {
    if (focusCount === null || focusCount === 0) return
    const log = readLocal()
    log[localToday()] = { count: focusCount, completed: completedToday }
    writeLocal(log)
    setEntries(toEntries(log, addedToday))
    pushTrendLog(log)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCount, completedToday])

  // Re-derive entries when addedToday resolves
  useEffect(() => {
    if (addedToday === null) return
    const log = readLocal()
    setEntries(toEntries(log, addedToday))
  }, [addedToday])

  return entries
}
