import { ProductivityStats, TodoistTask, TodoistProject } from '@/lib/types'

interface Props {
  stats: ProductivityStats | null
  isLoading: boolean
  totalSkipped: number
  queueLength: number
  allTasks: TodoistTask[]
  projects: TodoistProject[]
}

export default function StatsWidget({ stats, isLoading, totalSkipped, queueLength, allTasks, projects }: Props) {
  const done = stats?.completed_today ?? 0

  // Per-project task counts from global task list
  const projectCounts = projects
    .map(p => ({
      name: p.name,
      count: allTasks.filter(t => t.project_id === p.id).length,
    }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="w-56 flex-shrink-0 pt-8 pl-6 pr-6 self-start sticky top-0">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-5">

        {/* Done today */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Done today</p>
          <div key={done} className="text-5xl font-bold text-white tabular-nums count-pop">
            {isLoading ? '—' : done}
          </div>
          {(stats?.current_streak ?? 0) > 0 && (
            <p className="text-orange-400 text-xs mt-1.5">🔥 {stats!.current_streak} day streak</p>
          )}
        </div>

        {/* Skipped */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Skipped</p>
          <div className="text-2xl font-semibold text-gray-400 tabular-nums">{totalSkipped}</div>
        </div>

        {/* Remaining */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Remaining</p>
          <div className="text-2xl font-semibold text-white tabular-nums">{queueLength}</div>
        </div>

        {/* Per-project breakdown */}
        {projectCounts.length > 0 && (
          <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
            {projectCounts.map(p => (
              <div key={p.name} className="flex items-center justify-between gap-2">
                <span className="text-gray-400 text-xs truncate">{p.name}</span>
                <span className="text-gray-500 text-xs tabular-nums flex-shrink-0">{p.count}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
