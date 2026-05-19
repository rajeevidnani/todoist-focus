import { NextRequest, NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await todoistFetch(`/tasks/${id}/close`, { method: 'POST' })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
