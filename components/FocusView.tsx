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
import { Tab } from './TabBar'
import OverdueManager from './OverdueManager'
import PomodoroTimer from './PomodoroTimer'
import YearProgress from './YearProgress'
import WeekendsLeft from './WeekendsLeft'
import AnalyticsView from './AnalyticsView'
import MobileStats from './MobileStats'
import AllTasksView from './AllTasksView'
import VSQuickView from './VSQuickView'
import VSBracketView from './VSBracketView'

const THEMES: { value: import('@/hooks/useTheme').Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'todoist', label: 'Todoist' },
]

export default function FocusView() {
  const [activeTab, setActiveTab] = useState<Tab>('focus')
  const [themeOpen, setThemeOpen] = useState(false)
  const [theme, pickTheme] = useTheme()
  const { active: skipEmojis, toggle: toggleEmoji } = useSkipEmojis()
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())
  const [selectedLabelNames, setSelectedLabelNames] = useState<Set<string>>(new Set())
  const [selectedPriorities, setSelectedPriorities] = useState<Set<number>>(new Set())
  const [hideWaiting, setHideWaiting] = useState(false)
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
  } = useTaskQueue(selectedProjectIds, selectedLabelNames, selectedPriorities, projects, hideWaiting)

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

  async function closeAnyTask(id: string) {
    try {
      await fetch(`/api/tasks/${id}/close`, { method: 'POST' })
      removeTask(id)
      refreshStats()
    } catch {}
  }

  function loadTaskInFocus(task: import('@/lib/types').TodoistTask) {
    // Push the chosen task to the front of the queue by temporarily
    // making it the only selected item via refreshAll — simplest approach
    // is just to switch to Focus tab; the task will appear when queue re-derives.
    // For VS: set the task as pinned currentTask by switching tab.
    setActiveTab('focus')
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
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-gray-950 flex flex-col" data-theme={theme}>
      <header className="px-4 md:px-6 pt-6 md:pt-8 pb-3 md:pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <circle cx="50" cy="50" r="46" stroke="#1e3a8a" strokeWidth="4"/>
            <path d="M45 25V75H55V25H45Z" fill="#1e3a8a"/>
            <path d="M40 35L45 25H55L45 35H40Z" fill="#172554"/>
          </svg>
          {/* Title — hidden on mobile */}
          <div className="hidden md:block">
            <h1 className="text-white text-xl font-semibold tracking-tight">One Task View</h1>
            <p className="text-gray-500 text-sm mt-0.5">The focus is on getting shit done — not dopamine from looking at tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Tab nav */}
          <div className="flex items-center gap-0.5 mr-1">
            {([
              { id: 'focus' as Tab, label: 'Focus' },
              { id: 'overdue' as Tab, label: 'Overdue', badge: overdueCount || undefined },
              { id: 'analytics' as Tab, label: 'Analytics' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === t.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                {t.label}
                {t.badge != null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.id ? 'bg-red-500/30 text-red-300' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

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

      {activeTab === 'analytics' ? (
        /* Analytics — full width, no side panels */
        <div className="flex-1 overflow-y-auto pt-6 px-6 min-h-0">
          {error && (
            <div className="w-full max-w-5xl mx-auto mb-4 bg-red-950/50 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-4 text-lg leading-none">×</button>
            </div>
          )}
          <AnalyticsView
            stats={stats}
            isLoading={statsLoading}
            totalSkipped={totalSkipped}
            allTasks={allTasks}
            projects={projects}
          />
        </div>
      ) : activeTab === 'all-tasks' ? (
        /* All Tasks — full width, internally scrollable */
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <AllTasksView allTasks={allTasks} projects={projects} onCloseTask={closeAnyTask} />
          <FilterBar
            projects={projects} labels={labels}
            selectedProjectIds={selectedProjectIds} selectedLabelNames={selectedLabelNames} selectedPriorities={selectedPriorities}
            onToggleProject={toggleProject} onToggleLabel={toggleLabel} onTogglePriority={togglePriority}
          />
        </div>
      ) : activeTab === 'vs-quick' ? (
        /* Quick VS — full width */
        <div className="flex-1 flex flex-col min-h-0">
          <VSQuickView allTasks={allTasks} projects={projects} onPickWinner={loadTaskInFocus} />
          <FilterBar
            projects={projects} labels={labels}
            selectedProjectIds={selectedProjectIds} selectedLabelNames={selectedLabelNames} selectedPriorities={selectedPriorities}
            onToggleProject={toggleProject} onToggleLabel={toggleLabel} onTogglePriority={togglePriority}
          />
        </div>
      ) : activeTab === 'vs-bracket' ? (
        /* Tournament Bracket — full width */
        <div className="flex-1 flex flex-col min-h-0">
          <VSBracketView allTasks={allTasks} projects={projects} onChampion={loadTaskInFocus} />
          <FilterBar
            projects={projects} labels={labels}
            selectedProjectIds={selectedProjectIds} selectedLabelNames={selectedLabelNames} selectedPriorities={selectedPriorities}
            onToggleProject={toggleProject} onToggleLabel={toggleLabel} onTogglePriority={togglePriority}
          />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">

          {/* Left panel — desktop only */}
          <div className="hidden md:flex w-52 flex-shrink-0 border-r border-gray-800/50 p-4 flex-col gap-3 overflow-y-auto scrollbar-none">
            <PomodoroTimer />
            <YearProgress />
            <WeekendsLeft />
          </div>

          {/* Main content */}
          <div className="flex-[2] min-w-0 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col items-center pt-4 md:pt-6 px-4 min-h-0 overflow-y-auto scrollbar-none">
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
                  <button
                    onClick={() => setHideWaiting(v => !v)}
                    className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      hideWaiting
                        ? 'bg-gray-800 text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                    title="Toggle whether really_waiting tasks appear in the queue"
                  >
                    {hideWaiting ? '🙈 really_waiting hidden' : '👀 really_waiting showing'}
                  </button>
                </>
              ) : (
                <EmptyState hasFilters={hasFilters} />
              )}

              {/* Mobile-only: key stats + trend below the task */}
              <div className="md:hidden w-full max-w-xl">
                <MobileStats
                  stats={stats}
                  isLoading={statsLoading}
                  totalSkipped={totalSkipped}
                  allTasks={allTasks}
                />

                {/* Pomodoro / Year / Weekends — scroll to */}
                <div className="flex flex-col gap-3 mt-3 pb-8">
                  <PomodoroTimer />
                  <YearProgress />
                  <WeekendsLeft />
                </div>
              </div>
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
          </div>

          {/* Stats panel — desktop only */}
          <div className="hidden md:flex w-52 flex-shrink-0 border-l border-gray-800/50 p-4 flex-col overflow-y-auto scrollbar-none">
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
      )}
    </div>
  )
}
