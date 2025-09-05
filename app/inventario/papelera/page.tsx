'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = {
  id: number
  name: string
  unit: string
  category?: string | null
  currentStock: number
  minStock: number
  costPerUnit: number
  deletedAt?: string | null
  supplier?: { id: number; name: string } | null
}

export default function PapeleraPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  async function loadTrash() {
    setLoading(true)
    const res = await fetch('/api/inventory/trash', { cache: 'no-store' })
    const data = await res.json()
    setRows(data)
    setLoading(false)
  }

  async function restore(id: number) {
    const res = await fetch(`/api/inventory/${id}/restore`, { method: 'POST' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j.error || 'No se pudo restaurar')
      return
    }
    // recargar papelera y refrescar lista principal si volvés atrás
    await loadTrash()
  }

  useEffect(() => {
    loadTrash()
  }, [])

  return (
    <main className="space-y-4">
      <section className="card flex items-center justify-between">
        <h2 className="text-lg font-semibold">Papelera de Inventario</h2>
        <div className="space-x-2">
          <button className="btn" onClick={() => router.back()}>Volver</button>
          <button className="btn" onClick={loadTrash} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </section>

      <section className="card">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">No hay ítems en papelera.</p>
        ) : (
          <table className="table text-gray-200">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Unidad</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mín</th>
                <th>$ U</th>
                <th>Proveedor</th>
                <th>Eliminado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="bg-zinc-900/30">
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.unit}</td>
                  <td>{r.category || '-'}</td>
                  <td>{r.currentStock}</td>
                  <td>{r.minStock}</td>
                  <td>{r.costPerUnit}</td>
                  <td>{r.supplier?.name || '-'}</td>
                  <td>{r.deletedAt ? new Date(r.deletedAt).toLocaleString() : '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => restore(r.id)}>
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

