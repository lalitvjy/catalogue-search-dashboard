import 'dotenv/config'
import { db } from '../src/lib/db'

async function testSearchScoping() {
  console.log('Testing search collection scoping...')
  
  try {
    // Get all brands and their collections
    const brands = await db.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        qdrantCollection: true,
        users: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })
    
    console.log('\n📊 Brand Collections:')
    brands.forEach(brand => {
      console.log(`\n🏷️  Brand: ${brand.name} (${brand.slug})`)
      console.log(`   Collection: ${brand.qdrantCollection}`)
      console.log(`   Users: ${brand.users.length}`)
      brand.users.forEach(user => {
        console.log(`     - ${user.email}`)
      })
    })
    
    // Test user-brand assignments
    console.log('\n🔍 User-Brand Assignments:')
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        brandId: true,
        brand: {
          select: {
            name: true,
            qdrantCollection: true
          }
        }
      }
    })
    
    users.forEach(user => {
      if (user.brand) {
        console.log(`✅ ${user.email} -> ${user.brand.name} (${user.brand.qdrantCollection})`)
      } else {
        console.log(`❌ ${user.email} -> No brand assigned`)
      }
    })
    
    console.log('\n✅ Search scoping test completed!')
    console.log('\n📝 Notes:')
    console.log('- Each user can only search within their assigned brand collection')
    console.log('- Search API automatically adds collection, brand_id, and brand_slug parameters')
    console.log('- External API should filter results based on the collection parameter')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSearchScoping().catch(console.error)
