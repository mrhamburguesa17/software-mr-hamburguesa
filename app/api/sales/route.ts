import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.sale.findMany({
    include: { items: { include: { recipe: true } } },
    orderBy: { id: 'desc' }
  })
  return NextResponse.json(rows)
}

export async function POST(req: Request){
  const b = await req.json()
  // b = { items: [{recipeId, quantity}], date? }
  if(!Array.isArray(b.items) || b.items.length === 0){
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  try{
    const result = await prisma.$transaction(async(tx)=>{
      const recipeIds = b.items.map((x:any)=> +x.recipeId)
      const recipes = await tx.recipe.findMany({
        where: { id: { in: recipeIds } },
        include: { items: true }
      })

      let subtotal = 0
      const saleItemsData:any[] = []
      const stockDelta: Record<number, number> = {} // itemId -> -cantidad

      for(const it of b.items){
        const r = recipes.find(x => x.id === +it.recipeId)
        const qty = +it.quantity
        if(!r || qty <= 0) throw new Error('receta inválida')
        subtotal += qty * (r.price || 0)
        saleItemsData.push({ recipeId: r.id, quantity: qty, unitPrice: r.price || 0 })
        for(const bom of r.items){
          stockDelta[bom.itemId] = (stockDelta[bom.itemId] || 0) - (bom.quantity * qty)
        }
      }

      // Verificar stock suficiente (no permitir negativo)
      const items = await tx.inventoryItem.findMany({
        where: { id: { in: Object.keys(stockDelta).map(Number) } }
      })
      for(const it of items){
        const after = Number(it.currentStock) + (stockDelta[it.id] || 0)
        if(after < 0){
          throw new Error(`Stock insuficiente para ${it.name}. Falta ${Math.abs(after).toFixed(2)} ${it.unit}`)
        }
      }

      // Crear venta
      const sale = await tx.sale.create({
        data: {
          date: b.date ? new Date(b.date) : new Date(),
          subtotal,
          items: { create: saleItemsData }
        }
      })

      // Aplicar movimientos de stock
      for(const it of items){
        const delta = stockDelta[it.id] || 0
        if(delta !== 0){
          await tx.inventoryItem.update({
            where: { id: it.id },
            data: { currentStock: Number(it.currentStock) + delta }
          })
          await tx.inventoryMovement.create({
            data: { itemId: it.id, type: 'sale', quantity: Math.abs(delta), note: `Venta #${sale.id}` }
          })
        }
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  }catch(e:any){
    return NextResponse.json({ error: e.message || 'Error en venta' }, { status: 400 })
  }
}
