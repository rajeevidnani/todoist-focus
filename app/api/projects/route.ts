import { NextResponse } from 'next/server'
import { todoistFetch } from '@/lib/todoist'

export async function GET() {
  try {
    const data = await todoistFetch('/projects')
    return NextResponse.json(data?.results ?? data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
