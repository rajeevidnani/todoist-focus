export type Tab = 'focus' | 'overdue' | 'all-tasks' | 'vs-quick' | 'vs-bracket' | 'analytics' | 'family'

interface Props {
  activeTab: Tab
  overdueCount: number
  onSelect: (tab: Tab) => void
}

export default function TabBar({ activeTab, overdueCount, onSelect }: Props) {
  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'focus', label: 'Focus' },
    { id: 'overdue', label: 'Overdue', badge: overdueCount || undefined },
    { id: 'all-tasks', label: 'All Tasks' },
    { id: 'vs-quick', label: 'Quick VS' },
    { id: 'vs-bracket', label: 'Bracket' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <div className="flex gap-0.5 px-6 pt-3 border-t border-gray-800/50 flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
          }`}
        >
          {tab.label}
          {tab.badge != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-red-500/30 text-red-300' : 'bg-gray-700 text-gray-400'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
