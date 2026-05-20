'use client'

import { useState } from 'react'
import { useTaskQueue, localToday } from '@/hooks/useTaskQueue'
import { useLabels } from '@/hooks/useLabels'
import { useProjects } from '@/hooks/useProjects'
import { useStats } from '@/hooks/useStats'
import { useTheme } from '@/hooks/useTheme'
import { useSkipEmojis } from '@/hooks/useSkipEmojis'
import TaskCard from './TaskCard'
import ActionButtons from './ActionButtons'
import FilterBar from './FilterBar'
import StatsWidget from './StatsWidget'
import EmptyState from './EmptyState'
import TabBar from './TabBar'
import OverdueManager from './OverdueManager'

const THEMES: { value: import('@/hooks/useTheme').Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'todoist', label: 'Todoist' },
]

export default function FocusView() {
  const [activeTab, setActiveTab] = useState<'focus' | 'overdue'>('focus')
  const [themeOpen, setThemeOpen] = useState(false)
  const [theme, pickTheme] = useTheme()
  const { active: skipEmojis, toggle: toggleEmoji } = useSkipEmojis()
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())
  const [selectedLabelNames, setSelectedLabelNames] = useState<Set<string>>(new Set())
  const [selectedPriorities, setSelectedPriorities] = useState<Set<number>>(new Set())
  const [animState, setAnimState] = useState<'idle' | 'done' | 'skip'>('idle')

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
    rescheduleTask,
    refreshAll,
    clearError,
  } = useTaskQueue(selectedProjectIds, selectedLabelNames, selectedPriorities, projects)

  const today = localToday()
  const overdueCount = allTasks.filter(t => t.due && t.due.date < today).length

  function toggleProject(id: string) {
    setSelectedProjectIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleLabel(name: string) {
    setSelectedLabelNames(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function togglePriority(priority: number) {
    setSelectedPriorities(prev => {
      const next = new Set(prev)
      next.has(priority) ? next.delete(priority) : next.add(priority)
      return next
    })
  }

  function onDone() {
    if (animState !== 'idle') return
    setAnimState('done')
    setTimeout(() => {
      setAnimState('idle')
      handleDone(refreshStats)
    }, 1600)
  }

  function onSkip() {
    if (animState !== 'idle') return
    setAnimState('skip')
    setTimeout(() => {
      setAnimState('idle')
      handleSkip()
    }, 720)
  }

  function onReschedule(date: string) {
    if (!currentTask || animState !== 'idle') return
    setAnimState('skip')
    setTimeout(() => {
      setAnimState('idle')
      rescheduleTask(currentTask.id, date)
    }, 720)
  }

  const hasFilters = selectedProjectIds.size > 0 || selectedLabelNames.size > 0 || selectedPriorities.size > 0

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" data-theme={theme}>
      <header className="px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold tracking-tight">One Task View</h1>
          <p className="text-gray-500 text-sm mt-0.5">The focus is on getting shit done — not dopamine from looking at tasks</p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {/* Theme dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen(o => !o)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800 text-xs font-medium"
            >
              Theme
              <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>
            {themeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setThemeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden min-w-[120px]">
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { pickTheme(t.value); setThemeOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === t.value
                          ? 'text-white bg-gray-800'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={refreshAll}
            title="Reload tasks"
            className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">

        {/* Main content: task on top, filters + tabs pinned to bottom */}
        <div className="flex-[2] min-w-0 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col items-center pt-8 px-4 overflow-y-auto">
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
                  queueLength={allTasks.length}
                  projects={projects}
                  animState={animState}
                  skipEmojis={skipEmojis}
                />
                <ActionButtons
                  onDone={onDone}
                  onSkip={onSkip}
                  onReschedule={onReschedule}
                  isLoading={isCompleting || animState !== 'idle'}
                  activeEmojis={skipEmojis}
                  onToggleEmoji={toggleEmoji}
                />
              </>
            ) : (
              <EmptyState hasFilters={hasFilters} />
            )}
          </div>

          {activeTab === 'focus' && (
            <FilterBar
              projects={projects}
              labels={labels}
              selectedProjectIds={selectedProjectIds}
              selectedLabelNames={selectedLabelNames}
              selectedPriorities={selectedPriorities}
              onToggleProject={toggleProject}
              onToggleLabel={toggleLabel}
              onTogglePriority={togglePriority}
            />
          )}
          <TabBar activeTab={activeTab} overdueCount={overdueCount} onSelect={setActiveTab} />
        </div>

        {/* Stats panel */}
        <div className="w-52 flex-shrink-0 border-l border-gray-800/50 p-4 flex flex-col">
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
