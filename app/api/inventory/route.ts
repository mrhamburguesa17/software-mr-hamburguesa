// app/api/inventory/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/inventory -> solo activos
export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    where: { active: true },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { id: 'desc' }
  })
  return NextResponse.json(items)
}

// POST /api/inventory -> crear (queda activo=true por defecto)
export async function POST(req: Request) {
  const body = await req.json()
  const payload: any = {
    name: String(body.name),
    unit: String(body.unit),
    category: body.category ?? null,
    minStock: Number(body.minStock) || 0,
    currentStock: Number(body.currentStock) || 0,
    costPerUnit: Number(body.costPerUnit) || 0,
    // active y deletedAt toman sus defaults (true / null)
  }
  if (body.supplierId != null && body.supplierId !== '') {
    payload.supplierId = Number(body.supplierId)
  }

  const created = await prisma.inventoryItem.create({ data: payload })
  return NextResponse.json(created, { status: 201 })
}

