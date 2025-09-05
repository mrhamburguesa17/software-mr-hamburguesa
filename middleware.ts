import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/auth',        // tu UI de login
  '/api/auth',    // endpoints de login/logout
  '/_next', '/favicon.ico', '/sw.js', '/manifest.json', '/icons'
]

function isPublic(path: string) {
  return PUBLIC_PATHS.some(p => path.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const token = req.cookies.get('mh_auth')?.value
  if (!token) return NextResponse.redirect(new URL('/auth', req.url))

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret'))
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/auth', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}

