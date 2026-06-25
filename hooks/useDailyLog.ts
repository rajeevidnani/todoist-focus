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

function readLog(): Record<string, StoredEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Migrate old format: {date: number} → {date: {count, completed}}
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

export function useDailyLog(focusCount: number | null, completedToday: number): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([])

  useEffect(() => {
    setEntries(toEntries(readLog()))
  }, [])

  useEffect(() => {
    if (focusCount === null) return
    const log = readLog()
    log[localToday()] = { count: focusCount, completed: completedToday }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
    } catch {}
    setEntries(toEntries(log))
  }, [focusCount, completedToday])

  return entries
}
