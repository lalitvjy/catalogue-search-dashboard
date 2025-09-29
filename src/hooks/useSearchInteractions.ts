import { useState, useCallback, useRef, useEffect } from 'react'

interface SearchInteraction {
  id: string
  userId: string
  brandId: string
  inputImageUrl: string
}

export const useSearchInteractions = () => {
  const [currentSearchInteraction, setCurrentSearchInteraction] = 
    useState<SearchInteraction | null>(null)
  const [interactions, setInteractions] = useState<Map<string, 'LIKE' | 'DISLIKE'>>(new Map())
  const interactionsRef = useRef(interactions)

  useEffect(() => {
    interactionsRef.current = interactions
  }, [interactions])

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
      console.log("WHEN ARE WE HERE?????");
      
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
    skuCode: string | undefined,
    fileName: string | undefined,
    imageUrl: string | undefined,
    interactionType: 'LIKE' | 'DISLIKE',
    similarityScore: number,
    resultPosition: number,
    searchInteractionIdOverride?: string
  ) => {
    const effectiveSearchInteractionId = searchInteractionIdOverride || currentSearchInteraction?.id
    if (!effectiveSearchInteractionId) {
      console.error('No active search interaction')
      return
    }

    // Determine desired next state based on current state (from ref to avoid staleness)
    const prevInteraction = interactionsRef.current.get(skuId)
    const isRemoving = prevInteraction === interactionType
    const optimisticNext: 'LIKE' | 'DISLIKE' | undefined = isRemoving ? undefined : interactionType

    // Optimistically apply UI state
    const previousMapSnapshot = interactionsRef.current
    setInteractions(prev => {
      const next = new Map(prev)
      if (optimisticNext) next.set(skuId, optimisticNext)
      else next.delete(skuId)
      return next
    })

    try {
      if (isRemoving) {
        const query = new URLSearchParams({ searchInteractionId: effectiveSearchInteractionId })
        if (skuId) query.set('skuId', skuId)
        if (skuCode) query.set('skuCode', skuCode)
        await fetch(`/api/interaction-items?${query.toString()}`, { method: 'DELETE' })
      } else {
        const response = await fetch('/api/interaction-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchInteractionId: effectiveSearchInteractionId,
            skuId,
            skuCode,
            fileName,
            imageUrl,
            interactionType,
            similarityScore,
            resultPosition
          })
        })
        if (!response.ok) {
          let message = 'Failed to save interaction'
          try {
            const err = await response.json()
            if (err?.error) message = message + `: ${err.error}`
          } catch {}
          throw new Error(message)
        }
      }
    } catch (error) {
      // Roll back optimistic update on failure
      setInteractions(previousMapSnapshot)
      console.error('Failed to toggle interaction:', error)
      // You might want to show a toast or error message to the user here
    }
  }, [currentSearchInteraction])

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
