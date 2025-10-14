'use client'
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid'
import posthog from 'posthog-js'

interface ActionButtonsProps {
  className?: string
  currentInteraction?: 'LIKE' | 'DISLIKE' | null
  onLike?: () => void
  onDislike?: () => void
  productData?: {
    sku_id?: string
    sku_code?: string
    confidence?: number
    file_name?: string
  }
}

type LikeState = 'none' | 'liked' | 'disliked'

export default function ActionButtons({ 
  className = '', 
  currentInteraction,
  onLike, 
  onDislike,
  productData
}: ActionButtonsProps) {
  // Convert external interaction state to internal state
  const likeState: LikeState = 
    currentInteraction === 'LIKE' ? 'liked' : 
    currentInteraction === 'DISLIKE' ? 'disliked' : 'none'
  

  const handleLike = () => {
    posthog.capture('liked', {
      ...productData
    })
    onLike?.()
  }

  const handleDislike = () => {
    posthog.capture('disliked', {
      ...productData
    })
    onDislike?.()
  }

  return (
    <div className={`flex items-center space-x-0.5 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`p-1.5 rounded-md transition-colors ${
          likeState === 'liked'
            ? 'text-green-600 hover:text-green-700 bg-green-50'
            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
        }`}
        title={likeState === 'liked' ? 'Unlike' : 'Like this product'}
      >
        {likeState === 'liked' ? (
          <HandThumbUpSolid className="w-4 h-4" />
        ) : (
          <HandThumbUpIcon className="w-4 h-4" />
        )}
      </button>

      {/* Dislike Button */}
      <button
        onClick={handleDislike}
        className={`p-1.5 rounded-md transition-colors ${
          likeState === 'disliked'
            ? 'text-red-600 hover:text-red-700 bg-red-50'
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        }`}
        title={likeState === 'disliked' ? 'Remove dislike' : 'Dislike this product'}
      >
        {likeState === 'disliked' ? (
          <HandThumbDownSolid className="w-4 h-4" />
        ) : (
          <HandThumbDownIcon className="w-4 h-4" />
        )}
      </button>

    </div>
  )
}
