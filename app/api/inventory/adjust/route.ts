import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST body:
 * {
 *   itemId: number,
 *   delta: number,           // puede ser negativo (baja) o positivo (alta)
 *   type: 'adjust'|'waste',  // 'adjust' = ajuste, 'waste' = merma/desperdicio
 *   note?: string,
 *   allowNegative?: boolean  // default false: no permite stock negativo
 * }
 */
export async function POST(req: Request){
  const b = await req.json()
  const itemId = Number(b.itemId)
  const delta = Number(b.delta)
  const type = String(b.type||'adjust')
  const note = b.note ? String(b.note) : null
  const allowNegative = Boolean(b.allowNegative ?? false)

  if(!itemId || !delta || Number.isNaN(delta)){
    return NextResponse.json({error:'itemId y delta son requeridos'}, {status:400})
  }
  if(!['adjust','waste'].includes(type)){
    return NextResponse.json({error:'type inválido'}, {status:400})
  }

  try{
    const result = await prisma.$transaction(async(tx)=>{
      const it = await tx.inventoryItem.findUnique({ where:{ id:itemId } })
      if(!it) throw new Error('Insumo inexistente')

      const after = Number(it.currentStock) + delta
      if(!allowNegative && after < 0){
        throw new Error(`Stock no puede quedar negativo. Actual: ${it.currentStock}, delta: ${delta}`)
      }

      const updated = await tx.inventoryItem.update({
        where:{ id:itemId },
        data:{ currentStock: after }
      })

      await tx.inventoryMovement.create({
        data:{
          itemId,
          type,
          quantity: Math.abs(delta),
          note: note ?? (type==='waste' ? 'Merma' : 'Ajuste')
        }
      })

      return updated
    })

    return NextResponse.json({ok:true, item: result}, {status:201})
  }catch(e:any){
    return NextResponse.json({error: e.message || 'Error de ajuste'}, {status:400})
  }
}
