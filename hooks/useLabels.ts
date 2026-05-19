'use client'

import { useState, useEffect } from 'react'
import { TodoistLabel } from '@/lib/types'

export function useLabels() {
  const [labels, setLabels] = useState<TodoistLabel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/labels')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        const sorted = [...data].sort((a: TodoistLabel, b: TodoistLabel) => a.order - b.order)
        setLabels(sorted)
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return { labels, isLoading, error }
}
