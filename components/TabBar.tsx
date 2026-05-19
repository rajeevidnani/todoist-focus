interface Props {
  activeTab: 'focus' | 'overdue'
  overdueCount: number
  onSelect: (tab: 'focus' | 'overdue') => void
}

export default function TabBar({ activeTab, overdueCount, onSelect }: Props) {
  const tabs: { id: 'focus' | 'overdue'; label: string; badge?: number }[] = [
    { id: 'focus', label: 'Focus' },
    { id: 'overdue', label: 'Overdue', badge: overdueCount || undefined },
  ]

  return (
    <div className="flex gap-1 px-6 pb-3 border-b border-gray-800/50">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
          }`}
        >
          {tab.label}
          {tab.badge != null && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
