import { QdrantClient } from '@qdrant/js-client-rest'

// Create Qdrant client only if environment variables are set
const createQdrantClient = () => {
  if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
    console.warn('Qdrant environment variables not set. Vector search will be disabled.')
    return null
  }
  
  return new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  })
}

export const qdrant = createQdrantClient()

export async function ensureCollection(name: string, size: number) {
  if (!qdrant) {
    console.warn('Qdrant client not available. Skipping collection creation.')
    return
  }
  
  try {
    const exists = await qdrant.getCollection(name).then(()=>true).catch(()=>false)
    if (!exists) {
      await qdrant.createCollection(name, { 
        vectors: { size, distance: 'Cosine' } 
      })
      console.log(`Created Qdrant collection: ${name}`)
    } else {
      console.log(`Qdrant collection already exists: ${name}`)
    }
  } catch (error) {
    console.error('Error creating Qdrant collection:', error)
    throw error
  }
}
