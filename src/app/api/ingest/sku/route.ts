import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { skuUpsertSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const brandId = (session as any).brandId as string
  const body = await req.json()
  const { skuCode, title, fileName, imageUrl, attrs } = skuUpsertSchema.parse(body)

  const existing = await db.sku.findFirst({ where: { brandId, skuCode } })
  const sku = existing
    ? await db.sku.update({ where: { id: existing.id }, data: { title, fileName, imageUrl } })
    : await db.sku.create({ data: { brandId, skuCode, title, fileName, imageUrl } })

  if (attrs) {
    await db.skuAttr.upsert({
      where: { skuId: sku.id },
      update: { attrs },
      create: { skuId: sku.id, attrs },
    })
  }
  return NextResponse.json({ skuId: sku.id })
}
