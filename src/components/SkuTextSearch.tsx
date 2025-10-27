'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import posthog from 'posthog-js'
import { useImpressionTracking } from '@/hooks/useImpressionTracking'

interface ExtendedSession {
  brandId?: string
}

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  description?: string | null
  attributes: Record<string, unknown>
  price?: string | null
}

interface SkuTextSearchProps {
  onSearchResults?: (results: SearchResult[], isTextSearch?: boolean) => void
  onSearching?: (searching: boolean) => void
  onImageUpload?: (imageUrl: string) => void
  onSkuSearch?: (sku: string) => void
  onSearchModeChange?: (mode: 'sku' | 'text') => void
  scoreThreshold?: number
  resultSize?: number
  allowedTabs?: string[]
}

export default function SkuTextSearch({ 
  onSearchResults, 
  onSearching,
  onImageUpload,
  onSkuSearch,
  onSearchModeChange,
  scoreThreshold,
  resultSize,
  allowedTabs = ['sku', 'text']
}: SkuTextSearchProps) {
  const { data: session } = useSession()
  
  // Determine initial search mode based on allowed tabs
  const getInitialMode = (): 'sku' | 'text' => {
    if (allowedTabs.includes('sku')) return 'sku'
    if (allowedTabs.includes('text')) return 'text'
    return 'sku' // fallback
  }
  
  const [searchMode, setSearchMode] = useState<'sku' | 'text'>(getInitialMode())
  const [skuValue, setSkuValue] = useState('')
  const [textValue, setTextValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Notify parent of initial mode
  useEffect(() => {
    onSearchModeChange?.(searchMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Check which tabs should be shown
  const showSkuTab = allowedTabs.includes('sku')
  const showTextTab = allowedTabs.includes('text')
  const showTabToggle = showSkuTab && showTextTab

  // Impression tracking for tab buttons
  const skuTabRef = useImpressionTracking({ eventName: 'imp_sku_tab' })
  const textTabRef = useImpressionTracking({ eventName: 'imp_text_tab' })

  // Impression tracking for content areas
  const skuModeRef = useImpressionTracking({ eventName: 'imp_sku_mode_visible' })
  const textModeRef = useImpressionTracking({ eventName: 'imp_text_mode_visible' })

  const handleSkuSearch = async () => {
    if (!skuValue.trim()) {
      setError('Please enter a SKU value to search')
      return
    }

    posthog.capture('search_with_sku', { sku: skuValue.trim() })

    setSearching(true)
    onSearching?.(true)
    setError(null)

    // Clear the uploaded image and results when SKU search starts
    onImageUpload?.('')
    onSearchResults?.([])
    
    // Track the SKU search for filter re-application
    onSkuSearch?.(skuValue.trim())

    try {
      const response = await fetch('/api/search/by-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: skuValue.trim(),
          limit: resultSize,
          score_threshold: scoreThreshold || 0.1
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to search by SKU')
      }

      const searchResult = await response.json()

      // Handle the results directly (same format as image search)
      const results = searchResult.results || []
      
      if (results.length > 0) {
        console.log('✅ SKU Search found', results.length, 'results')
        onSearchResults?.(results, true)
      } else {
        onSearchResults?.([])
        setError(`No product found with SKU: ${skuValue.trim()}`)
      }

      // Scroll to top when new results are loaded
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      onSearchResults?.([])
    } finally {
      setSearching(false)
      onSearching?.(false)
    }
  }

  const handleTextSearch = async () => {
    if (!textValue.trim()) {
      setError('Please enter a text description to search')
      return
    }

    posthog.capture('search_with_text', { text: textValue.trim() })

    setSearching(true)
    onSearching?.(true)
    setError(null)

    // Clear the uploaded image and results when text search starts
    onImageUpload?.('')
    onSearchResults?.([])

    try {
      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession?.brandId

      const formData = new FormData()
      formData.append('text', textValue.trim())
      if (brandId) {
        formData.append('brand_id', brandId)
      }
      formData.append('limit', (resultSize || 20).toString())
      formData.append('score_threshold', (scoreThreshold || 0.1).toString())

      const baseApiUrl = process.env.NEXT_PUBLIC_API_SERVER_HOST || 'http://localhost:8080'
      const response = await fetch(`${baseApiUrl}/api/search/text`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to search by text')
      }

      const searchResults = await response.json()
      const results = searchResults.results || []
      
      onSearchResults?.(results, true)

      if (results.length === 0) {
        setError(`No products found for: "${textValue.trim()}"`)
      }

      // Scroll to top when new results are loaded
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      onSearchResults?.([])
    } finally {
      setSearching(false)
      onSearching?.(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button 
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Toggle - Only show if both tabs are allowed */}
      {showTabToggle && (
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            ref={skuTabRef as React.RefObject<HTMLButtonElement>}
            onClick={() => {
              posthog.capture('sku_tab')
              setSearchMode('sku')
              setError(null)
              onSearchModeChange?.('sku')
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'sku'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SKU
          </button>
          <button
            ref={textTabRef as React.RefObject<HTMLButtonElement>}
            onClick={() => {
              posthog.capture('text_tab')
              setSearchMode('text')
              setError(null)
              onSearchModeChange?.('text')
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Text
          </button>
        </div>
      )}

      {/* SKU Mode - Only show if SKU tab is allowed */}
      {showSkuTab && searchMode === 'sku' && (
        <div ref={skuModeRef as React.RefObject<HTMLDivElement>} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={skuValue}
              onChange={(e) => setSkuValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !searching && skuValue.trim()) {
                  handleSkuSearch()
                }
              }}
              placeholder="Enter SKU code..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder-gray-500"
              disabled={searching}
            />
            <button
              onClick={handleSkuSearch}
              disabled={searching || !skuValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Search for products using their SKU code.
          </p>
        </div>
      )}

      {/* Text Mode - Only show if Text tab is allowed */}
      {showTextTab && searchMode === 'text' && (
        <div ref={textModeRef as React.RefObject<HTMLDivElement>} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !searching && textValue.trim()) {
                  handleTextSearch()
                }
              }}
              placeholder="e.g., gold ring with diamonds"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder-gray-500"
              disabled={searching}
            />
            <button
              onClick={handleTextSearch}
              disabled={searching || !textValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Describe the product you&apos;re looking for in natural language.
          </p>
        </div>
      )}
    </div>
  )
}

