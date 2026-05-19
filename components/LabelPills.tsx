import { TodoistLabel } from '@/lib/types'

interface Props {
  labels: TodoistLabel[]
  activeLabel: string | null
  onSelect: (name: string | null) => void
}

// Todoist label color names → Tailwind bg classes (approximate mapping)
const LABEL_COLORS: Record<string, string> = {
  berry_red: 'bg-rose-600',
  red: 'bg-red-500',
  salmon: 'bg-orange-400',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  olive_green: 'bg-lime-600',
  lime_green: 'bg-lime-500',
  green: 'bg-green-500',
  mint_green: 'bg-teal-400',
  teal: 'bg-teal-500',
  sky_blue: 'bg-sky-400',
  light_blue: 'bg-blue-300',
  blue: 'bg-blue-500',
  grape: 'bg-purple-500',
  violet: 'bg-violet-500',
  lavender: 'bg-indigo-400',
  magenta: 'bg-pink-500',
  charcoal: 'bg-gray-600',
  grey: 'bg-gray-500',
  taupe: 'bg-stone-400',
}

export default function LabelPills({ labels, activeLabel, onSelect }: Props) {
  if (labels.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto scrollbar-none border-b border-gray-800/50">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeLabel === null
            ? 'bg-white text-gray-950'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        All
      </button>
      {labels.map(label => {
        const isActive = activeLabel === label.name
        const dotColor = LABEL_COLORS[label.color] ?? 'bg-gray-400'
        return (
          <button
            key={label.id}
            onClick={() => onSelect(isActive ? null : label.name)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
            {label.name}
          </button>
        )
      })}
    </div>
  )
}
