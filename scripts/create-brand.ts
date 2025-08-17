import 'dotenv/config'
import { db } from '../src/lib/db'
import { ensureCollection } from '../src/lib/qdrant'

async function main() {
  const [,, name, slug, vecSizeStr] = process.argv
  if (!name || !slug) throw new Error('Usage: tsx scripts/create-brand.ts <name> <slug> [vectorSize=1024]')
  const vectorSize = Number(vecSizeStr || 1024)
  const collection = `brand_${slug}`
  await ensureCollection(collection, vectorSize)
  const brand = await db.brand.create({ data: { name, slug, qdrantCollection: collection } })
  console.log('BRAND_CREATED', brand)
}
main().catch(e=>{ console.error(e); process.exit(1) })
