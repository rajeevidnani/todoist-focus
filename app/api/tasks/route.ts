import { NextRequest, NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const projectId = searchParams.get('project_id')
  const filter = searchParams.get('filter') ?? 'overdue | today'
  const limit = searchParams.get('limit') ?? '200'

  try {
    const query = projectId
      ? `/tasks?project_id=${projectId}&limit=${limit}`
      : `/tasks?filter=${encodeURIComponent(filter)}&limit=${limit}`

    const data = await todoistFetch(query)
    return NextResponse.json(data?.results ?? data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
