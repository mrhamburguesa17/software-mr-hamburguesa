'use client'
import { useEffect, useMemo, useState } from 'react'
type Supplier={id:number;name:string}; type Item={id:number;name:string;unit:string}
export default function Page(){ const [date,setDate]=useState<string>(()=>new Date().toISOString().slice(0,10))
  const [suppliers,setSuppliers]=useState<Supplier[]>([]); const [supplierId,setSupplierId]=useState('')
  const [inventory,setInventory]=useState<Item[]>([]); const [rows,setRows]=useState([{itemId:'',quantity:0,unitCost:0}])
  useEffect(()=>{ fetch('/api/suppliers').then(r=>r.json()).then(setSuppliers); fetch('/api/inventory').then(r=>r.json()).then(setInventory) },[])
  function setRow(i:number,p:any){ setRows(prev=>prev.map((r,idx)=>idx===i?{...r,...p}:r)) }
  function addRow(){ setRows(prev=>[...prev,{itemId:'',quantity:0,unitCost:0}]) }
  function removeRow(i:number){ setRows(prev=>prev.filter((_,idx)=>idx!==i)) }
  const subtotal=useMemo(()=>rows.reduce((a,b)=>a+(Number(b.quantity)*Number(b.unitCost)||0),0),[rows])
  async function submit(e:any){ e.preventDefault(); const items=rows.filter(r=>r.itemId!==''&&Number(r.quantity)>0).map(r=>({itemId:+r.itemId,quantity:+r.quantity,unitCost:+r.unitCost})); if(items.length===0){alert('Agregá al menos un ítem');return}
    const res=await fetch('/api/purchases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,supplierId: supplierId===''?null:+supplierId,items})}); if(!res.ok){alert('Error registrando compra');return}
    alert('Compra registrada y stock actualizado'); setSupplierId(''); setRows([{itemId:'',quantity:0,unitCost:0}]) }
  return (<main className="space-y-4">
    <section className="card"><h2 className="text-lg font-semibold mb-3">Compras</h2>
      <form onSubmit={submit}>
        <div className="flex gap-3 mb-3">
          <div><div className="text-sm text-gray-300">Fecha</div><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div><div className="text-sm text-gray-300">Proveedor</div><select className="select" value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">(opcional)</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        </div>
        <table className="table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>$ Unitario</th><th>$ Total</th><th></th></tr></thead>
          <tbody>{rows.map((r,idx)=>(<tr key={idx}>
            <td><select className="select" value={r.itemId} onChange={e=>setRow(idx,{itemId:e.target.value})}><option value="">Elegir…</option>{inventory.map(it=><option key={it.id} value={it.id}>{it.name}</option>)}</select></td>
            <td><input className="input" type="number" step="0.01" value={r.quantity} onChange={e=>setRow(idx,{quantity:e.target.value})}/></td>
            <td><input className="input" type="number" step="0.01" value={r.unitCost} onChange={e=>setRow(idx,{unitCost:e.target.value})}/></td>
            <td>{(Number(r.quantity)*Number(r.unitCost)||0).toFixed(2)}</td>
            <td><button type="button" className="btn" onClick={()=>removeRow(idx)}>Borrar</button></td>
          </tr>))}</tbody></table>
        <div className="flex items-center justify-between mt-3"><button type="button" className="btn" onClick={addRow}>+ Agregar ítem</button><strong>Subtotal: ${subtotal.toFixed(2)}</strong></div>
        <div className="mt-3"><button className="btn btn-primary">Guardar compra</button></div>
      </form></section></main>) }