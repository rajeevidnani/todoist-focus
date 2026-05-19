import { TodoistProject } from '@/lib/types'

interface Props {
  activeLabel: string | null
  activeProjectId: string | null
  projects: TodoistProject[]
}

export default function EmptyState({ activeLabel, activeProjectId, projects }: Props) {
  let message = 'No tasks due today or overdue'
  if (activeLabel) message = `No tasks with label "${activeLabel}" for today`
  if (activeProjectId) {
    const name = projects.find(p => p.id === activeProjectId)?.name ?? 'this project'
    message = `No tasks in "${name}" for today`
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <h2 className="text-white text-xl font-medium mb-1">All caught up</h2>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
