import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// credenciales demo
const VALID_USER = 'admin'
const VALID_PASS = 'admin123'

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}))

  if (username !== VALID_USER || password !== VALID_PASS) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const token = jwt.sign({ user: VALID_USER }, JWT_SECRET, { expiresIn: '12h' })

  // Detectar si viene por HTTPS (cuando pongamos dominio/SSL)
  const isHttps =
    headers().get('x-forwarded-proto') === 'https' ||
    process.env.FORCE_SECURE_COOKIE === '1'

  // IMPORTANTE: mientras estés en HTTP, secure:false para que el navegador guarde la cookie
  cookies().set('mh_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!isHttps, // ← quedará false hoy; será true cuando pasemos a HTTPS
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  })

  return NextResponse.json({ ok: true })
}

