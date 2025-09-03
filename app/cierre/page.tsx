'use client'
import { useEffect, useState } from 'react'

type Closing = {
  id:number
  date:string
  totalSales:number
  totalCost:number
  margin:number
  byMethod:any
  tickets:number
  itemsSold:number
}

export default function CierrePage(){
  const [data,setData]=useState<Closing[]>([])
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState<string|null>(null)
  const [err,setErr]=useState<string|null>(null)

  async function load(){
    const r = await fetch('/api/closings')
    setData(await r.json())
  }
  useEffect(()=>{ load() },[])

  async function cerrar(){
    setLoading(true); setMsg(null); setErr(null)
    const res = await fetch('/api/closings',{method:'POST'})
    setLoading(false)
    if(!res.ok){
      const j=await res.json().catch(()=>({error:'Error'}))
      setErr(j.error||'Error al cerrar'); return
    }
    setMsg('Caja cerrada con éxito')
    await load()
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Cierre de Caja</h2>
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
        {msg && <div className="text-green-700 text-sm mb-2">{msg}</div>}
        <button className="btn btn-primary" onClick={cerrar} disabled={loading}>
          {loading ? 'Procesando...' : 'Cerrar caja de hoy'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Calcula ventas del día, costo estimado por BOM y margen.
        </p>
      </section>

      <section className="card">
        <h3 className="font-semibold mb-2">Historial de cierres</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tickets</th>
              <th>Items</th>
              <th>Total Ventas</th>
              <th>Costo</th>
              <th>Margen</th>
              <th>Medios</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c=>{
              const by = typeof c.byMethod === 'string' ? JSON.parse(c.byMethod) : (c.byMethod || {})
              return (
                <tr key={c.id}>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td>{c.tickets}</td>
                  <td>{c.itemsSold}</td>
                  <td>${c.totalSales.toFixed(2)}</td>
                  <td>${c.totalCost.toFixed(2)}</td>
                  <td className={c.margin>=0?'text-green-700':'text-red-600'}>${c.margin.toFixed(2)}</td>
                  <td>
                    {Object.entries(by).map(([k,v])=>(
                      <div key={k}>{k}: ${Number(v).toFixed(2)}</div>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </main>
  )
}
