import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = process.env.APP_PASSWORD
const COOKIE = 'otv_auth'
const ONE_YEAR = 60 * 60 * 24 * 365

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!PASSWORD || body.password !== PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: ONE_YEAR,
    path: '/',
  })
  return res
}
