import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ExtendedSession {
  uid: string
  brandId: string
  role: string
}

export async function POST(req: Request) {
  const t0 = Date.now()
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  
  const extendedSession = session as unknown as ExtendedSession
  const userId = extendedSession.uid
  const brandId = extendedSession.brandId

  if (!brandId) {
    return new NextResponse('User not assigned to any brand', { status: 403 })
  }

  const brand = await db.brand.findUnique({ where: { id: brandId } })
  if (!brand) return new NextResponse('Brand Not Found', { status: 404 })

  // Verify user belongs to this brand
  const user = await db.user.findUnique({ 
    where: { id: userId },
    select: { brandId: true }
  })
  
  if (!user || user.brandId !== brandId) {
    return new NextResponse('Access denied: User not assigned to this brand', { status: 403 })
  }

  try {
    // Parse FormData from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    const limit = formData.get('limit') as string || '20'
    const scoreThreshold = formData.get('score_threshold') as string || '0.1'
    
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    console.log('Received file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      limit,
      scoreThreshold
    })

    // Convert the file to a blob for the external API
    const imageBuffer = await file.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: file.type })
    console.log('Image blob size:', imageBlob.size)

    // Create form data for the external API with exact curl parameters
    const externalFormData = new FormData()
    externalFormData.append('file', imageBlob, file.name || 'search-image.jpg')
    externalFormData.append('limit', limit)
    externalFormData.append('score_threshold', scoreThreshold)
    
    // Add brand collection information to ensure proper scoping
    externalFormData.append('collection', brand.qdrantCollection)
    externalFormData.append('brand_id', brand.id)
    externalFormData.append('brand_slug', brand.slug)

    console.log('Calling external API with exact curl parameters')
    console.log('Searching in collection:', brand.qdrantCollection, 'for brand:', brand.name)

    // Call the external image search API with exact headers from curl
    const searchApiUrl = process.env.SEARCH_API_URL || 'https://image-search-api-760959437216.us-central1.run.app/search/by-image'
    
    const searchResponse = await fetch(searchApiUrl, {
      method: 'POST',
      headers: {
        'sec-ch-ua-platform': '"macOS"',
        'Referer': 'https://search.mirrar.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'DNT': '1',
        'sec-ch-ua-mobile': '?0',
        // Don't set Content-Type - let the browser set it with boundary
      },
      body: externalFormData
    })

    console.log('External API response status:', searchResponse.status)

    if (!searchResponse.ok) {
      console.error('External search API error:', searchResponse.status, searchResponse.statusText)
      const errorText = await searchResponse.text()
      console.error('Error response body:', errorText)
      return new NextResponse('External search service error', { status: 503 })
    }

    const searchResults = await searchResponse.json()
    console.log('External API response:', searchResults)
    
    // Transform the results to match our expected format
    // The API returns { matches: [...] } not { results: [...] }
    const matches = searchResults.matches || []
    const results = matches.map((item: Record<string, unknown>, index: number) => {
      // Extract SKU code from image URL (e.g., "ULG312FBCAA04" from the URL)
      const urlParts = (item.image_url as string)?.split('/') || []
      const skuFromUrl = urlParts.find((part: string) => /^[A-Z0-9]{10,}$/.test(part)) || `SKU-${index + 1}`
      
      // Extract file name from image URL (last part)
      const fileName = urlParts[urlParts.length - 1] || 'Unknown'
      
      return {
        sku_id: skuFromUrl,
        sku_code: skuFromUrl,
        file_name: fileName,
        image_url: item.image_url || '',
        confidence: item.score || 0,
        attributes: {
          category: (item.category as string) || '',
          tags: (item.tags as string) || '',
          ...(item.attributes as Record<string, unknown>) || {}
        }
      }
    })

    const tookMs = Date.now() - t0
    console.log('Search completed in', tookMs, 'ms with', results.length, 'results')
    
    // Log the search for analytics
    db.searchLog.create({ 
      data: { 
        userId, 
        brandId, 
        queryType: 'image', 
        threshold: parseFloat(scoreThreshold), 
        topK: parseInt(limit), 
        tookMs, 
        filters: {
          collection: brand.qdrantCollection,
          brand_slug: brand.slug
        } 
      } 
    }).catch(() => {})

    return NextResponse.json({ 
      results, 
      took_ms: tookMs,
      total_results: results.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return new NextResponse('Search failed', { status: 500 })
  }
}
