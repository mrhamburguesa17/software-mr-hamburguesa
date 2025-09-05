import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/inventory/:id/restore  -> restaurar ítem (active=true, deletedAt=null)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { active: true, deletedAt: null }
    })
    return NextResponse.json({ ok: true, id: updated.id })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'No se pudo restaurar' }, { status: 500 })
  }
}

