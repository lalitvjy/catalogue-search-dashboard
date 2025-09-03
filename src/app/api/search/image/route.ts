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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse(`Invalid file type. Only JPG and PNG images are supported. Received: ${file.type}`, { status: 400 })
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

    // Create form data for the Mirrar Lens API
    const externalFormData = new FormData()
    externalFormData.append('file', imageBlob, file.name || 'search-image.jpg')
    externalFormData.append('brand_id', brand.id)
    externalFormData.append('limit', limit)
    externalFormData.append('score_threshold', scoreThreshold)

    console.log('Calling Mirrar Lens API')
    console.log('Searching for brand ID:', brand.id, 'brand name:', brand.name)
    console.log('🔍 FormData being sent:')
    console.log('  - file:', file.name, '(' + file.size + ' bytes)')
    console.log('  - brand_id:', brand.id)
    console.log('  - limit:', limit)
    console.log('  - score_threshold:', scoreThreshold)

    // Call the Mirrar Lens API
    const searchApiUrl = process.env.MIRRAR_LENS_API_URL || 'https://mirrar-lens-api-nlontpvsta-uc.a.run.app/api/search/image'
    
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

    console.log('External API response status:', searchResponse.status)

    if (!searchResponse.ok) {
      console.error('External search API error:', searchResponse.status, searchResponse.statusText)
      const errorText = await searchResponse.text()
      console.error('Error response body:', errorText)
      
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
