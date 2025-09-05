import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/inventory/trash  -> ítems borrados lógicamente
export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [{ active: false }, { deletedAt: { not: null } }]
    },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { id: 'desc' }
  })
  return NextResponse.json(items)
}

