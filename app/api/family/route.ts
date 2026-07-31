import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG?.match(/ecfg_[a-z0-9]+/)?.[0]
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const KEY = 'family'

type FamilyData = Record<string, string> // id → YYYY-MM-DD

export async function GET() {
  try {
    const data = (await get<FamilyData>(KEY)) ?? {}
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: NextRequest) {
  if (!EDGE_CONFIG_ID || !VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  try {
    const body = await req.json() as FamilyData
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ operation: 'upsert', key: KEY, value: body }],
        }),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
