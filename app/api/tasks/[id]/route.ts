import { NextRequest, NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  try {
    const task = await todoistFetch(`/tasks/${id}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return NextResponse.json(task)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
