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
    return new NextResponse('User not authorized for this brand', { status: 403 })
  }

  try {
    // Parse JSON body from the request
    const body = await req.json()
    const { sku, category } = body
    const score_threshold = body?.score_threshold ?? 0.1
    const limit = 100
    
    // Determine search field and value
    let searchField: string
    let searchValue: string
    let queryType: string
    
    if (sku) {
      searchField = 'sku'
      searchValue = sku
      queryType = 'sku'
    } else if (category) {
      searchField = 'category'
      searchValue = category
      queryType = 'category'
    } else {
      return new NextResponse('No search field provided (sku or category required)', { status: 400 })
    }

    console.log('🔍 Field Search Request:', {
      field: searchField,
      value: searchValue,
      brandId: brand.id
    })

    // Get API URL from environment - use the same pattern as other endpoints
    const baseApiUrl = process.env.API_SERVER_HOST || 'http://localhost:8081'
    const skuSearchUrl = `${baseApiUrl}/api/search/by-field-sql`
    
    console.log('🔍 Base API URL:', baseApiUrl)
    console.log('🔍 SKU Search URL:', skuSearchUrl)

    // Create form data for the external API
    const formData = new FormData()
    formData.append('sku', searchValue.trim())
    formData.append('brand_id', brand.id)
    formData.append('limit', limit.toString())
    formData.append('score_threshold', score_threshold.toString())

    console.log('Calling mirrAR Lens API for SKU search...')
    
    // Add timeout for reliability
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let searchResponse: Response
    try {
      searchResponse = await fetch(skuSearchUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('SKU search request timed out. Please try again.')
      }
      throw fetchError
    }

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ SKU Search API Error:', searchResponse.status, errorText)
      throw new Error(`SKU search failed: ${searchResponse.status} ${searchResponse.statusText}`)
    }

    const searchResults = await searchResponse.json()
    console.log('✅ SKU Search API Response:', searchResults)
    
    // Transform the results to match our expected format (same as image search)
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
      // Use the real data from API response directly
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
        queryType, 
        threshold: 0, 
        topK: results.length, 
        tookMs, 
        filters: {
          collection: brand.qdrantCollection,
          brand_slug: brand.slug,
          sku: searchValue.trim()
        } 
      } 
    }).catch(() => {})

    // Return the transformed results in the same format as image search
    // Mark as text search since SKU search returns text-based results
    const response = NextResponse.json({ 
      results, 
      took_ms: tookMs,
      total_results: results.length,
      is_text_search: true
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('❌ SKU Search Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new NextResponse(`SKU search failed: ${errorMessage}`, { status: 500 })
  }
}

