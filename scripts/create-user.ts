import 'dotenv/config'
import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const [,, email, password, slug] = process.argv
  if (!email || !password || !slug) {
    throw new Error('Usage: tsx scripts/create-user.ts <email> <password> <brandSlug>')
  }
  
  const brand = await db.brand.findUnique({ where: { slug } })
  if (!brand) throw new Error('Brand not found')
  
  const passwordHash = await bcrypt.hash(password, 12)
  
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      brandId: brand.id,
      role: 'user'
    }
  })
  
  console.log('USER_CREATED', user.id, '->', brand.slug)
}
main().catch(e=>{ console.error(e); process.exit(1) })
