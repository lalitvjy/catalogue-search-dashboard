import { db } from '../src/lib/db'

async function assignBrandToUser(userEmail: string, brandSlug: string) {
  try {
    // Find the brand
    const brand = await db.brand.findUnique({
      where: { slug: brandSlug }
    })

    if (!brand) {
      throw new Error(`Brand with slug '${brandSlug}' not found`)
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      throw new Error(`User with email '${userEmail}' not found`)
    }

    // Assign brand to user
    const updatedUser = await db.user.update({
      where: { email: userEmail },
      data: { 
        brandId: brand.id,
        role: 'USER' // Default role
      }
    })

    console.log(`✅ Successfully assigned brand '${brand.name}' to user '${userEmail}'`)
    console.log(`User details:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      brandId: updatedUser.brandId,
      role: updatedUser.role
    })

  } catch (error) {
    console.error('❌ Error assigning brand to user:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

// Get command line arguments
const userEmail = process.argv[2]
const brandSlug = process.argv[3]

if (!userEmail || !brandSlug) {
  console.log('Usage: npx tsx scripts/assign-brand.ts <user-email> <brand-slug>')
  console.log('Example: npx tsx scripts/assign-brand.ts user@example.com tanishq')
  process.exit(1)
}

assignBrandToUser(userEmail, brandSlug)
