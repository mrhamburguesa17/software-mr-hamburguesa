import { NextResponse } from 'next/server'; import { prisma } from '@/lib/db'
export async function POST(req:Request){ const b:any=await req.json(); if(!b?.date||!Array.isArray(b.items)||b.items.length===0) return NextResponse.json({error:'date & items required'},{status:400})
  try{ const res = await prisma.$transaction(async(tx)=>{ const purchase=await tx.purchase.create({ data:{ date:new Date(b.date), supplierId:b.supplierId??null, subtotal:b.items.reduce((a:any,x:any)=>a+Number(x.quantity)*Number(x.unitCost),0), notes:b.notes??null } })
    for(const it of b.items){ const inv = await tx.inventoryItem.findUnique({ where:{ id:Number(it.itemId) } }); if(!inv) throw new Error('item not found')
      await tx.purchaseItem.create({ data:{ purchaseId:purchase.id, itemId:inv.id, quantity:Number(it.quantity), unitCost:Number(it.unitCost) } })
      await tx.inventoryItem.update({ where:{id:inv.id}, data:{ currentStock: inv.currentStock + Number(it.quantity), costPerUnit: Number(it.unitCost) } })
      await tx.inventoryMovement.create({ data:{ itemId:inv.id, type:'IN', quantity:Number(it.quantity), note:'Compra' } })
    } return purchase })
    return NextResponse.json(res,{status:201})
  } catch(e:any){ return NextResponse.json({error:String(e)},{status:400}) } }