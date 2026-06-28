export interface TodoistTask {
  id: string
  content: string
  description: string
  added_at: string // ISO 8601 — used for age heat map
  due: {
    date: string
    datetime: string | null
    string: string
    is_recurring: boolean
  } | null
  priority: 1 | 2 | 3 | 4
  labels: string[]
  project_id: string
  day_order: number   // position in Today view; -1 = not manually ordered
  child_order: number // position within project/section
  order: number
  is_completed: boolean
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  parent_id: string | null
  order: number
}

export interface TodoistLabel {
  id: string
  name: string
  color: string
  order: number
}

export interface DayCompletion {
  date: string
  total: number
}

export interface WeekCompletion {
  from: string
  to: string
  total: number
}

export interface ProductivityStats {
  karma: number
  karma_trend: 'up' | 'down' | ''
  completed_today: number
  daily_goal: number
  weekly_goal: number
  completed_this_week: number
  completed_total: number
  current_daily_streak: number
  max_daily_streak: number
  current_weekly_streak: number
  days: DayCompletion[]   // last 7, chronological (oldest first)
  weeks: WeekCompletion[] // last 4, chronological (oldest first)
  // legacy fields kept for StatsWidget
  current_streak: number
  goal_completed: boolean
}
