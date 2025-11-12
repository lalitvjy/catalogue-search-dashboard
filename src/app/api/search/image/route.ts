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
    const limit = (formData.get('limit') as string) || '100'
    const scoreThreshold = (formData.get('score_threshold') as string) || '0.1'
    const requestedBrandId = formData.get('brand_id') as string
    const diamondWtMin = formData.get('diamond_wt_min') as string
    const diamondWtMax = formData.get('diamond_wt_max') as string
    const ctrstoneWtMin = formData.get('ctrstone_wt_min') as string
    const ctrstoneWtMax = formData.get('ctrstone_wt_max') as string
    
    // Log what brand IDs we're working with
    console.log('🔍 BRAND ID ANALYSIS:')
    console.log('   - Session Brand ID:', brandId)
    console.log('   - Requested Brand ID:', requestedBrandId)
    console.log('   - Using Brand ID:', brandId, '(from session)')
    
    if (requestedBrandId && requestedBrandId !== brandId) {
      console.log('⚠️  WARNING: Request brand_id differs from session brand_id!')
      console.log('   - This means user is trying to search a different brand than assigned')
    }
    
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse(`Invalid file type. Only JPG, PNG, and WebP images are supported. Received: ${file.type}`, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return new NextResponse('File too large. Maximum size is 10MB', { status: 400 })
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

    // Create form data for the mirrAR Lens API - match exact working format
    const externalFormData = new FormData()
    externalFormData.append('file', imageBlob, file.name || 'search-image.jpg')
    externalFormData.append('brand_id', brand.id)
    externalFormData.append('limit', limit)
    externalFormData.append('score_threshold', scoreThreshold)
    externalFormData.append('category', '') // Add empty category parameter
    externalFormData.append('tags', '')     // Add empty tags parameter
    externalFormData.append('diamond_wt_min', diamondWtMin || '') // Add diamond weight min parameter
    externalFormData.append('diamond_wt_max', diamondWtMax || '') // Add diamond weight max parameter
    externalFormData.append('ctrstone_wt_min', ctrstoneWtMin || '') // Add center stone weight min parameter
    externalFormData.append('ctrstone_wt_max', ctrstoneWtMax || '') // Add center stone weight max parameter

    // Get API URL first
    const searchApiUrl = process.env.MIRRAR_LENS_API_URL || 'https://mirrar-lens-api-nlontpvsta-uc.a.run.app/api/search/image'

    
    console.log('Calling mirrAR Lens API...')
    
    // Add timeout and retry logic for reliability
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let searchResponse: Response
    try {
      searchResponse = await fetch(searchApiUrl, {
        method: 'POST',
        body: externalFormData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Search request timed out')
        return new NextResponse('Search request timed out. Please try again with a smaller image.', { status: 408 })
      }
      console.error('Search request failed:', error)
      return new NextResponse('Unable to connect to search service. Please try again later.', { status: 503 })
    }


    if (!searchResponse.ok) {
      console.error('❌ External search API error:', searchResponse.status, searchResponse.statusText)
      const errorText = await searchResponse.text()
      console.error('❌ Error response body:', errorText)
      
      // Handle specific error cases
      if (searchResponse.status === 500 && errorText.includes('cannot identify image file')) {
        return new NextResponse('Invalid image format. Please upload a clear JPG or PNG image of jewelry.', { status: 400 })
      }
      
      if (searchResponse.status >= 500) {
        return new NextResponse('Search service is temporarily unavailable. Please try again later.', { status: 503 })
      }
      
      return new NextResponse('Unable to process image search. Please try with a different image.', { status: 400 })
    }

    const searchResults = await searchResponse.json()
    
    // Transform the results to match our expected format
    // The API returns { results: [...] } directly
    const matches = searchResults.results || searchResults.matches || []
    
    // If no real matches, return empty results instead of dummy data
    if (!matches || matches.length === 0) {
      const tookMs = Date.now() - t0
      return NextResponse.json({
        results: [],
        took_ms: tookMs,
        total_results: 0
      })
    }
    
    const results = matches.map((item: Record<string, unknown>, index: number) => {
      // Check if this is real data from the API
      const hasRealSkuId = item.sku_id && typeof item.sku_id === 'string' && item.sku_id !== ''
      const hasRealConfidence = typeof item.confidence === 'number' && item.confidence > 0
      
      // Debug logging for first item to see what fields are available
      if (index === 0) {
        console.log('API Response item structure:', Object.keys(item))
        console.log('API Response item attributes:', item.attributes)
        console.log('Diamond WT in item:', item.diamond_wt)
        console.log('Center Stone WT in item:', item.ctrstone_wt)
        console.log('Diamond WT in attributes:', (item.attributes as Record<string, unknown>)?.diamond_wt)
        console.log('Center Stone WT in attributes:', (item.attributes as Record<string, unknown>)?.ctrstone_wt)
        console.log('Price in item:', item.price)
        console.log('Price in attributes:', (item.attributes as Record<string, unknown>)?.price)
      }
      
      // Use the real data from API response directly
      // Check for image URL in different possible fields - prioritize public_url first, then url, then image_url
      const imageUrl = item.public_url || item.url || item.image_url || ''
      
      return {
        sku_id: item.sku_id || `SKU-${index + 1}`,
        sku_code: item.sku_code || `SKU-${index + 1}`,
        file_name: item.file_name || 'Unknown',
        image_url: imageUrl,
        confidence: item.confidence || 0,
        description: (item.description as string) || (item.attributes as Record<string, unknown>)?.description || '',
        price: (item.price as string) || (item.attributes as Record<string, unknown>)?.price as string || null,
        attributes: {
          // Include both top-level and nested attributes
          category: (item.category as string) || (item.attributes as Record<string, unknown>)?.category || '',
          tags: (item.tags as string) || (item.attributes as Record<string, unknown>)?.tags || '',
          // Include all attributes from the nested attributes object
          ...(item.attributes as Record<string, unknown>) || {}
        }
      }
    })

    const tookMs = Date.now() - t0
    
    
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

    const response = NextResponse.json({ 
      results, 
      took_ms: tookMs,
      total_results: results.length
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response

  } catch (error) {
    console.error('Search error:', error)
    const errorResponse = new NextResponse('Search failed', { status: 500 })
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return errorResponse
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
