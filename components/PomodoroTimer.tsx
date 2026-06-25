'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDailySessions, CATEGORIES, CATEGORY_LABELS, Category } from '@/hooks/useDailySessions'

const POMODORO_MIN = 25

function playDone() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.35, 0.7].forEach(offset => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 660
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, ctx.currentTime + offset)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + offset + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.5)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.55)
    })
  } catch {}
}

export default function PomodoroTimer() {
  const { done, setDone, completedCount } = useDailySessions()
  const [activeGoal, setActiveGoal] = useState<Category | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MIN * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = POMODORO_MIN * 60
  const progress = (total - secondsLeft) / total
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  useEffect(() => {
    if (!running) { stop(); return }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          stop()
          setRunning(false)
          setActiveGoal(g => {
            if (g) setDone(g, true)
            return null
          })
          playDone()
          return POMODORO_MIN * 60
        }
        return s - 1
      })
    }, 1000)
    return stop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stop])

  useEffect(() => {
    if (running && activeGoal) document.title = `${display} · ${CATEGORY_LABELS[activeGoal]}`
    else document.title = 'One Task View'
    return () => { document.title = 'One Task View' }
  }, [running, display, activeGoal])

  function handleGoalClick(cat: Category) {
    // While a session runs, the other goals are locked.
    if (running) return
    // Clicking a completed goal when idle un-marks it (in case of a mistake).
    if (done[cat]) { setDone(cat, false); return }
    // Otherwise start a fresh pomodoro for this goal.
    setActiveGoal(cat)
    setSecondsLeft(POMODORO_MIN * 60)
    setRunning(true)
  }

  function togglePause() {
    if (!activeGoal) return
    setRunning(r => !r)
  }

  function cancel() {
    stop()
    setRunning(false)
    setActiveGoal(null)
    setSecondsLeft(POMODORO_MIN * 60)
  }

  // Ring
  const R = 36
  const CIRC = 2 * Math.PI * R
  const strokeDash = CIRC * (1 - progress)
  const ringColor = running ? '#818cf8' : activeGoal ? '#fbbf24' : '#374151'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 flex-shrink-0 flex flex-col gap-3">
      {/* Timer ring */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
          <svg width="96" height="96" className="absolute inset-0 -rotate-90">
            <circle cx="48" cy="48" r={R} fill="none" stroke="#1f2937" strokeWidth="4" />
            <circle
              cx="48" cy="48" r={R} fill="none"
              stroke={ringColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
            />
          </svg>
          <span className="text-lg font-bold tabular-nums tracking-tight z-10 text-white">{display}</span>
        </div>
        <p className="text-gray-500 text-xs h-4">
          {activeGoal
            ? <span><span className="text-gray-300">{CATEGORY_LABELS[activeGoal]}</span> {running ? 'in progress' : 'paused'}</span>
            : <span>Pick a goal to start</span>}
        </p>
      </div>

      {/* Goal buttons (one pomodoro each per day) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">Today’s goals</span>
          <span className={`text-xs font-medium tabular-nums ${completedCount >= 3 ? 'text-emerald-400' : 'text-gray-500'}`}>{completedCount}/3</span>
        </div>
        <div className="flex gap-1.5">
          {CATEGORIES.map(cat => {
            const isDone = done[cat]
            const isActive = activeGoal === cat
            const locked = running && !isActive
            return (
              <button
                key={cat}
                onClick={() => handleGoalClick(cat)}
                disabled={locked}
                title={isDone ? `${CATEGORY_LABELS[cat]} done today — click to undo` : `Start a ${CATEGORY_LABELS[cat]} pomodoro`}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isDone
                    ? 'bg-emerald-900/40 border-emerald-800 text-emerald-400'
                    : isActive
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : locked
                        ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                        : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {isDone ? '✓ ' : ''}{CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>

        {/* Pause / cancel only while a session is active */}
        {activeGoal && (
          <div className="flex gap-1.5">
            <button
              onClick={togglePause}
              className="flex-1 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              {running ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={cancel}
              className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
