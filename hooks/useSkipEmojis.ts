'use client'

import { useState, useEffect } from 'react'

export const ALL_SKIP_EMOJIS = ['🙄', '😬', '👀', '💀', '🫠', '😅', '🤡', '😈', '🦥', '🫣', '😤', '🤦', '🙈', '⏰', '😵']
const DEFAULT_ACTIVE = ['🙄', '😬', '👀', '💀', '🫠']
const STORAGE_KEY = 'skip-emojis'

export function useSkipEmojis() {
  const [active, setActive] = useState<string[]>(DEFAULT_ACTIVE)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (Array.isArray(saved) && saved.length > 0) setActive(saved)
    } catch {}
  }, [])

  function toggle(emoji: string) {
    setActive(prev => {
      const next = prev.includes(emoji)
        ? prev.length > 1 ? prev.filter(e => e !== emoji) : prev  // keep at least 1
        : [...prev, emoji]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { active, toggle }
}
