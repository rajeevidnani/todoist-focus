export interface TodoistTask {
  id: string
  content: string
  description: string
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

export interface ProductivityStats {
  karma: number
  karma_trend: 'up' | 'down' | ''
  completed_today: number
  current_streak: number
  goal_completed: boolean
}
