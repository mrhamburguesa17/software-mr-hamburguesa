import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.inventoryMovement.findMany({
    include: { item: true },
    orderBy: { id: 'desc' },
    take: 100
  })
  return NextResponse.json(rows)
}
