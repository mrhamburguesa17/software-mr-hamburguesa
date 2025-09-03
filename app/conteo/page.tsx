'use client'
import { useEffect, useState } from 'react'

type Item = { id:number; name:string; unit:string; currentStock:number }

export default function Page(){
  const [items,setItems]=useState<Item[]>([])
  const [counts,setCounts]=useState<Record<number,string>>({})
  const [msg,setMsg]=useState<string|null>(null)
  const [err,setErr]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)

  async function load(){
    const r = await fetch('/api/inventory')
    setItems(await r.json())
  }
  useEffect(()=>{ load() },[])

  function setCount(id:number, val:string){
    setCounts(c=>({...c,[id]:val}))
  }

  async function submit(e:React.FormEvent){
    e.preventDefault()
    setMsg(null); setErr(null); setLoading(true)
    const itemsBody = Object.entries(counts)
      .map(([id,val])=>({ itemId:+id, counted:+val }))
      .filter(x=>!isNaN(x.counted))
    if(itemsBody.length===0){ setErr('No cargaste valores'); setLoading(false); return }
    const res = await fetch('/api/inventory/count',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items: itemsBody })
    })
    setLoading(false)
    if(!res.ok){ const j=await res.json().catch(()=>({error:'Error'})); setErr(j.error); return }
    setMsg('Conteo aplicado. Stock actualizado.')
    setCounts({})
    await load()
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Conteo físico</h2>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {msg && <div className="text-green-700 text-sm">{msg}</div>}

        <form onSubmit={submit} className="space-y-3">
          <table className="table">
            <thead>
              <tr><th>Insumo</th><th>Stock actual</th><th>Contado</th></tr>
            </thead>
            <tbody>
              {items.map(i=>(
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.currentStock} {i.unit}</td>
                  <td>
                    <input className="input" type="number" step="0.01"
                      value={counts[i.id] ?? ''}
                      onChange={e=>setCount(i.id,e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-primary" disabled={loading}>
            {loading? 'Aplicando...' : 'Aplicar conteo'}
          </button>
        </form>
      </section>
    </main>
  )
}
