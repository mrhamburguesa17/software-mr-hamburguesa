import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const closings = await prisma.cashClosing.findMany({ orderBy:{date:'desc'} })
  return NextResponse.json(closings)
}

export async function POST(){
  const start = new Date(); start.setHours(0,0,0,0)
  const end = new Date();   end.setHours(23,59,59,999)

  const sales = await prisma.sale.findMany({
    where:{ date:{ gte:start, lte:end } },
    include:{ items:{ include:{ recipe:{ include:{ items:true } } } } }
  })

  if(sales.length===0){
    return NextResponse.json({error:'No hay ventas en este día'}, {status:400})
  }

  let totalSales=0, totalCost=0, tickets=0, itemsSold=0
  const byMethod:Record<string,number> = { efectivo:0, tarjeta:0, transferencia:0, qr:0 }

  for(const s of sales){
    totalSales += s.subtotal
    tickets++
    for(const it of s.items){
      itemsSold += it.quantity
      // costo receta = sum(BOM.qty * costPerUnit) * cantidad vendida
      const unitCost = it.recipe.items.reduce((acc,ri)=> acc + (ri.quantity * (ri.item.costPerUnit||0)), 0)
      totalCost += it.quantity * unitCost
    }
    // Hoy no guardamos método en Sale; asumimos 'efectivo' por defecto
    const method = (s as any).method || 'efectivo'
    byMethod[method] = (byMethod[method]||0) + s.subtotal
  }

  const margin = totalSales - totalCost

  const closing = await prisma.cashClosing.create({
    data:{
      totalSales, totalCost, margin, tickets, itemsSold,
      byMethod: JSON.stringify(byMethod)
    }
  })

  return NextResponse.json(closing)
}
