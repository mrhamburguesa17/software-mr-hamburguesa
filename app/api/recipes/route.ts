import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.recipe.findMany({
    include: { items: { include: { item: true } } },
    orderBy: { id: 'desc' }
  })
  return NextResponse.json(rows)
}

export async function POST(req: Request){
  const b = await req.json()
  // b = { name, price, items: [{itemId, quantity}] }
  if(!b.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const items = Array.isArray(b.items) ? b.items : []
  const row = await prisma.recipe.create({
    data: {
      name: String(b.name),
      price: Number(b.price ?? 0),
      items: { create: items.map((i:any)=>({ itemId: +i.itemId, quantity: +i.quantity })) }
    },
    include: { items: { include: { item: true } } }
  })
  return NextResponse.json(row, { status: 201 })
}
