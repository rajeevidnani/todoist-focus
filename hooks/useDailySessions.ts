'use client'

import { useState, useEffect } from 'react'
import { localToday } from './useTaskQueue'

export const CATEGORIES = ['work', 'career', 'personal'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  work: 'Work',
  career: 'Career',
  personal: 'Personal',
}

interface Stored {
  date: string
  done: Record<Category, boolean>
}

const STORAGE_KEY = 'pomodoro-sessions'
const EMPTY: Record<Category, boolean> = { work: false, career: false, personal: false }

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: localToday(), done: { ...EMPTY } }
    const parsed: Stored = JSON.parse(raw)
    // Reset if it's a new day
    if (parsed.date !== localToday()) return { date: localToday(), done: { ...EMPTY } }
    return parsed
  } catch {
    return { date: localToday(), done: { ...EMPTY } }
  }
}

function save(stored: Stored) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)) } catch {}
}

export function useDailySessions() {
  const [stored, setStored] = useState<Stored>({ date: localToday(), done: { ...EMPTY } })

  useEffect(() => { setStored(load()) }, [])

  function toggle(cat: Category) {
    setStored(prev => {
      const next = { ...prev, done: { ...prev.done, [cat]: !prev.done[cat] } }
      save(next)
      return next
    })
  }

  function setDone(cat: Category, value: boolean) {
    setStored(prev => {
      const next = { ...prev, done: { ...prev.done, [cat]: value } }
      save(next)
      return next
    })
  }

  const completedCount = CATEGORIES.filter(c => stored.done[c]).length

  return { done: stored.done, toggle, setDone, completedCount }
}
