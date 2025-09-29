import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ExtendedSession {
  uid: string
  brandId: string
  role: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const extendedSession = session as unknown as ExtendedSession
    const userId = extendedSession.uid
    const brandId = extendedSession.brandId

    if (!brandId) {
      return NextResponse.json({ error: 'User not assigned to any brand' }, { status: 403 })
    }

    const { 
      searchInteractionId,
      skuId,
      skuCode,
      fileName,
      imageUrl,
      interactionType,
      similarityScore,
      resultPosition 
    } = await request.json()

    if (!searchInteractionId || !interactionType) {
      return NextResponse.json({ 
        error: 'Missing required fields: searchInteractionId, interactionType' 
      }, { status: 400 })
    }

    // Verify the search interaction belongs to the current user
    const searchInteraction = await db.searchInteraction.findFirst({
      where: {
        id: searchInteractionId,
        userId: userId,
        brandId: brandId
      }
    })

    if (!searchInteraction) {
      return NextResponse.json({ 
        error: 'Search interaction not found or access denied' 
      }, { status: 404 })
    }

    // Resolve SKU either by provided id or by code within brand context
    let resolvedSkuId: string | null = null
    const normalizedSkuCode = skuCode?.trim().toUpperCase()
    const normalizedFileName = fileName?.trim()
    const normalizedImageUrl = imageUrl?.trim()
    let imageBaseName: string | undefined
    try {
      if (normalizedImageUrl) {
        const u = new URL(normalizedImageUrl)
        imageBaseName = u.pathname.split('/').filter(Boolean).pop() || undefined
      }
    } catch {}
    if (skuId) {
      const skuById = await db.sku.findFirst({ where: { id: skuId, brandId } })
      if (skuById) {
        resolvedSkuId = skuById.id
      }
    }
    if (!resolvedSkuId && normalizedSkuCode) {
      const skuByCode = await db.sku.findFirst({ where: { skuCode: { equals: normalizedSkuCode, mode: 'insensitive' }, brandId } })
      if (skuByCode) {
        resolvedSkuId = skuByCode.id
      }
    }
    if (!resolvedSkuId && normalizedFileName) {
      // Exact match on filename
      const skuByFile = await db.sku.findFirst({ where: { fileName: { equals: normalizedFileName, mode: 'insensitive' }, brandId } })
      if (skuByFile) {
        resolvedSkuId = skuByFile.id
      }
    }
    if (!resolvedSkuId && normalizedFileName) {
      // EndsWith match on filename (handles prefixed paths)
      const skuByFileEnds = await db.sku.findFirst({ where: { fileName: { endsWith: normalizedFileName, mode: 'insensitive' }, brandId } })
      if (skuByFileEnds) {
        resolvedSkuId = skuByFileEnds.id
      }
    }
    if (!resolvedSkuId && imageUrl) {
      const skuByImage = await db.sku.findFirst({ where: { imageUrl: { equals: normalizedImageUrl!, mode: 'insensitive' }, brandId } })
      if (skuByImage) {
        resolvedSkuId = skuByImage.id
      }
    }
    if (!resolvedSkuId && imageBaseName) {
      // Try matching image base name against either fileName or imageUrl
      const skuByImageEnds = await db.sku.findFirst({
        where: {
          brandId,
          OR: [
            { imageUrl: { endsWith: imageBaseName, mode: 'insensitive' } },
            { fileName: { endsWith: imageBaseName, mode: 'insensitive' } }
          ]
        }
      })
      if (skuByImageEnds) {
        resolvedSkuId = skuByImageEnds.id
      }
    }
    if (!resolvedSkuId) {
      // Temporary fallback: create a placeholder SKU so interactions can be recorded
      const nowIso = new Date().toISOString().replace(/[:.]/g, '-')
      const placeholderSkuCode = (normalizedSkuCode || imageBaseName || normalizedFileName || 'TEMP-SKU') + `-${nowIso}`
      const placeholderFileName = normalizedFileName || imageBaseName || `${placeholderSkuCode}.jpg`
      const placeholderImageUrl = normalizedImageUrl || `https://placeholder.local/${placeholderFileName}`

      const placeholderSku = await db.sku.create({
        data: {
          brandId,
          skuCode: placeholderSkuCode,
          fileName: placeholderFileName,
          imageUrl: placeholderImageUrl,
          title: 'Temporary SKU for interaction',
        }
      })
      resolvedSkuId = placeholderSku.id
    }

    // Upsert to handle changing from like to dislike
    const interactionItem = await db.interactionItem.upsert({
      where: {
        searchInteractionId_skuId: {
          searchInteractionId,
          skuId: resolvedSkuId
        }
      },
      update: {
        interactionType,
        similarityScore,
        resultPosition
      },
      create: {
        searchInteractionId,
        skuId: resolvedSkuId,
        interactionType,
        similarityScore,
        resultPosition
      }
    })

    return NextResponse.json({ success: true, interactionItem })
  } catch (error) {
    console.error('Error creating interaction item:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const extendedSession = session as unknown as ExtendedSession
    const userId = extendedSession.uid
    const brandId = extendedSession.brandId

    if (!brandId) {
      return NextResponse.json({ error: 'User not assigned to any brand' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const searchInteractionId = searchParams.get('searchInteractionId')
    const skuId = searchParams.get('skuId')
    const skuCode = searchParams.get('skuCode')

    if (!searchInteractionId || (!skuId && !skuCode)) {
      return NextResponse.json({ 
        error: 'Missing required parameters: searchInteractionId, and either skuId or skuCode' 
      }, { status: 400 })
    }

    // Verify the search interaction belongs to the current user
    const searchInteraction = await db.searchInteraction.findFirst({
      where: {
        id: searchInteractionId,
        userId: userId,
        brandId: brandId
      }
    })

    if (!searchInteraction) {
      return NextResponse.json({ 
        error: 'Search interaction not found or access denied' 
      }, { status: 404 })
    }

    // Resolve SKU id if only code provided
    let resolvedSkuId: string | null = skuId
    if (!resolvedSkuId && skuCode) {
      const skuByCode = await db.sku.findFirst({ where: { skuCode, brandId } })
      resolvedSkuId = skuByCode?.id ?? null
    }
    if (!resolvedSkuId) {
      return NextResponse.json({ error: 'SKU not found for this brand' }, { status: 404 })
    }

    await db.interactionItem.delete({
      where: {
        searchInteractionId_skuId: {
          searchInteractionId: searchInteractionId,
          skuId: resolvedSkuId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting interaction item:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}
