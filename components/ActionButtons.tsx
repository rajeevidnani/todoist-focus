'use client'

import { useEffect } from 'react'

interface Props {
  onDone: () => void
  onSkip: () => void
  isLoading: boolean
}

export default function ActionButtons({ onDone, onSkip, isLoading }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'd' || e.key === 'D' || e.key === 'Enter') {
        onDone()
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
        onSkip()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDone, onSkip])

  return (
    <div className="flex gap-3 w-full max-w-xl mx-auto mt-4">
      <button
        onClick={onDone}
        disabled={isLoading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-600 text-white rounded-xl px-6 py-3 font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Completing…
          </>
        ) : (
          <>
            <span>Done</span>
            <span className="text-emerald-300 text-xs font-normal opacity-70">D</span>
          </>
        )}
      </button>
      <button
        onClick={onSkip}
        disabled={isLoading}
        className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white disabled:opacity-40 rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
      >
        <span>Skip</span>
        <span className="text-gray-500 text-xs font-normal">S</span>
      </button>
    </div>
  )
}
