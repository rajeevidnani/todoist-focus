import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG?.match(/ecfg_[a-z0-9]+/)?.[0]
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const KEY = 'trend-log'

type StoredEntry = { count: number; completed: number }
type Log = Record<string, StoredEntry>

export async function GET() {
  try {
    const log = (await get<Log>(KEY)) ?? {}
    // Strip any zero-count entries written before the guard was added
    const clean = Object.fromEntries(Object.entries(log).filter(([, v]) => v.count > 0))
    return NextResponse.json(clean)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  if (!EDGE_CONFIG_ID || !VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  try {
    const body = await req.json() as Log
    const existing = (await get<Log>(KEY)) ?? {}

    // Merge: for each date keep the entry whose count shows more downward progress.
    // "Best narrative" = steepest overall decline, so on conflicts we pick lower count
    // (smaller backlog = more growth shown).
    const merged: Log = { ...existing }
    for (const [date, entry] of Object.entries(body)) {
      if (entry.count > 0 && (!merged[date] || merged[date].count === 0 || entry.count < merged[date].count)) {
        merged[date] = entry
      }
    }

    // Keep last 90 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    for (const date of Object.keys(merged)) {
      if (date < cutoffStr) delete merged[date]
    }

    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ operation: 'upsert', key: KEY, value: merged }],
        }),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: 500 })
    }
    return NextResponse.json({ ok: true, entries: Object.keys(merged).length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
