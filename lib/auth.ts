import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'mh_auth'
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'insecure')
const alg = 'HS256'

export type Session = { user: string }

export async function createSession(user: string) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret)

  // cookie httpOnly, segura en prod
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12
  })
}

export function destroySession() {
  cookies().delete(COOKIE_NAME)
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [alg] })
    return { user: String(payload.user) }
  } catch {
    return null
  }
}
