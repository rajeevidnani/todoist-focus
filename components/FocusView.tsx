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
    totalSkipped,
    error,
    handleSkip,
    handleDone,
    removeTask,
    refreshAll,
    clearError,
  } = useTaskQueue(activeLabel, activeProjectId, projects)

  const today = localToday()
  const overdueCount = allTasks.filter(t => t.due && t.due.date < today).length

  function onDone() {
    handleDone(refreshStats)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">One Task View</h1>
          <p className="text-gray-500 text-sm mt-0.5">The focus is on getting shit done — not dopamine from looking at tasks</p>
        </div>
        <button
          onClick={refreshAll}
          title="Reload tasks"
          className="mt-1 p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
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
                queueLength={queue.length}
                projects={projects}
              />
              <ActionButtons onDone={onDone} onSkip={handleSkip} isLoading={isCompleting} />
            </>
          ) : (
            <EmptyState activeLabel={activeLabel} activeProjectId={activeProjectId} projects={projects} />
          )}
        </div>

        <div className="border-l border-gray-800/50">
          <StatsWidget
            stats={stats}
            isLoading={statsLoading}
            totalSkipped={totalSkipped}
            queueLength={queue.length}
            allTasks={allTasks}
            projects={projects}
          />
        </div>
      </div>
    </div>
  )
}
