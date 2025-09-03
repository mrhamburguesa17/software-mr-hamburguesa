import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'mh_auth'
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'insecure')

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/icon.png', '/manifest.json',
  '/favicon.ico'
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir estáticos y públicos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next()
  }

  // Verificar cookie JWT
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return NextResponse.next()
  } catch {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!api/auth/logout).*)'] // protegemos todo salvo logout (que igual valida cookie)
}
