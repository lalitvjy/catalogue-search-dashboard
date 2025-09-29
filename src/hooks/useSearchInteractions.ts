import { useState, useCallback } from 'react'

interface SearchInteraction {
  id: string
  userId: string
  brandId: string
  inputImageUrl: string
}

export const useSearchInteractions = () => {
  const [currentSearchInteraction, setCurrentSearchInteraction] = 
    useState<SearchInteraction | null>(null)
  const [interactions, setInteractions] = useState<Map<string, 'LIKE' | 'DISLIKE'>>(
    new Map()
  )

  // Create search interaction when search is performed
  const createSearchInteraction = useCallback(async (data: {
    inputImageUrl: string
    searchParams?: Record<string, unknown>
    totalResults?: number
  }) => {
    try {
      const response = await fetch('/api/search-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create search interaction')
      }
      
      const result = await response.json()
      setCurrentSearchInteraction({ 
        id: result.searchInteractionId,
        userId: '', // Will be filled by server
        brandId: '', // Will be filled by server
        ...data 
      })
      
      // Clear previous interactions when starting a new search
      setInteractions(new Map())
      
      return result.searchInteractionId
    } catch (error) {
      console.error('Failed to create search interaction:', error)
      throw error
    }
  }, [])

  // Handle like/dislike actions
  const toggleInteraction = useCallback(async (
    skuId: string,
    interactionType: 'LIKE' | 'DISLIKE',
    similarityScore: number,
    resultPosition: number
  ) => {
    if (!currentSearchInteraction) {
      console.error('No active search interaction')
      return
    }

    try {
      const currentInteraction = interactions.get(skuId)
      
      // If clicking the same type, remove the interaction
      if (currentInteraction === interactionType) {
        await fetch(`/api/interaction-items?searchInteractionId=${currentSearchInteraction.id}&skuId=${skuId}`, {
          method: 'DELETE'
        })
        
        setInteractions(prev => {
          const newMap = new Map(prev)
          newMap.delete(skuId)
          return newMap
        })
      } else {
        // Create or update interaction
        const response = await fetch('/api/interaction-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchInteractionId: currentSearchInteraction.id,
            skuId,
            interactionType,
            similarityScore,
            resultPosition
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save interaction')
        }
        
        setInteractions(prev => new Map(prev).set(skuId, interactionType))
      }
    } catch (error) {
      console.error('Failed to toggle interaction:', error)
      // You might want to show a toast or error message to the user here
    }
  }, [currentSearchInteraction, interactions])

  const getInteraction = useCallback((skuId: string) => {
    return interactions.get(skuId)
  }, [interactions])

  // Clear interactions (useful when starting a new search)
  const clearInteractions = useCallback(() => {
    setInteractions(new Map())
    setCurrentSearchInteraction(null)
  }, [])

  return {
    currentSearchInteraction,
    createSearchInteraction,
    toggleInteraction,
    getInteraction,
    interactions,
    clearInteractions
  }
}
