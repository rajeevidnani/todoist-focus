import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = process.env.APP_PASSWORD
const COOKIE = 'otv_auth'

export function middleware(req: NextRequest) {
  // Skip auth entirely when no password is configured (local dev)
  if (!PASSWORD) return NextResponse.next()

  // Allow the login page and auth API through unconditionally
  const { pathname } = req.nextUrl
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get(COOKIE)?.value
  if (cookie === PASSWORD) return NextResponse.next()

  // Redirect everything else to the login page
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
