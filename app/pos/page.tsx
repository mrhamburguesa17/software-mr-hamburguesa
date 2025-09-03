'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

type Inv = { id:number; name:string; unit:string; currentStock:number }
type RecipeItem = { id:number; itemId:number; quantity:number; item:Inv }
type Recipe = { id:number; name:string; price:number; items:RecipeItem[] }

type Line   = { recipeId:number; name:string; basePrice:number; price:number; qty:number }
type Parked = { id:string; label:string; cart:Line[]; note:string; createdAt:number }

const FAVORITES_KEY = 'mh_pos_favorites'
const CART_KEY      = 'mh_pos_cart'
const SETTINGS_KEY  = 'mh_pos_settings'
const PARKED_KEY    = 'mh_pos_parked'

type Settings = {
  roundTo5: boolean
  defaultPayment: 'efectivo'|'tarjeta'|'transferencia'|'qr'
  cashSteps: number[] // atajos de efectivo
}

export default function POSPage(){
  // catálogo e inventario
  const [recipes,setRecipes]=useState<Recipe[]>([])
  const [invMap,setInvMap]=useState<Record<number,Inv>>({})

  // ui y filtros
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState<'all'|'fav'|'available'|'soldout'>('all')
  const [favorites,setFavorites]=useState<number[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  // carrito y cobro
  const [cart,setCart]=useState<Line[]>([])
  const [discountPct,setDiscountPct]=useState<number>(0)
  const [discountAmt,setDiscountAmt]=useState<number>(0)
  const [payment,setPayment]=useState<Settings['defaultPayment']>('efectivo')
  const [cashGiven,setCashGiven]=useState<number>(0)
  const [note,setNote]=useState<string>('')

  // config
  const [settings,setSettings]=useState<Settings>({ roundTo5:true, defaultPayment:'efectivo', cashSteps:[1000,2000,5000,10000] })

  // estado
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [ok,setOk]=useState<string|null>(null)
  const [parked,setParked]=useState<Parked[]>([])

  // sonidos (base64 muy cortitos)
  const sndOk = useRef<HTMLAudioElement>()
  const sndErr = useRef<HTMLAudioElement>()
  useEffect(()=>{
    sndOk.current = new Audio('data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAA'); // blip corto
    sndErr.current = new Audio('data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAA'); // mismo, distinto uso
  },[])

  // cargar catálogo/inventario + estados persistidos
  useEffect(()=>{
    (async()=>{
      const invRes = await fetch('/api/inventory'); const invJson = await invRes.json()
      const inv:Record<number,Inv> = {}
      for(const i of invJson) inv[i.id] = { id:i.id, name:i.name, unit:i.unit, currentStock:i.currentStock }
      setInvMap(inv)

      const r = await fetch('/api/recipes'); const j = await r.json()
      const recs:Recipe[] = j.map((x:any)=>({
        id:x.id, name:x.name, price:x.price||0,
        items:(x.items||[]).map((ri:any)=>({
          id:ri.id, itemId:ri.itemId, quantity:ri.quantity,
          item: inv[ri.itemId] || {id:ri.itemId,name:'?',unit:'',currentStock:0}
        }))
      }))
      setRecipes(recs)

      try{
        const fav = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
        setFavorites(Array.isArray(fav)?fav:[])
      }catch{}
      try{
        const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
        if(Array.isArray(savedCart) && savedCart.length) setCart(savedCart)
      }catch{}
      try{
        const conf = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
        setSettings(s=>({...s, ...conf}))
        if(conf?.defaultPayment) setPayment(conf.defaultPayment)
      }catch{}
      try{
        const p = JSON.parse(localStorage.getItem(PARKED_KEY) || '[]')
        setParked(Array.isArray(p)?p:[])
      }catch{}
    })()
  },[])

  // autosave carrito
  useEffect(()=>{ localStorage.setItem(CART_KEY, JSON.stringify(cart)) },[cart])

  // raciones disponibles por receta según BOM
  function servingsAvailable(r:Recipe){
    if(!r.items?.length) return Infinity
    let min = Infinity
    for(const bom of r.items){
      const s = (invMap[bom.itemId]?.currentStock ?? 0) / (bom.quantity || 1)
      if(s < min) min = s
    }
    return Math.floor(min)
  }

  // filtro catálogo
  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    let list = recipes
    if(q) list = list.filter(r=>r.name.toLowerCase().includes(q))
    if(filter==='fav') list = list.filter(r=>favorites.includes(r.id))
    if(filter==='available') list = list.filter(r=>servingsAvailable(r) > 0)
    if(filter==='soldout') list = list.filter(r=>servingsAvailable(r) <= 0)
    list = [...list].sort((a,b)=>{
      const af=favorites.includes(a.id)?0:1, bf=favorites.includes(b.id)?0:1
      if(af!==bf) return af-bf
      return a.name.localeCompare(b.name)
    })
    return list
  },[recipes,query,filter,favorites,invMap])

  // favoritos
  function toggleFav(id:number){
    setFavorites(prev=>{
      const set = new Set(prev)
      set.has(id)? set.delete(id) : set.add(id)
      const arr=[...set]; localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr))
      return arr
    })
  }

  // carrito
  function addToCart(rec:Recipe){
    if(servingsAvailable(rec)<=0){ beep('err'); return }
    setCart(c=>{
      const i=c.findIndex(x=>x.recipeId===rec.id)
      if(i>=0){ const copy=[...c]; copy[i]={...copy[i],qty:copy[i].qty+1}; return copy }
      return [...c,{recipeId:rec.id,name:rec.name,basePrice:rec.price,price:rec.price,qty:1}]
    })
    beep('ok')
  }
  function setQty(recipeId:number, qty:number){
    if(qty<=0) return remove(recipeId)
    setCart(c=>c.map(x=>x.recipeId===recipeId?{...x,qty}:x))
  }
  function setLinePrice(recipeId:number, price:number){
    setCart(c=>c.map(x=>x.recipeId===recipeId?{...x,price: Math.max(0, price)}:x))
  }
  function remove(recipeId:number){ setCart(c=>c.filter(x=>x.recipeId!==recipeId)) }
  function clear(){
    setCart([]); setOk(null); setError(null)
    setDiscountAmt(0); setDiscountPct(0); setCashGiven(0); setNote('')
  }

  // totales
  const subtotal = useMemo(()=> cart.reduce((a,l)=>a+l.qty*l.price,0),[cart])
  const discountByPct = useMemo(()=> +(subtotal*(discountPct/100)).toFixed(2),[subtotal,discountPct])
  const discountTotal = useMemo(()=> Math.min(subtotal, +(discountByPct + discountAmt).toFixed(2)),[subtotal,discountByPct,discountAmt])
  const totalRaw = useMemo(()=> Math.max(0, subtotal - discountTotal),[subtotal,discountTotal])
  const total = useMemo(()=> settings.roundTo5 ? roundToNearest(totalRaw, 5) : +totalRaw.toFixed(2),[totalRaw,settings.roundTo5])
  const change = useMemo(()=> payment==='efectivo' ? Math.max(0, +(cashGiven - total).toFixed(2)) : 0,[payment,cashGiven,total])

  // atajos globales
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      // F1: foco en búsqueda
      if(e.key==='F1'){ e.preventDefault(); searchRef.current?.focus(); return }
      // ESC: limpiar búsqueda
      if(e.key==='Escape'){ setQuery(''); return }
      // Ctrl+Enter: cobrar
      if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); const fake={preventDefault(){}} as any; submit(fake); return }
      // 1..9: agrega top filtrado
      if(/^[1-9]$/.test(e.key) && filtered[Number(e.key)-1]){
        e.preventDefault(); addToCart(filtered[Number(e.key)-1])
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[filtered,cart,subtotal,total,settings.roundTo5])

  // enviar venta
  async function submit(e:React.FormEvent){
    e.preventDefault()
    if(cart.length===0) return
    setLoading(true); setError(null); setOk(null)
    const items = cart.map(l=>({ recipeId:l.recipeId, quantity:l.qty }))
    const res = await fetch('/api/sales',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items })
    })
    setLoading(false)
    if(!res.ok){
      const j=await res.json().catch(()=>({error:'Error'}))
      setError(j.error||'No se pudo registrar la venta'); beep('err'); return
    }
    setOk('Venta registrada')
    beep('ok')
    printTicket(cart, subtotal, discountTotal, total, payment, cashGiven, change, note)
    clear()
  }

  // pedidos suspendidos
  function parkOrder(){
    if(cart.length===0) return
    const label = prompt('Nombre del pedido (Mesa/Cliente):','Pedido') || 'Pedido'
    const id = Date.now().toString(36)
    const p:Parked = { id, label, cart:[...cart], note, createdAt: Date.now() }
    const arr = [p, ...parked]
    setParked(arr); localStorage.setItem(PARKED_KEY, JSON.stringify(arr))
    clear()
  }
  function resumeOrder(id:string){
    const p = parked.find(x=>x.id===id); if(!p) return
    setCart(p.cart); setNote(p.note||'')
    const rest = parked.filter(x=>x.id!==id); setParked(rest)
    localStorage.setItem(PARKED_KEY, JSON.stringify(rest))
  }
  function deleteParked(id:string){
    const rest = parked.filter(x=>x.id!==id); setParked(rest)
    localStorage.setItem(PARKED_KEY, JSON.stringify(rest))
  }

  // configuración simple persistente
  function setAndSaveSettings(patch:Partial<Settings>){
    const next = { ...settings, ...patch }
    setSettings(next); localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }

  return (
    <main className="space-y-4">
      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">POS Rápido</h2>
          <div className="flex gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.roundTo5} onChange={e=>setAndSaveSettings({roundTo5:e.target.checked})}/>
              Redondear a $5
            </label>
            <select className="select" value={payment} onChange={e=>{setPayment(e.target.value as any); setAndSaveSettings({defaultPayment:e.target.value as any})}}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="qr">QR</option>
            </select>
          </div>
        </div>

        {/* BARRA SUPERIOR */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <input
            ref={searchRef}
            className="input min-w-[220px]"
            placeholder="Buscar (F1 busca, 1..9 agrega)"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <div className="flex gap-1">
            <button className={`btn ${filter==='all'?'btn-primary':''}`} onClick={()=>setFilter('all')}>Todos</button>
            <button className={`btn ${filter==='fav'?'btn-primary':''}`} onClick={()=>setFilter('fav')}>Favoritos</button>
            <button className={`btn ${filter==='available'?'btn-primary':''}`} onClick={()=>setFilter('available')}>Disponibles</button>
            <button className={`btn ${filter==='soldout'?'btn-primary':''}`} onClick={()=>setFilter('soldout')}>Agotados</button>
          </div>
          <button className="btn" onClick={parkOrder} disabled={cart.length===0}>Suspender</button>
          <button className="btn" onClick={clear}>Limpiar</button>
        </div>

        <div className="grid xl:grid-cols-3 gap-3">
          {/* Catálogo */}
          <div className="xl:col-span-2 space-y-2">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-2 max-h-[60vh] overflow-auto pr-1">
              {filtered.map((r, idx)=>{
                const avail = servingsAvailable(r)
                const fav = favorites.includes(r.id)
                const soldOut = avail<=0
                return (
                  <div key={r.id} className={`rounded border p-2 flex flex-col gap-2 ${soldOut?'opacity-50':''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate" title={r.name}>{idx<9 && <kbd className="px-1 border rounded text-xs mr-1">{idx+1}</kbd>}{r.name}</div>
                      <button className={`text-sm ${fav?'text-yellow-600':'text-gray-400'}`} title="Favorito" onClick={()=>toggleFav(r.id)}>★</button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>${r.price.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${soldOut?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>
                        {soldOut?'Agotado':`x${avail}`}
                      </span>
                    </div>
                    <button className="btn" disabled={soldOut} onClick={()=>addToCart(r)}>Agregar</button>
                  </div>
                )
              })}
              {filtered.length===0 && <div className="text-sm text-gray-500">Sin resultados</div>}
            </div>
          </div>

          {/* Carrito / Cobro / Parked */}
          <div className="space-y-3">
            {/* Carrito */}
            <div className="border rounded p-2 max-h-[38vh] overflow-auto">
              {cart.length===0 && <div className="text-sm text-gray-500">Carrito vacío</div>}
              {cart.map(l=>(
                <div key={l.recipeId} className="grid grid-cols-12 gap-2 items-center py-1 border-b last:border-b-0">
                  <div className="col-span-5">
                    <div className="font-medium truncate" title={l.name}>{l.name}</div>
                    <div className="text-xs text-gray-500">Base ${l.basePrice.toFixed(2)}</div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <button className="btn" onClick={()=>setQty(l.recipeId, l.qty-1)}>-</button>
                    <input className="input w-16 text-center" type="number" min={1} step={1}
                           value={l.qty} onChange={e=>setQty(l.recipeId, Math.max(1, parseInt(e.target.value||'1')))} />
                    <button className="btn" onClick={()=>setQty(l.recipeId, l.qty+1)}>+</button>
                  </div>
                  <div className="col-span-2">
                    <input className="input w-full text-right" type="number" step="0.01"
                           title="Precio unitario (override)"
                           value={l.price} onChange={e=>setLinePrice(l.recipeId, parseFloat(e.target.value||'0'))}/>
                  </div>
                  <div className="col-span-1 text-right">${(l.qty*l.price).toFixed(2)}</div>
                  <div className="col-span-1"><button className="btn" onClick={()=>remove(l.recipeId)}>✕</button></div>
                </div>
              ))}
            </div>

            {/* Cobro */}
            <div className="card space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">Desc. %<input className="input w-full" type="number" step="0.1" value={discountPct} onChange={e=>setDiscountPct(parseFloat(e.target.value||'0'))}/></label>
                <label className="text-sm">Desc. $<input className="input w-full" type="number" step="0.1" value={discountAmt} onChange={e=>setDiscountAmt(parseFloat(e.target.value||'0'))}/></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="select" value={payment} onChange={e=>setPayment(e.target.value as any)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="qr">QR</option>
                </select>
                <input className="input" type="number" step="0.5" placeholder="Entregado" value={cashGiven} onChange={e=>setCashGiven(parseFloat(e.target.value||'0'))}/>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.cashSteps.map(v=>(
                  <button key={v} className="btn" onClick={()=>setCashGiven(prev=>+(prev+v).toFixed(2))}>+${v}</button>
                ))}
                <button className="btn" onClick={()=>setCashGiven(total)}>=Total</button>
                <button className="btn" onClick={()=>setCashGiven(0)}>Limpiar</button>
              </div>

              <textarea className="input w-full" placeholder="Nota en ticket (opcional)" value={note} onChange={e=>setNote(e.target.value)} />

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Subtotal</div><div className="text-right">${subtotal.toFixed(2)}</div>
                <div>Descuento</div><div className="text-right">-${discountTotal.toFixed(2)}</div>
                {settings.roundTo5 && <><div>Redondeo</div><div className="text-right">${(total - (subtotal-discountTotal)).toFixed(2)}</div></>}
                <div className="font-semibold">TOTAL</div><div className="text-right font-semibold">${total.toFixed(2)}</div>
                {payment==='efectivo' && <>
                  <div>Vuelto</div><div className="text-right">${change.toFixed(2)}</div>
                </>}
              </div>

              <form onSubmit={submit} className="pt-1">
                <button className="btn btn-primary w-full" disabled={loading || cart.length===0}>
                  {loading ? 'Guardando...' : 'Cobrar (Ctrl+Enter)'}
                </button>
              </form>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {ok && <div className="text-green-700 text-sm">{ok}</div>}
            </div>

            {/* Pedidos suspendidos */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Suspendidos</div>
                <button className="btn" onClick={()=>{ setParked([]); localStorage.setItem(PARKED_KEY,'[]') }} disabled={!parked.length}>Vaciar</button>
              </div>
              <div className="space-y-1 max-h-[22vh] overflow-auto pr-1">
                {parked.length===0 && <div className="text-sm text-gray-500">No hay pedidos</div>}
                {parked.map(p=>(
                  <div key={p.id} className="flex items-center justify-between border rounded p-2">
                    <div className="truncate">
                      <div className="font-medium truncate" title={p.label}>{p.label}</div>
                      <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn" onClick={()=>resumeOrder(p.id)}>Reanudar</button>
                      <button className="btn" onClick={()=>deleteParked(p.id)}>Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}

/* ---------- helpers ---------- */
function roundToNearest(n:number, step:number){
  const r = Math.round(n/step)*step
  return +r.toFixed(2)
}

function printTicket(
  cart:Line[], subtotal:number, discount:number, total:number,
  payment:'efectivo'|'tarjeta'|'transferencia'|'qr',
  cashGiven:number, change:number, note:string
){
  const fecha = new Date().toLocaleString()
  const lines = cart.map(l=>`${l.name}  x${l.qty}  $${(l.qty*l.price).toFixed(2)}`).join('\n')
  const body =
`MR HAMBURGUESA
Ticket no fiscal
${fecha}

${lines}

Subtotal: $${subtotal.toFixed(2)}
Descuento: -$${discount.toFixed(2)}
Total: $${total.toFixed(2)}
Pago: ${payment}${payment==='efectivo' ? `  Entregado: $${cashGiven.toFixed(2)}  Vuelto: $${change.toFixed(2)}` : ''}

${note ? 'Nota: '+note+'\n\n' : ''}¡Gracias por su compra!`

  const win = window.open('', '_blank', 'width=420,height=700')
  if(!win) return
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket</title>
        <style>
          @page { size: 58mm auto; margin: 6mm; }
          body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .ticket { white-space: pre-wrap; font-size: 12px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <pre class="ticket">${escapeHtml(body)}</pre>
        <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 150)}</script>
      </body>
    </html>
  `)
  win.document.close()
}

function escapeHtml(s:string){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m] as string))
}

function beep(kind:'ok'|'err'){
  try{
    const ctx = new (window.AudioContext|| (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = kind==='ok' ? 'triangle' : 'sawtooth'
    o.frequency.value = kind==='ok'? 660 : 200
    g.gain.setValueAtTime(0.02, ctx.currentTime)
    o.start()
    o.stop(ctx.currentTime + 0.09)
  }catch{/* sin sonido si no hay webaudio */}
}
