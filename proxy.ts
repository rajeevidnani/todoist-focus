import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = process.env.APP_PASSWORD
const COOKIE = 'otv_auth'

export function proxy(req: NextRequest) {
  // If no password is set, skip auth (local dev)
  if (!PASSWORD) return NextResponse.next()

  const cookie = req.cookies.get(COOKIE)?.value

  // Already authenticated
  if (cookie === PASSWORD) return NextResponse.next()

  const { pathname } = req.nextUrl

  // Allow the auth endpoint through unauthenticated
  if (pathname === '/api/auth') return NextResponse.next()

  // Block all other API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Redirect everything else to login
  if (pathname !== '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
