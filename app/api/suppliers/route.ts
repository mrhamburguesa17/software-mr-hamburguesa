import { NextResponse } from 'next/server'; import { prisma } from '@/lib/db'
export async function GET(){ return NextResponse.json(await prisma.supplier.findMany({ orderBy:{id:'desc'}})) }
export async function POST(req:Request){ const b=await req.json(); if(!b.name) return NextResponse.json({error:'name required'},{status:400})
  const row=await prisma.supplier.create({data:{name:b.name, contact:b.contact??null, phone:b.phone??null, notes:b.notes??null}}); return NextResponse.json(row,{status:201}) }