import { ProductivityStats, TodoistTask, TodoistProject } from '@/lib/types'
import { useDailyLog } from '@/hooks/useDailyLog'
import TrendGraph from './TrendGraph'

interface Props {
  stats: ProductivityStats | null
  isLoading: boolean
  totalSkipped: number
  queueLength: number
  allTasks: TodoistTask[]
  projects: TodoistProject[]
}

const RECURRING_LABEL = '♻️🤓'
const WAITING_LABEL = 'really_waiting'

export default function StatsWidget({ stats, isLoading, totalSkipped, queueLength, allTasks, projects }: Props) {
  const done = stats?.completed_today ?? 0

  const recurringCount = allTasks.filter(t => t.due?.is_recurring).length
  const waitingCount = allTasks.filter(t => t.labels.includes(WAITING_LABEL)).length
  const totalCount = allTasks.length
  const focusTasks = allTasks.filter(t => !t.due?.is_recurring && !t.labels.includes(WAITING_LABEL))
  const focusCount = focusTasks.length
  const taskIds = isLoading ? [] : focusTasks.map(t => t.id)

  const logEntries = useDailyLog(isLoading ? null : focusCount, done, taskIds)

  const projectCounts = projects
    .map(p => ({
      name: p.name,
      count: allTasks.filter(t => t.project_id === p.id).length,
    }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-3 w-full h-full">

      {/* Done Today — compact top card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Done today</p>
          <div key={done} className="text-3xl font-bold text-white tabular-nums count-pop">
            {isLoading ? '—' : done}
          </div>
        </div>
        <div className="text-right">
          <span className="text-gray-600 text-xs">skipped</span>
          <div className="text-gray-600 text-xs tabular-nums">{totalSkipped}</div>
        </div>
      </div>

      {/* Remaining — fills remaining height */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Remaining</p>
          <div className="text-3xl font-bold text-white tabular-nums">{focusCount}</div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">{RECURRING_LABEL}</span>
              <span className="text-gray-600 text-xs tabular-nums">{recurringCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">really waiting</span>
              <span className="text-gray-600 text-xs tabular-nums">{waitingCount}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/60">
              <span className="text-gray-700 text-xs">total</span>
              <span className="text-gray-700 text-xs tabular-nums">{totalCount}</span>
            </div>
          </div>
        </div>

        {projectCounts.length > 0 && (
          <div className="border-t border-gray-800 mt-4 pt-4 flex flex-col gap-1.5 overflow-y-auto scrollbar-none">
            {projectCounts.map(p => (
              <div key={p.name} className="flex items-center justify-between gap-2">
                <span className="text-gray-400 text-xs truncate">{p.name}</span>
                <span className="text-gray-500 text-xs tabular-nums flex-shrink-0">{p.count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-800 mt-4 pt-4">
          <TrendGraph entries={logEntries} />
        </div>
      </div>

    </div>
  )
}
