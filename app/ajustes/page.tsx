'use client'
import { useEffect, useState } from 'react'

type Item = { id:number; name:string; unit:string; currentStock:number; minStock:number }
type Move = { id:number; type:string; quantity:number; note?:string|null; createdAt:string; item: Item }

export default function Page(){
  const [items,setItems]=useState<Item[]>([])
  const [moves,setMoves]=useState<Move[]>([])
  const [itemId,setItemId]=useState<number>(0)
  const [delta,setDelta]=useState<number>(0)
  const [type,setType]=useState<'adjust'|'waste'>('adjust')
  const [note,setNote]=useState('')
  const [allowNegative,setAllowNegative]=useState(false)
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState<string|null>(null)
  const [err,setErr]=useState<string|null>(null)

  async function loadAll(){
    const r1 = await fetch('/api/inventory'); setItems(await r1.json())
    const r2 = await fetch('/api/inventory/movements'); setMoves(await r2.json())
  }
  useEffect(()=>{ loadAll() },[])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    setErr(null); setMsg(null); setLoading(true)
    const res = await fetch('/api/inventory/adjust',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ itemId:+itemId, delta:+delta, type, note, allowNegative })
    })
    setLoading(false)
    if(!res.ok){
      const j=await res.json().catch(()=>({error:'Error'}))
      setErr(j.error||'No se pudo aplicar el ajuste')
      return
    }
    setMsg('Ajuste aplicado')
    setDelta(0); setNote('')
    await loadAll()
  }

  const selected = items.find(x=>x.id===+itemId)

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Ajustes / Mermas</h2>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {msg && <div className="text-green-700 text-sm">{msg}</div>}

        <form onSubmit={submit} className="grid md:grid-cols-3 gap-2">
          <select className="select" value={itemId} onChange={e=>setItemId(+e.target.value)}>
            <option value={0}>Elegí insumo…</option>
            {items.map(i=><option key={i.id} value={i.id}>{i.name} (stock: {i.currentStock} {i.unit})</option>)}
          </select>

          <input className="input" type="number" step="0.01" placeholder="Delta (ej: -1.5)"
                 value={delta} onChange={e=>setDelta(parseFloat(e.target.value||'0'))} />

          <select className="select" value={type} onChange={e=>setType(e.target.value as any)}>
            <option value="adjust">Ajuste</option>
            <option value="waste">Merma</option>
          </select>

          <input className="input md:col-span-2" placeholder="Motivo (opcional)" value={note} onChange={e=>setNote(e.target.value)} />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowNegative} onChange={e=>setAllowNegative(e.target.checked)} />
            Permitir stock negativo (no recomendado)
          </label>

          <button className="btn btn-primary md:col-span-3" disabled={loading || !itemId || !delta}>
            {loading ? 'Aplicando...' : 'Aplicar'}
          </button>
        </form>

        {selected && (
          <div className="text-sm text-gray-600 mt-2">
            Stock actual de <b>{selected.name}</b>: {selected.currentStock} {selected.unit}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Últimos movimientos</h2>
        <table className="table">
          <thead>
            <tr><th>Fecha</th><th>Insumo</th><th>Tipo</th><th>Cantidad</th><th>Nota</th></tr>
          </thead>
          <tbody>
            {moves.map(m=>(
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.item?.name}</td>
                <td>{m.type}</td>
                <td>{m.quantity}</td>
                <td>{m.note||'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
