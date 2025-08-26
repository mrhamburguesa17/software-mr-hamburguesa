'use client'
import { useEffect, useState } from 'react'

type Item = {
  id: number
  name: string
  unit: string
  category?: string | null
  minStock: number
  currentStock: number
  costPerUnit: number
  supplier?: { id: number; name: string } | null
}

type Supplier = { id: number; name: string }

export default function Page() {
  const [rows, setRows] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [f, setF] = useState<any>({
    name: '',
    unit: 'unidad',
    category: '',
    minStock: 0,
    currentStock: 0,
    costPerUnit: 0,
    supplierId: ''
  })

  async function loadInventory() {
    const res = await fetch('/api/inventory')
    setRows(await res.json())
  }

  async function loadSuppliers() {
    const res = await fetch('/api/suppliers')
    setSuppliers(await res.json())
  }

  useEffect(() => {
    loadInventory()
    loadSuppliers()
  }, [])

  async function add(e: any) {
    e.preventDefault()
    const payload: any = {
      name: f.name,
      unit: f.unit,
      category: f.category || null,
      minStock: Number(f.minStock) || 0,
      currentStock: Number(f.currentStock) || 0,
      costPerUnit: Number(f.costPerUnit) || 0
    }
    if (f.supplierId !== '') payload.supplierId = Number(f.supplierId)

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Error creando insumo')
      return
    }

    setF({
      name: '',
      unit: 'unidad',
      category: '',
      minStock: 0,
      currentStock: 0,
      costPerUnit: 0,
      supplierId: ''
    })
    await loadInventory()
  }

  async function remove(id: number) {
    if (!confirm('Eliminar insumo?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    await loadInventory()
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Inventario</h2>
        <form onSubmit={add} className="grid md:grid-cols-7 gap-2">
          <input
            className="input"
            placeholder="Nombre"
            required
            value={f.name}
            onChange={e => setF({ ...f, name: e.target.value })}
          />
          <select
            className="select"
            value={f.unit}
            onChange={e => setF({ ...f, unit: e.target.value })}
          >
            <option value="unidad">unidad</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
          </select>
          <input
            className="input"
            placeholder="Categoría"
            value={f.category}
            onChange={e => setF({ ...f, category: e.target.value })}
          />
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="Stock mín."
            value={f.minStock}
            onChange={e => setF({ ...f, minStock: e.target.value })}
          />
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="Stock actual"
            value={f.currentStock}
            onChange={e => setF({ ...f, currentStock: e.target.value })}
          />
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="$ costo/unidad"
            value={f.costPerUnit}
            onChange={e => setF({ ...f, costPerUnit: e.target.value })}
          />
          <select
            className="select"
            value={f.supplierId}
            onChange={e => setF({ ...f, supplierId: e.target.value })}
            title="Proveedor (opcional)"
          >
            <option value="">(sin proveedor)</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button className="btn btn-primary md:col-span-7">Agregar</button>
        </form>
      </section>

      <section className="card">
        <table className="table">
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.unit}</td>
                <td>{r.category || '-'}</td>
                <td>{r.currentStock}</td>
                <td>{r.minStock}</td>
                <td>{r.costPerUnit}</td>
                <td>{(r as any).supplier?.name || '-'}</td>
                <td>
                  <button className="btn" onClick={() => remove(r.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
