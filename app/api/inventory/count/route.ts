import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST body: { items: [{ itemId:number, counted:number }] }
 * Para cada insumo: ajusta el stock real al valor contado,
 * y crea movimientos (ajuste) por la diferencia.
 */
export async function POST(req: Request){
  const b = await req.json()
  if(!Array.isArray(b.items) || b.items.length===0){
    return NextResponse.json({error:'items required'}, {status:400})
  }

  try {
    await prisma.$transaction(async(tx)=>{
      for(const row of b.items){
        const it = await tx.inventoryItem.findUnique({ where:{id:+row.itemId} })
        if(!it) continue
        const counted = Number(row.counted)
        const diff = counted - Number(it.currentStock)
        if(diff === 0) continue

        await tx.inventoryItem.update({
          where:{ id: it.id },
          data:{ currentStock: counted }
        })

        await tx.inventoryMovement.create({
          data:{
            itemId: it.id,
            type: 'adjust',
            quantity: Math.abs(diff),
            note: `Conteo físico → ajuste ${diff>0?'+':'-'}${Math.abs(diff)}`
          }
        })
      }
    })
    return NextResponse.json({ok:true})
  } catch(e:any){
    return NextResponse.json({error:e.message||'Error'}, {status:400})
  }
}
