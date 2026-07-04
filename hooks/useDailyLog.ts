'use client'

import { useState, useEffect } from 'react'
import { localToday } from './useTaskQueue'

const STORAGE_KEY = 'daily-task-log'

export interface LogEntry {
  date: string
  count: number      // focusCount at last snapshot
  completed: number  // completed_today at last snapshot
  added: number      // derived: (count - prev.count) + completed
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

function toEntries(log: Record<string, StoredEntry>): LogEntry[] {
  const sorted = Object.entries(log)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)

  return sorted.map(([date, { count, completed }], i) => {
    const prev = i > 0 ? sorted[i - 1][1].count : null
    const added = prev !== null ? (count - prev) + completed : 0
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

async function pushToServer(log: Record<string, StoredEntry>) {
  try {
    await fetch('/api/trend-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    })
  } catch {}
}

export function useDailyLog(focusCount: number | null, completedToday: number): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([])

  // On mount: load local, then fetch server and merge (server wins on best narrative)
  useEffect(() => {
    const local = readLocal()
    setEntries(toEntries(local))

    fetchServerLog().then(server => {
      if (Object.keys(server).length === 0) return
      // Merge local into server (server already has best-narrative logic applied)
      // For any date, keep whichever has lower count (more growth shown)
      const merged = { ...server }
      for (const [date, entry] of Object.entries(local)) {
        if (!merged[date] || entry.count < merged[date].count) {
          merged[date] = entry
        }
      }
      writeLocal(merged)
      setEntries(toEntries(merged))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When focusCount updates: write today's snapshot locally and push to server
  useEffect(() => {
    if (focusCount === null) return
    const log = readLocal()
    log[localToday()] = { count: focusCount, completed: completedToday }
    writeLocal(log)
    setEntries(toEntries(log))
    pushToServer(log)
  }, [focusCount, completedToday])

  return entries
}
