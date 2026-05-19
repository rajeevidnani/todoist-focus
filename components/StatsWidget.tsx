import { ProductivityStats } from '@/lib/types'

interface Props {
  stats: ProductivityStats | null
  isLoading: boolean
  totalSkipped: number
}

export default function StatsWidget({ stats, isLoading, totalSkipped }: Props) {
  const done = stats?.completed_today ?? 0

  return (
    <div className="w-52 flex-shrink-0 pt-8 pr-6 self-start sticky top-0">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">

        {/* Done today */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">Done today</p>
          <div
            key={done}
            className="text-5xl font-bold text-white tabular-nums count-pop"
          >
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

      </div>
    </div>
  )
}
