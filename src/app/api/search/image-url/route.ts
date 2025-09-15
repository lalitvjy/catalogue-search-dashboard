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
    // Parse JSON body from the request
    const body = await req.json()
    const { image_url, limit = 20, score_threshold = 0.1, diamond_wt_min, diamond_wt_max, ctrstone_wt_min, ctrstone_wt_max } = body
    
    if (!image_url) {
      return new NextResponse('No image URL provided', { status: 400 })
    }

    // Validate image URL format
    try {
      new URL(image_url)
    } catch {
      return new NextResponse('Invalid image URL format', { status: 400 })
    }

    console.log('🔍 URL Search Request:', {
      image_url,
      limit,
      score_threshold,
      brandId: brand.id
    })

    // Download the image from the URL first, then use the file upload endpoint
    console.log('📥 Downloading image from URL...')
    let imageBlob: Blob
    try {
      const imageResponse = await fetch(image_url)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
      }
      imageBlob = await imageResponse.blob()
      console.log('✅ Image downloaded successfully, size:', imageBlob.size)
    } catch (error) {
      console.error('❌ Failed to download image:', error)
      return new NextResponse('Failed to download image from URL. Please check the image URL is accessible.', { status: 400 })
    }

    // Prepare FormData for the mirrAR API (same format as file upload)
    const formData = new FormData()
    formData.append('file', imageBlob, 'search-image.jpg')
    formData.append('brand_id', brand.id)
    formData.append('limit', limit.toString())
    formData.append('score_threshold', score_threshold.toString())
    formData.append('category', '')
    formData.append('tags', '')
    formData.append('diamond_wt_min', diamond_wt_min || '')
    formData.append('diamond_wt_max', diamond_wt_max || '')
    formData.append('ctrstone_wt_min', ctrstone_wt_min || '')
    formData.append('ctrstone_wt_max', ctrstone_wt_max || '')

    // Use the same endpoint as file upload since we now have a file
    const searchApiUrl = process.env.MIRRAR_LENS_API_URL || 'https://mirrar-lens-api-nlontpvsta-uc.a.run.app/api/search/image'
    
    console.log('🔍 Calling mirrAR Lens API with downloaded image...')
    console.log('📡 Request URL:', searchApiUrl)
    
    // Add timeout and retry logic for reliability
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let searchResponse: Response
    try {
      searchResponse = await fetch(searchApiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Search request timed out')
        return new NextResponse('Search request timed out. Please try again.', { status: 408 })
      }
      console.error('Search request failed:', error)
      return new NextResponse('Unable to connect to search service. Please try again later.', { status: 503 })
    }

    if (!searchResponse.ok) {
      console.error('❌ External search API error:', searchResponse.status, searchResponse.statusText)
      const errorText = await searchResponse.text()
      console.error('❌ Error response body:', errorText)
      console.error('❌ Request details:', {
        url: searchApiUrl,
        method: 'POST',
        body: 'FormData with image file'
      })
      
      // Handle specific error cases
      if (searchResponse.status === 500 && errorText.includes('cannot identify image file')) {
        return new NextResponse('Invalid image URL or format. Please provide a valid image URL.', { status: 400 })
      }
      
      if (searchResponse.status >= 500) {
        return new NextResponse('Search service is temporarily unavailable. Please try again later.', { status: 503 })
      }
      
      // Return the actual error message from the API for better debugging
      return new NextResponse(`API Error: ${errorText}`, { status: 400 })
    }

    const searchResults = await searchResponse.json()
    
    // Transform the results to match our expected format
    const matches = searchResults.results || searchResults.matches || []
    
    // If no real matches, return empty results
    if (!matches || matches.length === 0) {
      const tookMs = Date.now() - t0
      return NextResponse.json({
        results: [],
        took_ms: tookMs,
        total_results: 0
      })
    }
    
    const results = matches.map((item: Record<string, unknown>, index: number) => {
      // Debug logging for first item to see what fields are available
      if (index === 0) {
        console.log('API Response item structure:', Object.keys(item))
        console.log('API Response item attributes:', item.attributes)
        console.log('Diamond WT in item:', item.diamond_wt)
        console.log('Center Stone WT in item:', item.ctrstone_wt)
      }
      
      // Use the real data from API response directly
      const imageUrl = item.public_url || item.url || item.image_url || ''
      
      return {
        sku_id: item.sku_id || `SKU-${index + 1}`,
        sku_code: item.sku_code || `SKU-${index + 1}`,
        file_name: item.file_name || 'Unknown',
        image_url: imageUrl,
        confidence: item.confidence || 0,
        description: (item.description as string) || (item.attributes as Record<string, unknown>)?.description || '',
        attributes: {
          category: (item.category as string) || (item.attributes as Record<string, unknown>)?.category || '',
          tags: (item.tags as string) || (item.attributes as Record<string, unknown>)?.tags || '',
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
        queryType: 'image_url', 
        threshold: parseFloat(score_threshold.toString()), 
        topK: parseInt(limit.toString()), 
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
    console.error('URL Search error:', error)
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
