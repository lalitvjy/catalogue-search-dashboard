import 'dotenv/config'
import { db } from '../src/lib/db'
import { qdrant } from '../src/lib/qdrant'
import { computeImageEmbedding } from '../src/lib/embeddings'

async function main() {
  const [,, slug] = process.argv
  if (!slug) throw new Error('Usage: tsx scripts/backfill-embeds.ts <brandSlug>')
  const brand = await db.brand.findUnique({ where: { slug } })
  if (!brand) throw new Error('Brand not found')
  const skus = await db.sku.findMany({ where: { brandId: brand.id } })
  for (const s of skus) {
    const vec = await computeImageEmbedding(s.imageUrl)
    await qdrant.upsert({
      collection_name: brand.qdrantCollection,
      points: [{ id: s.id, vector: vec, payload: { skuId: s.id, skuCode: s.skuCode, imageUrl: s.imageUrl, fileName: s.fileName } }],
      wait: true,
    })
    console.log('UPSERTED', s.skuCode)
  }
}
main().catch(e=>{ console.error(e); process.exit(1) })
