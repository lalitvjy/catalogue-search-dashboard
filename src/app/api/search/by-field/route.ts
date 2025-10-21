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
    const baseApiUrl = process.env.API_SERVER_HOST || 'https://mirrar-lens-api.mirrar.com'
    const fieldSearchUrl = `${baseApiUrl}/api/search/by-field`
    
    console.log('🔍 Base API URL:', baseApiUrl)
    console.log('🔍 Field Search URL:', fieldSearchUrl)

    // Create form data for the external API
    const formData = new FormData()
    formData.append(searchField, searchValue.trim())
    formData.append('brand_id', brand.id)

    console.log('Calling mirrAR Lens API for field search...')
    
    // Add timeout for reliability
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let searchResponse: Response
    try {
      searchResponse = await fetch(fieldSearchUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Field search request timed out. Please try again.')
      }
      throw fetchError
    }

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Field Search API Error:', searchResponse.status, errorText)
      throw new Error(`Field search failed: ${searchResponse.status} ${searchResponse.statusText}`)
    }

    const apiResult = await searchResponse.json()
    console.log('✅ Field Search API Response:', apiResult)

    const tookMs = Date.now() - t0
    
    // Log the search for analytics
    db.searchLog.create({ 
      data: { 
        userId, 
        brandId, 
        queryType, 
        threshold: 0, 
        topK: 1, 
        tookMs, 
        filters: {
          collection: brand.qdrantCollection,
          brand_slug: brand.slug,
          [searchField]: searchValue.trim()
        } 
      } 
    }).catch(() => {})

    // Return the API response directly
    const response = NextResponse.json(apiResult)

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('❌ Field Search Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new NextResponse(`Field search failed: ${errorMessage}`, { status: 500 })
  }
}

