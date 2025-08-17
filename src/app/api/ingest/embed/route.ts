import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const brandId = (session as any).brandId as string
  const { skuId } = await req.json()

  const sku = await db.sku.findFirst({ where: { id: skuId, brandId }, include: { brand: true } })
  if (!sku) return new NextResponse('Not Found', { status: 404 })

  // Note: Embeddings are handled by external service
  // This endpoint is kept for compatibility but doesn't perform embedding
  // The external service should handle embedding and vector storage
  
  return NextResponse.json({ 
    ok: true, 
    message: 'SKU ready for external embedding service',
    skuId: sku.id,
    qdrantCollection: sku.brand.qdrantCollection
  })
}
