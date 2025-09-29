import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ExtendedSession {
  uid: string
  brandId: string
  role: string
}

export async function GET(request: NextRequest) {
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

    if (searchInteractionId) {
      // Get specific search interaction with its items
      const interaction = await db.searchInteraction.findFirst({
        where: {
          id: searchInteractionId,
          userId: userId,
          brandId: brandId
        },
        include: {
          interactions: {
            include: {
              sku: true
            }
          }
        }
      })

      return NextResponse.json({ interaction })
    } else {
      // Get all search interactions for the user
      const interactions = await db.searchInteraction.findMany({
        where: {
          userId: userId,
          brandId: brandId
        },
        include: {
          interactions: {
            include: {
              sku: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limit to recent 10 searches
      })

      return NextResponse.json({ interactions })
    }
  } catch (error) {
    console.error('Error fetching search interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search interactions' },
      { status: 500 }
    )
  }
}
