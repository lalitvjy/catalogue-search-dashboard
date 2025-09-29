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
      inputImageUrl, 
      searchParams, 
      totalResults 
    } = await request.json()

    if (!inputImageUrl) {
      return NextResponse.json({ error: 'Input image URL is required' }, { status: 400 })
    }

    const searchInteraction = await db.searchInteraction.create({
      data: {
        userId,
        brandId,
        inputImageUrl,
        searchParams,
        totalResults,
      }
    })

    return NextResponse.json({ 
      searchInteractionId: searchInteraction.id 
    })
  } catch (error) {
    console.error('Error creating search interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create search interaction' },
      { status: 500 }
    )
  }
}
