import { useState } from 'react'
import { TodoistTask } from '@/lib/types'
import { useOverdueTasks } from '@/hooks/useOverdueTasks'

interface Props {
  allTasks: TodoistTask[]
  onReschedule: (id: string) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function OverdueRow({
  task,
  isLoading,
  isDone,
  onReschedule,
}: {
  task: TodoistTask
  isLoading: boolean
  isDone: boolean
  onReschedule: (dueString: string) => void
}) {
  const [showDateInput, setShowDateInput] = useState(false)
  const [customDate, setCustomDate] = useState('')

  if (isDone) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/30 opacity-50">
        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="text-gray-400 text-sm line-through">{task.content}</span>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <p className="text-white text-sm font-medium leading-snug">{task.content}</p>
          <p className="text-red-400 text-xs mt-0.5">{formatDate(task.due!.date)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {[
          { label: 'Today', value: 'today' },
          { label: 'Tomorrow', value: 'tomorrow' },
          { label: '+1 week', value: 'next week' },
        ].map(opt => (
          <button
            key={opt.value}
            disabled={isLoading}
            onClick={() => onReschedule(opt.value)}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40"
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowDateInput(v => !v)}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Pick date…
        </button>
      </div>

      {showDateInput && (
        <div className="flex gap-2 mt-2.5 items-center">
          <input
            type="date"
            value={customDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setCustomDate(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-500"
          />
          <button
            disabled={!customDate || isLoading}
            onClick={() => { onReschedule(customDate); setShowDateInput(false) }}
            className="text-xs px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-40 transition-colors"
          >
            Set
          </button>
        </div>
      )}
    </div>
  )
}

export default function OverdueManager({ allTasks, onReschedule }: Props) {
  const { overdue, rescheduling, rescheduled, reschedule } = useOverdueTasks(allTasks, onReschedule)

  if (overdue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-white text-xl font-medium mb-1">No overdue tasks</h2>
          <p className="text-gray-500 text-sm">You&apos;re all caught up</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-red-400 text-sm font-medium">{overdue.length} overdue</span>
      </div>
      <div className="flex flex-col gap-3">
        {overdue.map(task => (
          <OverdueRow
            key={task.id}
            task={task}
            isLoading={rescheduling[task.id] ?? false}
            isDone={rescheduled.has(task.id)}
            onReschedule={dueString => reschedule(task, dueString)}
          />
        ))}
      </div>
    </div>
  )
}
