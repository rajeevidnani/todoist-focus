import { NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'
import { ProductivityStats } from '@/lib/types'

export async function GET() {
  try {
    const s = await todoistFetch('/tasks/completed/stats')

    const daysRaw: { date: string; total_completed: number }[] = s?.days_items ?? []
    const weeksRaw: { from: string; to: string; total_completed: number }[] = s?.week_items ?? []
    const goals = s?.goals ?? {}

    // API returns newest-first; reverse to chronological for charts
    const days = [...daysRaw].reverse().map(d => ({ date: d.date, total: d.total_completed }))
    const weeks = [...weeksRaw].reverse().map(w => ({ from: w.from, to: w.to, total: w.total_completed }))

    const completedToday = daysRaw[0]?.total_completed ?? 0
    const completedThisWeek = weeksRaw[0]?.total_completed ?? 0
    const dailyGoal = goals?.daily_goal ?? 0
    const dailyStreak = goals?.current_daily_streak?.count ?? 0

    const stats: ProductivityStats = {
      karma: Math.round(s?.karma ?? 0),
      karma_trend: s?.karma_trend ?? '',
      completed_today: completedToday,
      daily_goal: dailyGoal,
      weekly_goal: goals?.weekly_goal ?? 0,
      completed_this_week: completedThisWeek,
      completed_total: s?.completed_count ?? 0,
      current_daily_streak: dailyStreak,
      max_daily_streak: goals?.max_daily_streak?.count ?? 0,
      current_weekly_streak: goals?.current_weekly_streak?.count ?? 0,
      days,
      weeks,
      // legacy
      current_streak: dailyStreak,
      goal_completed: dailyGoal > 0 && completedToday >= dailyGoal,
    }

    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
