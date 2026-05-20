'use client'

import { useState, useEffect } from 'react'
import { localToday } from './useTaskQueue'

const STORAGE_KEY = 'daily-task-log'

export interface LogEntry {
  date: string
  count: number
}

function readLog(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function toEntries(log: Record<string, number>): LogEntry[] {
  return Object.entries(log)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({ date, count }))
}

export function useDailyLog(focusCount: number | null): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([])

  useEffect(() => {
    setEntries(toEntries(readLog()))
  }, [])

  useEffect(() => {
    if (focusCount === null) return
    const log = readLog()
    log[localToday()] = focusCount
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
    } catch {}
    setEntries(toEntries(log))
  }, [focusCount])

  return entries
}
