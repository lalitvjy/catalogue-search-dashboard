import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const brandId = (session as any).brandId as string
  const skus = await db.sku.findMany({ where: { brandId }, include: { attr: true } })
  const counts: Record<string, Record<string, number>> = { type: {}, category: {}, occasion: {} }
  for (const s of skus) {
    const a: any = s.attr?.attrs || {}
    for (const k of ['type','category','occasion']) if (a[k]) counts[k][a[k]] = (counts[k][a[k]] || 0) + 1
  }
  return NextResponse.json({ facets: counts })
}
