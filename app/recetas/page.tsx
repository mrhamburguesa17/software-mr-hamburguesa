'use client'
import { useEffect, useState } from 'react'

type Inv = { id:number; name:string; unit:string }
type Bom = { itemId:number; quantity:number }
type RecipeRow = { id:number; name:string; price:number; items:{ id:number; quantity:number; item:Inv }[] }

export default function Page(){
  const [inv, setInv] = useState<Inv[]>([])
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [bom, setBom] = useState<Bom[]>([{ itemId: 0, quantity: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function load(){
    const invRes = await fetch('/api/inventory')
    const invJson = await invRes.json()
    setInv(invJson.map((x:any)=>({ id:x.id, name:x.name, unit:x.unit })))
    const r = await fetch('/api/recipes')
    setRows(await r.json())
  }

  useEffect(()=>{ load() },[])

  function setBomItem(i:number, patch:Partial<Bom>){
    setBom(b=>b.map((row,idx)=> idx===i ? { ...row, ...patch } : row))
  }
  function addBomLine(){ setBom(b=>[...b, { itemId: 0, quantity: 0 }]) }
  function removeBomLine(i:number){ setBom(b=>b.filter((_,idx)=> idx!==i)) }

  async function addRecipe(e:React.FormEvent){
    e.preventDefault(); setError(null); setLoading(true)
    const items = bom.filter(x=>x.itemId>0 && x.quantity>0)
    if(!name.trim()){ setError('Falta nombre'); setLoading(false); return }
    const res = await fetch('/api/recipes', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, price:+price||0, items })
    })
    setLoading(false)
    if(!res.ok){
      const j = await res.json().catch(()=>({error:'Error'}))
      setError(j.error||'Error al crear receta')
      return
    }
    setName(''); setPrice(0); setBom([{ itemId:0, quantity:0 }])
    await load()
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Nueva receta (BOM)</h2>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form onSubmit={addRecipe} className="grid md:grid-cols-3 gap-2">
          <input className="input" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" type="number" step="0.01" placeholder="Precio de venta" value={price} onChange={e=>setPrice(parseFloat(e.target.value||'0'))} />
          <div className="md:col-span-3 space-y-2">
            <div className="font-medium">Ingredientes (por UNA unidad)</div>
            {bom.map((line, i)=>(
              <div key={i} className="grid md:grid-cols-3 gap-2 items-center">
                <select className="select" value={line.itemId} onChange={e=>setBomItem(i,{ itemId: +e.target.value })}>
                  <option value={0}>Elegí insumo…</option>
                  {inv.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <input className="input" type="number" step="0.001" placeholder="Cantidad" value={line.quantity||0} onChange={e=>setBomItem(i,{ quantity: parseFloat(e.target.value||'0') })} />
                <div className="flex gap-2">
                  <button type="button" className="btn" onClick={()=>removeBomLine(i)}>Quitar</button>
                  {i===bom.length-1 && <button type="button" className="btn" onClick={addBomLine}>Agregar línea</button>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary md:col-span-3" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear receta'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Recetas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Precio</th><th>Ingredientes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>${r.price?.toFixed?.(2) ?? r.price}</td>
                <td>
                  <ul className="list-disc list-inside">
                    {r.items.map(it=>(
                      <li key={it.id}>
                        {it.item.name}: {it.quantity} {it.item.unit}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
