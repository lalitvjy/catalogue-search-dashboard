import { db } from '../src/lib/db'

async function listUsersWithoutBrands() {
  try {
    const usersWithoutBrands = await db.user.findMany({
      where: {
        brandId: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📋 Users without brand assignment (${usersWithoutBrands.length} total):\n`)

    if (usersWithoutBrands.length === 0) {
      console.log('✅ All users have been assigned to brands!')
    } else {
      usersWithoutBrands.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   Name: ${user.name || 'Not provided'}`)
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
        console.log(`   ID: ${user.id}`)
        console.log('')
      })

      console.log(`💡 To assign a brand to a user, run:`)
      console.log(`   npx tsx scripts/assign-brand.ts <email> <brand-slug>`)
      console.log('')
      console.log(`📞 Users should contact:`)
      console.log(`   📧 am@mirrar.com`)
      console.log(`   📱 +91-9899035527`)
    }

  } catch (error) {
    console.error('❌ Error fetching users:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

listUsersWithoutBrands()
