'use client'
import { useEffect, useMemo, useState } from 'react'

type Recipe = { id:number; name:string; price:number }
type SaleRow = {
  id:number
  date:string
  subtotal:number
  items:{ id:number; recipe:{id:number; name:string; price:number}; quantity:number; unitPrice:number }[]
}
type Line = { recipeId:number; quantity:number }

export default function Page(){
  const [recipes,setRecipes]=useState<Recipe[]>([])
  const [cart,setCart]=useState<Line[]>([{recipeId:0,quantity:1}])
  const [sales,setSales]=useState<SaleRow[]>([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [ok,setOk]=useState<string|null>(null)

  async function loadAll(){
    const r1=await fetch('/api/recipes'); setRecipes(await r1.json())
    const r2=await fetch('/api/sales'); setSales(await r2.json())
  }
  useEffect(()=>{ loadAll() },[])

  function setLine(i:number,patch:Partial<Line>){
    setCart(c=>c.map((l,idx)=>idx===i?{...l,...patch}:l))
  }
  function addLine(){ setCart(c=>[...c,{recipeId:0,quantity:1}]) }
  function removeLine(i:number){ setCart(c=>c.filter((_,idx)=>idx!==i)) }

  const total = useMemo(()=>{
    let sum=0
    for(const l of cart){
      const r = recipes.find(x=>x.id===+l.recipeId)
      if(!r) continue
      const q = +l.quantity||0
      sum += (r.price||0)*q
    }
    return sum
  },[cart,recipes])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    setError(null); setOk(null); setLoading(true)
    const items = cart.filter(l=>l.recipeId>0 && l.quantity>0).map(l=>({recipeId:+l.recipeId,quantity:+l.quantity}))
    if(items.length===0){ setError('Agregá al menos una receta con cantidad'); setLoading(false); return }
    const res = await fetch('/api/sales',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ items }) })
    setLoading(false)
    if(!res.ok){
      const j=await res.json().catch(()=>({error:'Error'}))
      setError(j.error||'No se pudo guardar la venta')
      return
    }
    setOk('Venta registrada')
    setCart([{recipeId:0,quantity:1}])
    await loadAll()
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Nueva venta</h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {ok && <div className="text-green-700 text-sm mb-2">{ok}</div>}

        <form onSubmit={submit} className="space-y-3">
          {cart.map((l,i)=>(
            <div key={i} className="grid md:grid-cols-3 gap-2 items-center">
              <select className="select" value={l.recipeId} onChange={e=>setLine(i,{recipeId:+e.target.value})}>
                <option value={0}>Elegí receta…</option>
                {recipes.map(r=><option key={r.id} value={r.id}>{r.name} — ${r.price?.toFixed?.(2) ?? r.price}</option>)}
              </select>
              <input className="input" type="number" min={1} step={1} value={l.quantity}
                     onChange={e=>setLine(i,{quantity:Math.max(1,parseInt(e.target.value||'1'))})}/>
              <div className="flex gap-2">
                <button type="button" className="btn" onClick={()=>removeLine(i)}>Quitar</button>
                {i===cart.length-1 && <button type="button" className="btn" onClick={addLine}>Agregar línea</button>}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <div className="text-lg font-semibold">Total: ${total.toFixed(2)}</div>
            <button className="btn btn-primary" disabled={loading}>{loading?'Guardando...':'Confirmar venta'}</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Ventas recientes</h2>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Fecha</th><th>Items</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {sales.map(s=>(
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{new Date(s.date).toLocaleString()}</td>
                <td>
                  <ul className="list-disc list-inside">
                    {s.items.map(it=>(
                      <li key={it.id}>{it.recipe.name} × {it.quantity} — ${it.unitPrice?.toFixed?.(2) ?? it.unitPrice}</li>
                    ))}
                  </ul>
                </td>
                <td>${s.subtotal?.toFixed?.(2) ?? s.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
