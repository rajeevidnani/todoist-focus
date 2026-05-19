import { NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'
import { ProductivityStats } from '@/lib/types'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const since = todayStart.toISOString()

    const [user, completed] = await Promise.all([
      todoistFetch('/user'),
      todoistFetch(`/tasks/completed?since=${encodeURIComponent(since)}`),
    ])

    const stats: ProductivityStats = {
      karma: user?.karma ?? 0,
      karma_trend: user?.karma_trend ?? '',
      completed_today: completed?.items?.length ?? 0,
      current_streak: 0,
      goal_completed: false,
    }

    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
