import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// Convertir secret a Uint8Array
function getSecret() {
  return new TextEncoder().encode(JWT_SECRET)
}

// credenciales demo
const VALID_USER = 'admin'
const VALID_PASS = 'admin123'

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}))

  if (username !== VALID_USER || password !== VALID_PASS) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  // generar token con jose
  const token = await new SignJWT({ user: VALID_USER })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(getSecret())

  const isHttps =
    headers().get('x-forwarded-proto') === 'https' ||
    process.env.FORCE_SECURE_COOKIE === '1'

  cookies().set('mh_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!isHttps,
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  })

  return NextResponse.json({ ok: true })
}

