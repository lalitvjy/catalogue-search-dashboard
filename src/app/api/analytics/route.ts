import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface ExtendedSession {
  uid: string
  brandId: string
  role: string
}

export async function GET() {
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

    // Get most liked products for this user's brand
    const mostLikedProducts = await db.interactionItem.groupBy({
      by: ['skuId'],
      where: {
        interactionType: 'LIKE',
        searchInteraction: {
          brandId: brandId
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Get the SKU details for most liked products
    const skuIds = mostLikedProducts.map(item => item.skuId)
    const skus = await db.sku.findMany({
      where: {
        id: { in: skuIds }
      },
      select: {
        id: true,
        skuCode: true,
        title: true,
        imageUrl: true
      }
    })

    const mostLikedWithDetails = mostLikedProducts.map(item => ({
      ...item,
      likes: item._count.id,
      sku: skus.find(sku => sku.id === item.skuId)
    }))

    // Get user interaction stats
    const userStats = await db.interactionItem.groupBy({
      by: ['interactionType'],
      where: {
        searchInteraction: {
          userId: userId,
          brandId: brandId
        }
      },
      _count: {
        id: true
      }
    })

    const stats = {
      likes: userStats.find(s => s.interactionType === 'LIKE')?._count.id || 0,
      dislikes: userStats.find(s => s.interactionType === 'DISLIKE')?._count.id || 0,
    }

    // Get recent search sessions count
    const recentSearches = await db.searchInteraction.count({
      where: {
        userId: userId,
        brandId: brandId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    return NextResponse.json({
      mostLikedProducts: mostLikedWithDetails,
      userStats: stats,
      recentSearches
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
