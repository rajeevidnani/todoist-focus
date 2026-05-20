import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { TodoistTask, TodoistProject } from '@/lib/types'
import PriorityDot from './PriorityDot'

interface Props {
  task: TodoistTask
  queueLength: number
  projects: TodoistProject[]
  animState?: 'idle' | 'done' | 'skip'
  skipEmojis?: string[]
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDueDate(dateStr: string): string {
  const todayStr = localToday()
  const today = new Date(todayStr + 'T00:00:00')
  const due = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'

  const sameYear = due.getFullYear() === today.getFullYear()
  return due.toLocaleDateString('en-US', {
    weekday: diffDays > -7 && diffDays < 7 ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}

function bucketLabel(dateStr: string): { text: string; className: string } {
  const today = localToday()
  if (dateStr < today) return { text: 'Overdue', className: 'text-red-400' }
  if (dateStr === today) return { text: 'Today', className: 'text-emerald-400' }
  const diffDays = Math.round(
    (new Date(dateStr + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000
  )
  if (diffDays === 1) return { text: 'Tomorrow', className: 'text-sky-400' }
  const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
  return { text: label, className: 'text-gray-400' }
}

const DEFAULT_TAUNTS = ['🙄', '😬', '👀', '💀', '🫠']

export default function TaskCard({ task, queueLength, projects, animState = 'idle', skipEmojis }: Props) {
  const overdue = task.due ? task.due.date < localToday() : false
  const bucket = task.due ? bucketLabel(task.due.date) : null
  const projectName = projects.find(p => p.id === task.project_id)?.name ?? null
  const taunts = skipEmojis && skipEmojis.length > 0 ? skipEmojis : DEFAULT_TAUNTS
  const taunt = taunts[Math.floor(Math.random() * taunts.length)]

  const exitClass = animState === 'done' ? 'task-done-exit' : animState === 'skip' ? 'task-skip-exit' : ''

  return (
    <div className={`w-full max-w-xl mx-auto ${exitClass}`}>
      {bucket && (
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 text-center ${bucket.className}`}>
          {bucket.text}
        </p>
      )}

      <div className="relative task-enter bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        {animState === 'done' && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(5, 20, 10, 0.82)' }}
            aria-hidden
          >
            <DotLottieReact
              src="/success.lottie"
              autoplay
              loop={false}
              backgroundColor="transparent"
              style={{ width: '260px', height: '260px' }}
            />
          </div>
        )}
        {animState === 'skip' && (
          <div className="skip-overlay" aria-hidden>
            <span className="skip-emoji-big">{taunt}</span>
          </div>
        )}
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-2">
            <PriorityDot priority={task.priority} />
          </div>
          <h1 className="text-2xl font-medium text-white leading-snug">{task.content}</h1>
        </div>

        {task.description && (
          <p className="text-gray-400 text-sm leading-relaxed ml-5 mb-4 whitespace-pre-wrap">
            {task.description}
          </p>
        )}

        <div className="ml-5 flex flex-wrap gap-2 items-center">
          {task.due && (
            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
              overdue
                ? 'text-red-400 border-red-800 bg-red-950/40'
                : 'text-gray-400 border-gray-700 bg-gray-800/50'
            }`}>
              <span>{formatDueDate(task.due.date)}</span>
              {task.due.is_recurring && (
                <span className={overdue ? 'text-red-700' : 'text-gray-600'}>
                  · {task.due.string}
                </span>
              )}
            </span>
          )}
          {task.labels.map(label => (
            <span key={label} className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-400 bg-gray-800/50">
              {label}
            </span>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-gray-600 text-xs">{queueLength} tasks</span>
          {projectName && (
            <span className="text-gray-600 text-xs">{projectName}</span>
          )}
        </div>
      </div>
    </div>
  )
}
