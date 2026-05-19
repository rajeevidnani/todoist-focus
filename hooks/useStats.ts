'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProductivityStats } from '@/lib/types'

export function useStats() {
  const [stats, setStats] = useState<ProductivityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, isLoading, refresh }
}
