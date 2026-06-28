'use client'

import { useState, useCallback } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onChampion: (task: TodoistTask) => void
}

interface BracketState {
  seeds: TodoistTask[]
  r1: (string | null)[]    // 4 picks
  semi: (string | null)[]  // 2 picks
  final: string | null
}

function sample8(tasks: TodoistTask[]): TodoistTask[] {
  const pool = [...tasks]
  const out: TodoistTask[] = []
  while (out.length < 8 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(i, 1)[0])
  }
  return out
}

function initBracket(tasks: TodoistTask[]): BracketState {
  return { seeds: sample8(tasks), r1: [null, null, null, null], semi: [null, null], final: null }
}

function byId(seeds: TodoistTask[], id: string | null): TodoistTask | null {
  return id ? (seeds.find(t => t.id === id) ?? null) : null
}

const PCOL: Record<number, string> = { 4: '#f87171', 3: '#fb923c', 2: '#60a5fa', 1: '#4b5563' }

function BracketCard({ task, state, onClick }: {
  task: TodoistTask | null
  state: 'idle' | 'pickable' | 'winner' | 'loser'
  onClick?: () => void
}) {
  if (!task) {
    return (
      <div className="h-10 rounded-lg border border-dashed border-gray-800 flex items-center px-3">
        <span className="text-gray-700 text-[10px]">TBD</span>
      </div>
    )
  }
  const styles = {
    idle:     'border-gray-800 bg-gray-900/60 cursor-default',
    pickable: 'border-gray-700 bg-gray-900 hover:border-indigo-400 hover:bg-indigo-950/50 cursor-pointer',
    winner:   'border-emerald-700 bg-emerald-950/50',
    loser:    'border-gray-800 bg-gray-900/20 opacity-35',
  }
  return (
    <button
      onClick={state === 'pickable' ? onClick : undefined}
      disabled={state !== 'pickable'}
      className={`h-10 w-full rounded-lg border px-2.5 flex items-center gap-2 text-left transition-all ${styles[state]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PCOL[task.priority] }} />
      <span className="flex-1 text-[11px] text-gray-200 truncate min-w-0">{task.content}</span>
      {state === 'winner' && <span className="text-emerald-400 text-[10px] flex-shrink-0">✓</span>}
    </button>
  )
}

// Wrap each matchup in a flex-1 cell so they align vertically across columns
function MatchCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-1.5 px-1">
      {children}
    </div>
  )
}

export default function VSBracketView({ allTasks, projects, onChampion }: Props) {
  const [b, setB] = useState<BracketState>(() => initBracket(allTasks))
  const [launched, setLaunched] = useState(false)

  const newBracket = useCallback(() => {
    setB(initBracket(allTasks))
    setLaunched(false)
  }, [allTasks])

  const { seeds, r1, semi, final } = b

  // Derived seed pairs and winner objects
  const r1Pairs: [TodoistTask, TodoistTask][] = [
    [seeds[0], seeds[1]], [seeds[2], seeds[3]],
    [seeds[4], seeds[5]], [seeds[6], seeds[7]],
  ]
  const semiSeeds: (TodoistTask | null)[] = [byId(seeds, r1[0]), byId(seeds, r1[1]), byId(seeds, r1[2]), byId(seeds, r1[3])]
  const finalSeeds: (TodoistTask | null)[] = [byId(seeds, semi[0]), byId(seeds, semi[1])]
  const champion = byId(seeds, final)

  const r1Done = r1.every(Boolean)
  const semiDone = semi.every(Boolean)

  function pick(round: 'r1' | 'semi' | 'final', idx: number, task: TodoistTask) {
    setB(prev => {
      if (round === 'r1') {
        const next = [...prev.r1] as (string | null)[]
        if (next[idx] !== null) return prev
        next[idx] = task.id
        return { ...prev, r1: next }
      }
      if (round === 'semi') {
        const next = [...prev.semi] as (string | null)[]
        if (next[idx] !== null) return prev
        next[idx] = task.id
        return { ...prev, semi: next }
      }
      if (prev.final !== null) return prev
      return { ...prev, final: task.id }
    })
  }

  function cardState(task: TodoistTask | null, winnerId: string | null, active: boolean): 'idle' | 'pickable' | 'winner' | 'loser' {
    if (!task) return 'idle'
    if (!active) return 'idle'
    if (winnerId === null) return 'pickable'
    return task.id === winnerId ? 'winner' : 'loser'
  }

  const phase = !r1Done ? 'Round 1' : !semiDone ? 'Semifinals' : final === null ? 'Final' : '🏆 Champion decided'

  if (allTasks.length < 8) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Need at least 8 tasks to run a bracket.</div>
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-2 pb-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <span className="text-white font-semibold text-sm">Tournament Bracket</span>
          <span className="text-gray-500 text-xs ml-3">{phase}</span>
        </div>
        <button onClick={newBracket} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5-6 6M5 3a2 2 0 0 0-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 0 0 2-2v-1M16 21h5m0 0v-5m0 5-6-6" />
          </svg>
          New bracket
        </button>
      </div>

      {/* Bracket — 4 equal columns, each a flex-col with cells that fill height proportionally */}
      <div className="flex gap-2 flex-1 min-h-0 overflow-hidden">

        {/* ── Round 1 (4 matchups → 8 task slots) ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest text-center mb-1.5 flex-shrink-0">Round 1</span>
          {r1Pairs.map(([a, b], i) => (
            <MatchCell key={i}>
              <BracketCard task={a} state={cardState(a, r1[i], true)} onClick={() => pick('r1', i, a)} />
              <BracketCard task={b} state={cardState(b, r1[i], true)} onClick={() => pick('r1', i, b)} />
            </MatchCell>
          ))}
        </div>

        {/* ── Semis (2 matchups → 4 slots) ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest text-center mb-1.5 flex-shrink-0">Semis</span>
          {/* Each semi cell spans 2 R1 cells, so wrap 2 cells in 1 flex-[2] */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <MatchCell>
              <BracketCard task={semiSeeds[0]} state={cardState(semiSeeds[0], semi[0], r1Done)} onClick={() => semiSeeds[0] && pick('semi', 0, semiSeeds[0])} />
              <BracketCard task={semiSeeds[1]} state={cardState(semiSeeds[1], semi[0], r1Done)} onClick={() => semiSeeds[1] && pick('semi', 0, semiSeeds[1])} />
            </MatchCell>
          </div>
          <div className="flex-[2] min-h-0 flex flex-col">
            <MatchCell>
              <BracketCard task={semiSeeds[2]} state={cardState(semiSeeds[2], semi[1], r1Done)} onClick={() => semiSeeds[2] && pick('semi', 1, semiSeeds[2])} />
              <BracketCard task={semiSeeds[3]} state={cardState(semiSeeds[3], semi[1], r1Done)} onClick={() => semiSeeds[3] && pick('semi', 1, semiSeeds[3])} />
            </MatchCell>
          </div>
        </div>

        {/* ── Final (1 matchup) ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest text-center mb-1.5 flex-shrink-0">Final</span>
          <MatchCell>
            <BracketCard task={finalSeeds[0]} state={cardState(finalSeeds[0], final, semiDone)} onClick={() => finalSeeds[0] && pick('final', 0, finalSeeds[0])} />
            <BracketCard task={finalSeeds[1]} state={cardState(finalSeeds[1], final, semiDone)} onClick={() => finalSeeds[1] && pick('final', 0, finalSeeds[1])} />
          </MatchCell>
        </div>

        {/* ── Champion ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest text-center mb-1.5 flex-shrink-0">Champion</span>
          <div className="flex-1 flex flex-col items-center justify-center px-1">
            {champion ? (
              <div className="w-full bg-indigo-950/60 border-2 border-indigo-600 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🏆</span>
                  <span className="text-indigo-300 text-[10px] font-semibold uppercase tracking-wide">Winner</span>
                </div>
                <p className="text-white font-semibold text-xs leading-snug line-clamp-3">{champion.content}</p>
                <p className="text-indigo-400 text-[10px]">{projects.find(p => p.id === champion.project_id)?.name}</p>
                {!launched ? (
                  <button
                    onClick={() => { setLaunched(true); onChampion(champion) }}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors mt-1"
                  >
                    Start this task →
                  </button>
                ) : (
                  <span className="text-emerald-400 text-xs text-center">Loaded into Focus ✓</span>
                )}
              </div>
            ) : (
              <div className="w-full border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center py-8">
                <span className="text-gray-700 text-xs text-center px-2">Pick your way<br/>through the rounds</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
