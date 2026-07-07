import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG?.match(/ecfg_[a-z0-9]+/)?.[0]
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const KEY = 'task-snapshot'

interface Snapshot {
  date: string
  ids: string[]
  prevDate: string
  prevIds: string[]
}

async function writeEdgeConfig(value: Snapshot) {
  if (!EDGE_CONFIG_ID || !VERCEL_TOKEN) return
  await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: KEY, value }],
    }),
  })
}

export async function GET() {
  try {
    const snapshot = (await get<Snapshot>(KEY)) ?? null
    return NextResponse.json(snapshot ?? {})
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, ids } = await req.json() as { date: string; ids: string[] }
    if (!date || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const existing = (await get<Snapshot>(KEY)) ?? null

    let prevDate = ''
    let prevIds: string[] = []

    if (existing) {
      if (existing.date === date) {
        // Same day — keep previous day unchanged, just update today's IDs
        prevDate = existing.prevDate
        prevIds = existing.prevIds
      } else {
        // New day — yesterday becomes previous
        prevDate = existing.date
        prevIds = existing.ids
      }
    }

    const snapshot: Snapshot = { date, ids, prevDate, prevIds }
    await writeEdgeConfig(snapshot)
    return NextResponse.json({ ok: true, added: ids.filter(id => !new Set(prevIds).has(id)).length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
