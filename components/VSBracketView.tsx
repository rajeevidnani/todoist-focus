'use client'

import { useState, useCallback } from 'react'
import { TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  onChampion: (task: TodoistTask) => void
}

interface BracketState {
  seeds: TodoistTask[]       // 8
  r1: (string | null)[]     // 4 winners (by id)
  semi: (string | null)[]   // 2 winners
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

function getTask(seeds: TodoistTask[], id: string | null): TodoistTask | null {
  if (!id) return null
  return seeds.find(t => t.id === id) ?? null
}

const PRIORITY_COLOR: Record<number, string> = {
  4: '#f87171', 3: '#fb923c', 2: '#60a5fa', 1: '#6b7280',
}

function BracketCard({ task, onClick, state }: {
  task: TodoistTask | null
  onClick?: () => void
  state: 'pickable' | 'winner' | 'loser' | 'tbd'
}) {
  if (!task) {
    return (
      <div className="h-11 rounded-lg border border-dashed border-gray-800 flex items-center justify-center">
        <span className="text-gray-700 text-xs">TBD</span>
      </div>
    )
  }

  const base = 'h-11 rounded-lg border px-3 flex items-center gap-2 text-left transition-all w-full'
  const styles: Record<string, string> = {
    pickable: `${base} border-gray-700 bg-gray-900 hover:border-indigo-500 hover:bg-indigo-950/40 cursor-pointer`,
    winner:   `${base} border-emerald-700 bg-emerald-950/40`,
    loser:    `${base} border-gray-800 bg-gray-900/30 opacity-40`,
    tbd:      `${base} border-gray-800 bg-gray-900`,
  }

  return (
    <button onClick={onClick} disabled={state !== 'pickable'} className={styles[state]}>
      <span
        className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
      />
      <span className="flex-1 text-xs text-gray-200 truncate leading-tight">{task.content}</span>
      {state === 'winner' && <span className="text-emerald-400 text-[10px] flex-shrink-0">✓</span>}
    </button>
  )
}

// A matchup: two seeds, vertical stacking with connector line
function Matchup({ top, bottom, topState, bottomState, onPickTop, onPickBottom, connector }: {
  top: TodoistTask | null
  bottom: TodoistTask | null
  topState: 'pickable' | 'winner' | 'loser' | 'tbd'
  bottomState: 'pickable' | 'winner' | 'loser' | 'tbd'
  onPickTop: () => void
  onPickBottom: () => void
  connector: boolean
}) {
  return (
    <div className="relative flex items-stretch gap-0">
      <div className="flex flex-col gap-1.5 flex-1">
        <BracketCard task={top} onClick={onPickTop} state={topState} />
        <BracketCard task={bottom} onClick={onPickBottom} state={bottomState} />
      </div>
      {connector && (
        <div className="flex flex-col w-6 flex-shrink-0">
          <div className="flex-1 border-r border-t border-gray-700 rounded-tr-md" />
          <div className="flex-1 border-r border-b border-gray-700 rounded-br-md" />
        </div>
      )}
    </div>
  )
}

export default function VSBracketView({ allTasks, projects, onChampion }: Props) {
  const [bracket, setBracket] = useState<BracketState>(() => initBracket(allTasks))
  const [launched, setLaunched] = useState(false)

  const newBracket = useCallback(() => {
    setBracket(initBracket(allTasks))
    setLaunched(false)
  }, [allTasks])

  const { seeds, r1, semi, final } = bracket

  // Derived matchups
  // R1: seeds[0]vs[1], [2]vs[3], [4]vs[5], [6]vs[7]
  const r1Pairs: [TodoistTask, TodoistTask][] = [
    [seeds[0], seeds[1]], [seeds[2], seeds[3]],
    [seeds[4], seeds[5]], [seeds[6], seeds[7]],
  ]
  // Semi: r1 winners [0]vs[1], [2]vs[3]
  const semiPairs: [TodoistTask | null, TodoistTask | null][] = [
    [getTask(seeds, r1[0]), getTask(seeds, r1[1])],
    [getTask(seeds, r1[2]), getTask(seeds, r1[3])],
  ]
  // Final: semi winners
  const finalPair: [TodoistTask | null, TodoistTask | null] = [
    getTask(seeds, semi[0]), getTask(seeds, semi[1])
  ]
  const champion = getTask(seeds, final)

  const r1Done = r1.every(x => x !== null)
  const semiDone = semi.every(x => x !== null)

  function pickR1(matchup: number, winner: TodoistTask) {
    setBracket(prev => {
      const next = [...prev.r1] as (string | null)[]
      next[matchup] = winner.id
      return { ...prev, r1: next }
    })
  }

  function pickSemi(matchup: number, winner: TodoistTask) {
    setBracket(prev => {
      const next = [...prev.semi] as (string | null)[]
      next[matchup] = winner.id
      return { ...prev, semi: next }
    })
  }

  function pickFinal(winner: TodoistTask) {
    setBracket(prev => ({ ...prev, final: winner.id }))
  }

  function cardState(task: TodoistTask | null, winnerId: string | null, roundActive: boolean): 'pickable' | 'winner' | 'loser' | 'tbd' {
    if (!task) return 'tbd'
    if (!roundActive) return 'tbd'
    if (winnerId === null) return 'pickable'
    return task.id === winnerId ? 'winner' : 'loser'
  }

  if (allTasks.length < 8) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Need at least 8 tasks to run a bracket.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm">Tournament Bracket</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {!r1Done ? 'Round 1 — pick a winner from each matchup'
              : !semiDone ? 'Semifinals — 4 tasks remain'
              : final === null ? 'Final — one last pick'
              : '🏆 Champion — go do this task!'}
          </p>
        </div>
        <button
          onClick={newBracket}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5-6 6M5 3a2 2 0 0 0-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 0 0 2-2v-1M16 21h5m0 0v-5m0 5-6-6" />
          </svg>
          New bracket
        </button>
      </div>

      {/* Bracket grid */}
      <div className="flex gap-3 flex-1 min-h-0 items-center">

        {/* Round 1 — 4 matchups */}
        <div className="flex flex-col gap-3 flex-[2]">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest text-center mb-1">Round 1</span>
          {r1Pairs.map(([a, b], i) => (
            <Matchup
              key={i}
              top={a} bottom={b}
              topState={cardState(a, r1[i], true)}
              bottomState={cardState(b, r1[i], true)}
              onPickTop={() => r1[i] === null && pickR1(i, a)}
              onPickBottom={() => r1[i] === null && pickR1(i, b)}
              connector={r1Done || r1[i] !== null}
            />
          ))}
        </div>

        {/* Semis — 2 matchups */}
        <div className="flex flex-col gap-3 flex-[2] justify-around h-full">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest text-center mb-1">Semis</span>
          <div className="flex flex-col gap-3 justify-around flex-1">
            {semiPairs.map(([a, b], i) => (
              <Matchup
                key={i}
                top={a} bottom={b}
                topState={cardState(a, semi[i], r1Done)}
                bottomState={cardState(b, semi[i], r1Done)}
                onPickTop={() => r1Done && semi[i] === null && a && pickSemi(i, a)}
                onPickBottom={() => r1Done && semi[i] === null && b && pickSemi(i, b)}
                connector={semiDone || semi[i] !== null}
              />
            ))}
          </div>
        </div>

        {/* Final */}
        <div className="flex flex-col flex-[2] justify-center h-full">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest text-center mb-2">Final</span>
          <Matchup
            top={finalPair[0]} bottom={finalPair[1]}
            topState={cardState(finalPair[0], final, semiDone)}
            bottomState={cardState(finalPair[1], final, semiDone)}
            onPickTop={() => semiDone && final === null && finalPair[0] && pickFinal(finalPair[0])}
            onPickBottom={() => semiDone && final === null && finalPair[1] && pickFinal(finalPair[1])}
            connector={!!champion}
          />
        </div>

        {/* Champion */}
        <div className="flex flex-col flex-[2] justify-center h-full">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest text-center mb-2">Champion</span>
          {champion ? (
            <div className="bg-indigo-950/60 border-2 border-indigo-600 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">Winner</span>
              </div>
              <p className="text-white font-semibold text-sm leading-snug">{champion.content}</p>
              {projects.find(p => p.id === champion.project_id) && (
                <span className="text-indigo-400 text-xs">{projects.find(p => p.id === champion.project_id)?.name}</span>
              )}
              {!launched ? (
                <button
                  onClick={() => { setLaunched(true); onChampion(champion) }}
                  className="mt-1 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Start this task →
                </button>
              ) : (
                <span className="text-emerald-400 text-xs text-center">Loaded into Focus ✓</span>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-800 rounded-2xl p-4 flex items-center justify-center h-32">
              <span className="text-gray-700 text-xs">Pick your way through</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
