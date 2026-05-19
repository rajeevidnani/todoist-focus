'use client'

import { useState, useEffect, useRef } from 'react'
import { TodoistProject, TodoistLabel } from '@/lib/types'

interface Props {
  projects: TodoistProject[]
  labels: TodoistLabel[]
  activeProjectId: string | null
  activeLabel: string | null
  onSelectProject: (id: string | null) => void
  onSelectLabel: (name: string | null) => void
}

const COLORS: Record<string, string> = {
  berry_red: 'bg-rose-600', red: 'bg-red-500', salmon: 'bg-orange-400',
  orange: 'bg-orange-500', yellow: 'bg-yellow-400', olive_green: 'bg-lime-600',
  lime_green: 'bg-lime-500', green: 'bg-green-500', mint_green: 'bg-teal-400',
  teal: 'bg-teal-500', sky_blue: 'bg-sky-400', light_blue: 'bg-blue-300',
  blue: 'bg-blue-500', grape: 'bg-purple-500', violet: 'bg-violet-500',
  lavender: 'bg-indigo-400', magenta: 'bg-pink-500', charcoal: 'bg-gray-600',
  grey: 'bg-gray-500', taupe: 'bg-stone-400',
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}

function useSortedItems<T extends { id: string }>(
  items: T[],
  storageKey: string
): [T[], (next: T[]) => void] {
  const [ordered, setOrdered] = useState<T[]>([])
  const initialized = useRef(false)

  // Once items arrive, apply saved order or use default
  useEffect(() => {
    if (items.length === 0 || initialized.current) return
    initialized.current = true

    try {
      const saved: string[] = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      if (saved.length > 0) {
        const byId = Object.fromEntries(items.map(i => [i.id, i]))
        const reordered = [
          ...saved.filter(id => byId[id]).map(id => byId[id]),
          ...items.filter(i => !saved.includes(i.id)),
        ]
        setOrdered(reordered)
        return
      }
    } catch {}

    setOrdered(items)
  }, [items, storageKey])

  function save(next: T[]) {
    setOrdered(next)
    localStorage.setItem(storageKey, JSON.stringify(next.map(i => i.id)))
  }

  return [ordered, save]
}

function DraggableRow<T extends { id: string; name: string; color?: string }>({
  items,
  activeId,
  onSelect,
  onReorder,
  isActive,
}: {
  items: T[]
  activeId: string | null
  onSelect: (id: string) => void
  onReorder: (next: T[]) => void
  isActive: (item: T) => boolean
}) {
  const dragFrom = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  return (
    <>
      {items.map((item, index) => {
        const dot = item.color ? COLORS[item.color] ?? 'bg-gray-400' : null
        const active = isActive(item)
        const isDragTarget = dragOverIndex === index

        return (
          <button
            key={item.id}
            draggable
            onDragStart={() => { dragFrom.current = index }}
            onDragOver={e => { e.preventDefault(); setDragOverIndex(index) }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={e => {
              e.preventDefault()
              setDragOverIndex(null)
              if (dragFrom.current !== null && dragFrom.current !== index) {
                onReorder(reorder(items, dragFrom.current, index))
              }
              dragFrom.current = null
            }}
            onDragEnd={() => { dragFrom.current = null; setDragOverIndex(null) }}
            onClick={() => onSelect(item.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-grab active:cursor-grabbing select-none ${
              active
                ? 'bg-white text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            } ${isDragTarget ? 'ring-2 ring-white/30 scale-95' : ''}`}
          >
            {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
            {item.name}
          </button>
        )
      })}
    </>
  )
}

function RowLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 w-20">
      <span className="text-gray-600">{icon}</span>
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{text}</span>
    </div>
  )
}

export default function FilterBar({
  projects, labels, activeProjectId, activeLabel, onSelectProject, onSelectLabel,
}: Props) {
  const [orderedProjects, setOrderedProjects] = useSortedItems(projects, 'project-order')
  const [orderedLabels, setOrderedLabels] = useSortedItems(labels, 'label-order')

  const hasProjects = orderedProjects.length > 0
  const hasLabels = orderedLabels.length > 0
  if (!hasProjects && !hasLabels) return null

  return (
    <div className="border-b border-gray-800/50 divide-y divide-gray-800/50">
      {hasProjects && (
        <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto scrollbar-none">
          <RowLabel
            text="Projects"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            }
          />
          <button
            onClick={() => { onSelectProject(null); onSelectLabel(null) }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeProjectId === null && activeLabel === null
                ? 'bg-white text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            All
          </button>
          <DraggableRow
            items={orderedProjects}
            activeId={activeProjectId}
            isActive={p => p.id === activeProjectId}
            onSelect={id => {
              onSelectProject(activeProjectId === id ? null : id)
              onSelectLabel(null)
            }}
            onReorder={setOrderedProjects}
          />
        </div>
      )}

      {hasLabels && (
        <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto scrollbar-none">
          <RowLabel
            text="Labels"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            }
          />
          <DraggableRow
            items={orderedLabels}
            activeId={activeLabel}
            isActive={l => l.name === activeLabel}
            onSelect={id => {
              const label = orderedLabels.find(l => l.id === id)
              if (!label) return
              onSelectLabel(activeLabel === label.name ? null : label.name)
              onSelectProject(null)
            }}
            onReorder={setOrderedLabels}
          />
        </div>
      )}
    </div>
  )
}
