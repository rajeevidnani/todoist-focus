'use client'

import { useEffect, useState, useMemo } from 'react'
import { ALL_SKIP_EMOJIS } from '@/hooks/useSkipEmojis'

interface Props {
  onDone: () => void
  onSkip: () => void
  onReschedule: (date: string, label: string) => void
  isLoading: boolean
  activeEmojis: string[]
  onToggleEmoji: (emoji: string) => void
}

function getScheduleDate(option: 'tomorrow' | 'weekend' | 'next-week' | 'next-month'): string {
  const d = new Date()
  if (option === 'tomorrow') {
    d.setDate(d.getDate() + 1)
  } else if (option === 'weekend') {
    const day = d.getDay()
    d.setDate(d.getDate() + (day === 6 ? 7 : 6 - day))
  } else if (option === 'next-week') {
    const day = d.getDay()
    d.setDate(d.getDate() + (day === 1 ? 7 : (1 - day + 7) % 7))
  } else {
    d.setMonth(d.getMonth() + 1, 1)
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DATE_OPTIONS = [
  { id: 'tomorrow' as const, label: 'Tomorrow' },
  { id: 'weekend' as const, label: 'Weekend' },
  { id: 'next-week' as const, label: 'Next week' },
  { id: 'next-month' as const, label: 'Next month' },
]

export default function ActionButtons({ onDone, onSkip, onReschedule, isLoading, activeEmojis, onToggleEmoji }: Props) {
  const [skipOpen, setSkipOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const dates = useMemo(() => DATE_OPTIONS.map(o => ({ ...o, date: getScheduleDate(o.id) })), [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'd' || e.key === 'D' || e.key === 'Enter') {
        onDone()
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
        if (skipOpen) { onSkip(); setSkipOpen(false) }
        else setSkipOpen(true)
      } else if (e.key === 'Escape') {
        setSkipOpen(false)
        setEmojiPickerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDone, onSkip, skipOpen])

  function handleJustSkip() {
    setSkipOpen(false)
    setEmojiPickerOpen(false)
    onSkip()
  }

  function handleReschedule(date: string, label: string) {
    setSkipOpen(false)
    setEmojiPickerOpen(false)
    onReschedule(date, label)
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-4 flex flex-col gap-2">
      {/* Main buttons row */}
      <div className="flex gap-3">
        <button
          onClick={onDone}
          disabled={isLoading}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-600 text-white rounded-xl px-6 py-3 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Completing…
            </>
          ) : (
            <>
              <span>Done</span>
              <span className="text-emerald-300 text-xs font-normal opacity-90">D</span>
            </>
          )}
        </button>

        <button
          onClick={() => { if (!isLoading) setSkipOpen(o => !o) }}
          disabled={isLoading}
          className={`flex-1 border rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 ${
            skipOpen
              ? 'border-gray-500 text-white bg-gray-800'
              : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
          }`}
        >
          <span>Skip</span>
          <span className={`text-xs font-normal opacity-90 transition-transform ${skipOpen ? 'rotate-180' : ''}`}>
            {skipOpen ? '▲' : '▾'}
          </span>
          {!skipOpen && <span className="text-gray-500 text-xs font-normal opacity-90">S</span>}
        </button>
      </div>

      {/* Skip expanded panel */}
      {skipOpen && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col gap-3">
          {/* Date options */}
          <div className="flex gap-2 flex-wrap">
            {dates.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleReschedule(opt.date, opt.label)}
                className="flex-1 min-w-[70px] bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors text-center"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Just skip link */}
          <div className="flex items-center justify-between border-t border-gray-800 pt-2">
            <button
              onClick={handleJustSkip}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Just skip for now →
            </button>
            <button
              onClick={() => setEmojiPickerOpen(o => !o)}
              className={`text-xs transition-colors flex items-center gap-1 ${emojiPickerOpen ? 'text-gray-300' : 'text-gray-600 hover:text-gray-400'}`}
            >
              ✏️ taunt emojis
            </button>
          </div>

          {/* Emoji picker */}
          {emojiPickerOpen && (
            <div className="border-t border-gray-800 pt-2">
              <p className="text-gray-600 text-xs mb-2">Toggle which emojis appear on skip:</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKIP_EMOJIS.map(emoji => {
                  const on = activeEmojis.includes(emoji)
                  return (
                    <button
                      key={emoji}
                      onClick={() => onToggleEmoji(emoji)}
                      title={on ? 'Remove' : 'Add'}
                      className={`text-xl rounded-lg p-1.5 transition-all border ${
                        on
                          ? 'border-gray-500 bg-gray-800 opacity-100'
                          : 'border-gray-800 bg-transparent opacity-30 hover:opacity-60'
                      }`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
