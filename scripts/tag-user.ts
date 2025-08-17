import 'dotenv/config'
import { db } from '../src/lib/db'
async function main() {
  const [,, email, slug] = process.argv
  if (!email || !slug) throw new Error('Usage: tsx scripts/tag-user.ts <email> <brandSlug>')
  const brand = await db.brand.findUnique({ where: { slug } })
  if (!brand) throw new Error('Brand not found')
  const user = await db.user.update({ where: { email }, data: { brandId: brand.id } })
  console.log('USER_TAGGED', user.id, '->', brand.slug)
}
main().catch(e=>{ console.error(e); process.exit(1) })
