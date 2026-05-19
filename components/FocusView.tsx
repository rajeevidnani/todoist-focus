'use client'

import { useState } from 'react'
import { useTaskQueue, localToday } from '@/hooks/useTaskQueue'
import { useLabels } from '@/hooks/useLabels'
import { useProjects } from '@/hooks/useProjects'
import { useStats } from '@/hooks/useStats'
import TaskCard from './TaskCard'
import ActionButtons from './ActionButtons'
import FilterBar from './FilterBar'
import StatsWidget from './StatsWidget'
import EmptyState from './EmptyState'
import TabBar from './TabBar'
import OverdueManager from './OverdueManager'

export default function FocusView() {
  const [activeTab, setActiveTab] = useState<'focus' | 'overdue'>('focus')
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const { labels } = useLabels()
  const { projects } = useProjects()
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useStats()
  const {
    currentTask,
    queue,
    allTasks,
    isLoading,
    isCompleting,
    isFullySkipped,
    totalSkipped,
    error,
    handleSkip,
    handleDone,
    removeTask,
    clearError,
  } = useTaskQueue(activeLabel, activeProjectId, projects)

  const today = localToday()
  const overdueCount = allTasks.filter(t => t.due && t.due.date < today).length

  function onDone() {
    handleDone(refreshStats)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-white text-xl font-semibold tracking-tight">One Task View</h1>
        <p className="text-gray-500 text-sm mt-0.5">The focus is on getting shit done — not dopamine from looking at tasks</p>
      </header>

      <TabBar activeTab={activeTab} overdueCount={overdueCount} onSelect={setActiveTab} />

      {activeTab === 'focus' && (
        <FilterBar
          projects={projects}
          labels={labels}
          activeProjectId={activeProjectId}
          activeLabel={activeLabel}
          onSelectProject={setActiveProjectId}
          onSelectLabel={setActiveLabel}
        />
      )}

      <div className="flex-1 flex min-h-0">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {error && (
            <div className="w-full max-w-xl mb-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {activeTab === 'overdue' ? (
            <OverdueManager allTasks={allTasks} onReschedule={removeTask} />
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading tasks…</span>
            </div>
          ) : currentTask ? (
            <>
              <TaskCard
                key={currentTask.id}
                task={currentTask}
                isFullySkipped={isFullySkipped}
                queueLength={queue.length}
              />
              <ActionButtons onDone={onDone} onSkip={handleSkip} isLoading={isCompleting} />
            </>
          ) : (
            <EmptyState activeLabel={activeLabel} activeProjectId={activeProjectId} projects={projects} />
          )}
        </div>

        {/* Stats panel */}
        <div className="border-l border-gray-800/50">
          <StatsWidget stats={stats} isLoading={statsLoading} totalSkipped={totalSkipped} />
        </div>
      </div>
    </div>
  )
}
