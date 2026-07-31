'use client'

import { useState, useEffect } from 'react'

interface FamilyMember {
  id: string
  name: string
  lastSeen: string // YYYY-MM-DD
}

const STORAGE_KEY = 'otv_family'

const DEFAULTS: FamilyMember[] = [
  { id: 'sneha',  name: 'Sneha',  lastSeen: '2026-07-24' },
  { id: 'aakira', name: 'Aakira', lastSeen: '2026-07-24' },
  { id: 'akaai',  name: 'Akaai',  lastSeen: '2026-07-24' },
  { id: 'mom',    name: 'Mom',    lastSeen: '2025-12-20' },
  { id: 'dad',    name: 'Dad',    lastSeen: '2025-12-20' },
]

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusColor(days: number): string {
  if (days < 30)  return 'text-emerald-400'
  if (days < 90)  return 'text-yellow-400'
  if (days < 180) return 'text-orange-400'
  if (days < 365) return 'text-red-400'
  return 'text-red-500'
}

function statusBg(days: number): string {
  if (days < 30)  return 'border-emerald-800/50 bg-emerald-950/20'
  if (days < 90)  return 'border-yellow-800/50 bg-yellow-950/20'
  if (days < 180) return 'border-orange-800/50 bg-orange-950/20'
  return 'border-red-800/50 bg-red-950/20'
}

function daysLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m ago`
}

export default function FamilyView() {
  const [members, setMembers] = useState<FamilyMember[]>(DEFAULTS)
  const [editing, setEditing] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setMembers(JSON.parse(stored))
    } catch {}
  }, [])

  function save(updated: FamilyMember[]) {
    setMembers(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function sawToday(id: string) {
    save(members.map(m => m.id === id ? { ...m, lastSeen: today() } : m))
  }

  function startEdit(m: FamilyMember) {
    setEditing(m.id)
    setEditDate(m.lastSeen)
  }

  function commitEdit(id: string) {
    if (editDate) save(members.map(m => m.id === id ? { ...m, lastSeen: editDate } : m))
    setEditing(null)
  }

  const sorted = [...members].sort((a, b) => daysSince(b.lastSeen) - daysSince(a.lastSeen))
  const overdue = sorted.filter(m => daysSince(m.lastSeen) >= 365)

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-8">
      <div className="max-w-lg mx-auto flex flex-col gap-3">

        {overdue.length > 0 && (
          <div className="mb-2 px-4 py-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm">
            ✈️ It's been over a year since you've seen {overdue.map(m => m.name).join(' and ')}. Time to plan a trip.
          </div>
        )}

        {sorted.map(m => {
          const days = daysSince(m.lastSeen)
          const isEditing = editing === m.id
          return (
            <div
              key={m.id}
              className={`rounded-2xl border px-4 py-4 flex items-center gap-4 ${statusBg(days)}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-300 font-semibold text-sm">{m.name[0]}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{m.name}</p>
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="date"
                      value={editDate}
                      max={today()}
                      onChange={e => setEditDate(e.target.value)}
                      className="text-xs bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={() => commitEdit(m.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(m)} className="text-left">
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDate(m.lastSeen)}
                      <span className="mx-1">·</span>
                      <span className={statusColor(days)}>{daysLabel(days)}</span>
                    </p>
                  </button>
                )}
              </div>

              {/* Saw today button */}
              {!isEditing && (
                <button
                  onClick={() => sawToday(m.id)}
                  title="Saw them today"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Saw today
                </button>
              )}
            </div>
          )
        })}

        <p className="text-gray-700 text-xs text-center mt-2">
          Tap a date to edit · "Saw today" sets it to now
        </p>
      </div>
    </div>
  )
}
