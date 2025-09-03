import { NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

export async function POST(req: Request) {
  const { username, password } = await req.json()
  const U = process.env.ADMIN_USER || 'admin'
  const P = process.env.ADMIN_PASS || 'admin123'
  if (username === U && password === P) {
    await createSession(username)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
}
