'use client'

import { useState, useEffect } from 'react'
import { TodoistProject } from '@/lib/types'

export function useProjects() {
  const [projects, setProjects] = useState<TodoistProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        // Top-level projects only, sorted by order
        const topLevel = data
          .filter((p: TodoistProject) => p.parent_id === null)
          .sort((a: TodoistProject, b: TodoistProject) => a.order - b.order)
        setProjects(topLevel)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return { projects, isLoading }
}
