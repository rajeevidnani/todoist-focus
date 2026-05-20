'use client'

import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light' | 'todoist'

const THEMES: Theme[] = ['dark', 'light', 'todoist']
const STORAGE_KEY = 'focus-theme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved && THEMES.includes(saved)) setTheme(saved)
  }, [])

  function pickTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  return [theme, pickTheme]
}
