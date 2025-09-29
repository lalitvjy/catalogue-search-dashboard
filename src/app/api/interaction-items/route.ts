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
      interactionType,
      similarityScore,
      resultPosition 
    } = await request.json()

    if (!searchInteractionId || !skuId || !interactionType) {
      return NextResponse.json({ 
        error: 'Missing required fields: searchInteractionId, skuId, interactionType' 
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

    // Upsert to handle changing from like to dislike
    const interactionItem = await db.interactionItem.upsert({
      where: {
        searchInteractionId_skuId: {
          searchInteractionId,
          skuId
        }
      },
      update: {
        interactionType,
        similarityScore,
        resultPosition
      },
      create: {
        searchInteractionId,
        skuId,
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

    if (!searchInteractionId || !skuId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: searchInteractionId, skuId' 
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

    await db.interactionItem.delete({
      where: {
        searchInteractionId_skuId: {
          searchInteractionId: searchInteractionId,
          skuId: skuId
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
