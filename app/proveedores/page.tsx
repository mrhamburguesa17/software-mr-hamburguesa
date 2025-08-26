'use client'
import { useEffect, useState } from 'react'
type Supplier={id:number;name:string;contact?:string|null;phone?:string|null;notes?:string|null}
export default function Page(){ const [rows,setRows]=useState<Supplier[]>([]); const [f,setF]=useState({name:'',contact:'',phone:'',notes:''})
  async function load(){ setRows(await (await fetch('/api/suppliers')).json()) }
  useEffect(()=>{ load() },[])
  async function add(e:any){ e.preventDefault(); await fetch('/api/suppliers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}); setF({name:'',contact:'',phone:'',notes:''}); await load() }
  async function remove(id:number){ if(!confirm('Eliminar proveedor?')) return; await fetch(`/api/suppliers/${id}`,{method:'DELETE'}); await load() }
  return (<main className="space-y-4">
    <section className="card"><h2 className="text-lg font-semibold mb-3">Proveedores</h2>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2">
        <input className="input" placeholder="Nombre" required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <input className="input" placeholder="Contacto" value={f.contact} onChange={e=>setF({...f,contact:e.target.value})}/>
        <input className="input" placeholder="Teléfono" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
        <input className="input" placeholder="Notas" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
        <button className="btn btn-primary md:col-span-4">Agregar</button>
      </form></section>
    <section className="card">
      <table className="table"><thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th><th>Tel</th><th>Notas</th><th></th></tr></thead>
        <tbody>{rows.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.contact||'-'}</td><td>{r.phone||'-'}</td><td>{r.notes||'-'}</td><td><button className="btn" onClick={()=>remove(r.id)}>Borrar</button></td></tr>))}</tbody>
      </table></section></main>) }