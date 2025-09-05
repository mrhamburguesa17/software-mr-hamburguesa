'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginInner() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const params = useSearchParams()
  const router = useRouter()
  const next = params.get('next') || '/'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)

    // 👉 ERP: usar la API interna que setea la cookie (no el backend)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    setLoading(false)
    if (res.ok) router.replace(next)
    else {
      const j = await res.json().catch(() => ({ error: 'Error' }))
      setError(j.error || 'Credenciales inválidas')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Ingresar</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          className="input"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="input"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

