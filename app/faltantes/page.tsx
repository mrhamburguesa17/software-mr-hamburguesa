'use client'
import { useEffect, useMemo, useState } from 'react'

type Item = { id:number; name:string; unit:string; minStock:number; currentStock:number; costPerUnit:number }

export default function Page(){
  const [items,setItems]=useState<Item[]>([])

  async function load(){
    const r = await fetch('/api/inventory')
    const j = await r.json()
    setItems(j)
  }
  useEffect(()=>{ load() },[])

  const low = useMemo(()=>items.filter(i=>i.minStock>0 && i.currentStock < i.minStock),[items])

  const totalReponer = useMemo(()=>{
    return low.reduce((acc,i)=> acc + Math.max(0, i.minStock - i.currentStock) * (i.costPerUnit||0), 0)
  },[low])

  return (
    <main className="space-y-4">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Faltantes (stock bajo)</h2>
        <table className="table">
          <thead>
            <tr><th>Insumo</th><th>Mínimo</th><th>Actual</th><th>A reponer</th><th>Estimado $</th></tr>
          </thead>
          <tbody>
            {low.map(i=>{
              const need = Math.max(0, i.minStock - i.currentStock)
              const est = need * (i.costPerUnit||0)
              return (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.minStock} {i.unit}</td>
                  <td className="text-red-600 font-semibold">{i.currentStock} {i.unit}</td>
                  <td>{need.toFixed(2)} {i.unit}</td>
                  <td>${est.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-semibold">Total estimado</td>
              <td className="font-semibold">${totalReponer.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </main>
  )
}
