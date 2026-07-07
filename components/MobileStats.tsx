'use client'

import { ProductivityStats, TodoistTask } from '@/lib/types'
import { useDailyLog } from '@/hooks/useDailyLog'
import TrendGraph from './TrendGraph'

const RECURRING_LABEL = '♻️🤓'
const WAITING_LABEL = 'really_waiting'

interface Props {
  stats: ProductivityStats | null
  isLoading: boolean
  totalSkipped: number
  allTasks: TodoistTask[]
}

export default function MobileStats({ stats, isLoading, totalSkipped, allTasks }: Props) {
  const done = stats?.completed_today ?? 0
  const focusTasks = allTasks.filter(t => !t.due?.is_recurring && !t.labels.includes(WAITING_LABEL))
  const focusCount = focusTasks.length
  const taskIds = isLoading ? [] : focusTasks.map(t => t.id)
  const logEntries = useDailyLog(isLoading ? null : focusCount, done, taskIds)

  return (
    <div className="w-full flex flex-col gap-3 mt-4 pb-2">
      {/* Done Today + Remaining side by side */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Done today</p>
          <div key={done} className="text-3xl font-bold text-white tabular-nums count-pop">
            {isLoading ? '—' : done}
          </div>
          <div className="text-gray-600 text-xs mt-1">skipped {totalSkipped}</div>
        </div>
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Remaining</p>
          <div className="text-3xl font-bold text-white tabular-nums">
            {isLoading ? '—' : focusCount}
          </div>
          <div className="text-gray-600 text-xs mt-1">focus tasks</div>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4">
        <TrendGraph entries={logEntries} vw={200} />
      </div>
    </div>
  )
}
