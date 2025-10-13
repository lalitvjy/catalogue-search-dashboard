'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageDrop from '@/components/ImageDrop'
import ResultsGrid from '@/components/ResultsGrid'
import FiltersPanel from '@/components/FiltersPanel'
import LogoutModal from '@/components/LogoutModal'
import { useSearchInteractions } from '@/hooks/useSearchInteractions'
import posthog from 'posthog-js'

interface ExtendedSession {
  brandId?: string
  role?: string
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

interface Filters {
  category?: string
  tags?: string
  confidence_min?: number
  diamond_wt_min?: number
  diamond_wt_max?: number
  ctrstone_wt_min?: number
  ctrstone_wt_max?: number
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<Filters>({})
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [searchImageUrl, setSearchImageUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState<number>(20)
  const [skuSearchValue, setSkuSearchValue] = useState<string>('')
  const [skuSearching, setSkuSearching] = useState<boolean>(false)
  const [triggerUrlSearch, setTriggerUrlSearch] = useState<string | null>(null)
  // Initialize from localStorage if available, otherwise default to false
  const [showSkuSection, setShowSkuSection] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('showSkuSection')
      return cached !== null ? cached === 'true' : false
    }
    return false
  })
  const { currentSearchInteraction, createSearchInteraction, toggleInteraction, getInteraction } = useSearchInteractions()

  // Reset triggerUrlSearch after it's been used
  useEffect(() => {
    if (triggerUrlSearch) {
      // Reset after a short delay to allow the ImageDrop component to process it
      const timer = setTimeout(() => {
        setTriggerUrlSearch(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [triggerUrlSearch])

  // Fetch component show configuration after login to decide visibility of SKU section
  useEffect(() => {
    if (status !== 'authenticated') return
    const t0 = performance.now()
    const brandStart = performance.now()
    const extended = session as unknown as ExtendedSession
    const brandId = extended?.brandId
    const brandEnd = performance.now()
    console.log('[component/show] brand_id resolution took', Math.round(brandEnd - brandStart), 'ms')
    if (!brandId) return
    let isCancelled = false
    ;(async () => {
      try {
        const baseApiUrl = process.env.NEXT_PUBLIC_API_SERVER_HOST || 'http://localhost:8080'
        const url = `${baseApiUrl}/api/component/show`
        const body = new URLSearchParams({ brand_id: brandId }).toString()
        const fetchStart = performance.now()
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        })
        const fetchEnd = performance.now()
        console.log('[component/show] external call took', Math.round(fetchEnd - fetchStart), 'ms', url)
        if (!resp.ok) throw new Error('Failed to load component visibility')
        const data = await resp.json()
        const showVal = (data && (data.show ?? data?.data?.show)) as unknown
        const shouldShow = Array.isArray(showVal)
          ? showVal.includes('search_with_sku')
          : typeof showVal === 'string'
            ? showVal === 'search_with_sku'
            : !!(showVal && typeof showVal === 'object' && 'search_with_sku' in (showVal as Record<string, unknown>))
        
        if (!isCancelled) {
          const newValue = Boolean(shouldShow)
          // Get the current localStorage value
          const cachedValue = localStorage.getItem('showSkuSection')
          const cachedBool = cachedValue === 'true'
          
          // Update state and localStorage if the value has changed
          if (cachedValue === null || cachedBool !== newValue) {
            console.log('[component/show] updating showSkuSection from', cachedBool, 'to', newValue)
            localStorage.setItem('showSkuSection', String(newValue))
            setShowSkuSection(newValue)
          } else {
            console.log('[component/show] value unchanged:', newValue)
          }
        }
        const tEnd = performance.now()
        console.log('[component/show] total useEffect time', Math.round(tEnd - t0), 'ms')
      } catch {
        if (!isCancelled) {
          const fallbackValue = false
          localStorage.setItem('showSkuSection', String(fallbackValue))
          setShowSkuSection(fallbackValue)
        }
      }
    })()
    return () => { isCancelled = true }
  }, [status, session])

  const handleToggleInteraction = async (
    skuId: string,
    skuCode: string | undefined,
    fileName: string | undefined,
    imageUrl: string | undefined,
    interactionType: 'LIKE' | 'DISLIKE',
    similarityScore: number,
    resultPosition: number
  ) => {
    try {
      if (!currentSearchInteraction) {
        if (!uploadedImage || results.length === 0) {
          return
        }
        let finalImageUrl = uploadedImage
        try {
          if (uploadedImage.startsWith('blob:')) {
            const response = await fetch(uploadedImage)
            const blob = await response.blob()
            const file = new File([blob], 'search-image.jpg', { type: blob.type || 'image/jpeg' })
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData })
            if (uploadRes.ok) {
              const data = await uploadRes.json()
              finalImageUrl = data.url || finalImageUrl
            }
          } else if (/^https?:\/\//i.test(uploadedImage)) {
            const imageResp = await fetch(uploadedImage)
            if (imageResp.ok) {
              const blob = await imageResp.blob()
              const file = new File([blob], 'search-image.jpg', { type: blob.type || 'image/jpeg' })
              const formData = new FormData()
              formData.append('file', file)
              const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData })
              if (uploadRes.ok) {
                const data = await uploadRes.json()
                finalImageUrl = data.url || finalImageUrl
              }
            }
          }
        } catch {}

        const newId = await createSearchInteraction({
          inputImageUrl: finalImageUrl,
          searchParams: {
            scoreThreshold: filters.confidence_min || 0.1,
            diamondWtMin: filters.diamond_wt_min,
            diamondWtMax: filters.diamond_wt_max,
            ctrstoneWtMin: filters.ctrstone_wt_min,
            ctrstoneWtMax: filters.ctrstone_wt_max,
            resultSize
          },
          totalResults: results.length
        })
        return toggleInteraction(skuId, skuCode, fileName, imageUrl, interactionType, similarityScore, resultPosition, newId)
      }
      return toggleInteraction(skuId, skuCode, fileName, imageUrl, interactionType, similarityScore, resultPosition)
    } catch {}
  }

  // Check authentication status and brand access
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    // Check if user has brand access
    const extendedSession = session as unknown as ExtendedSession
    const brandId = extendedSession.brandId
    if (!brandId) {
      // User is authenticated but has no brand access
      router.push('/help-center')
      return
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated or no brand access (will redirect)
  const extendedSession = session as unknown as ExtendedSession
  
  if (!session) {
    return null
  }
  
  // If we have a session but no brandId, show a message instead of redirecting immediately
  if (!extendedSession.brandId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  // Filter results based on current filters
  const filteredResults = results.filter(result => {
    if (filters.category && result.attributes?.category !== filters.category) {
      return false
    }
    if (filters.tags && result.attributes?.tags !== filters.tags) {
      return false
    }
    // Check diamond weight range
    if (filters.diamond_wt_min !== undefined || filters.diamond_wt_max !== undefined) {
      const diamondWt = typeof result.attributes?.diamond_wt === 'number' ? result.attributes.diamond_wt : 
                       typeof result.attributes?.diamond_wt === 'string' ? parseFloat(result.attributes.diamond_wt) : null
      if (diamondWt === null || isNaN(diamondWt)) return false
      
      if (filters.diamond_wt_min !== undefined && diamondWt < filters.diamond_wt_min) return false
      if (filters.diamond_wt_max !== undefined && diamondWt > filters.diamond_wt_max) return false
    }
    
    // Check center stone weight range
    if (filters.ctrstone_wt_min !== undefined || filters.ctrstone_wt_max !== undefined) {
      const ctrstoneWt = typeof result.attributes?.ctrstone_wt === 'number' ? result.attributes.ctrstone_wt : 
                        typeof result.attributes?.ctrstone_wt === 'string' ? parseFloat(result.attributes.ctrstone_wt) : null
      if (ctrstoneWt === null || isNaN(ctrstoneWt)) return false
      
      if (filters.ctrstone_wt_min !== undefined && ctrstoneWt < filters.ctrstone_wt_min) return false
      if (filters.ctrstone_wt_max !== undefined && ctrstoneWt > filters.ctrstone_wt_max) return false
    }
    if (filters.confidence_min && result.confidence < filters.confidence_min) {
      return false
    }
    return true
  })
  



  const handleImageUpload = (url: string) => {
    setUploadedImage(url || null)
    // Set searchImageUrl for re-search functionality
    setSearchImageUrl(url || null)
    // If URL is empty (image removed), clear results
    if (!url) {
      setResults([])
    }
  }

  const handleSearchResults = async (searchResults: SearchResult[]) => {
    setResults(searchResults)
    
    // Create search interaction when we have search results and an uploaded image
    if (searchResults.length > 0 && uploadedImage) {
      try {
        // Ensure the input image is uploaded to R2 via our API
        let finalImageUrl = uploadedImage
        try {
          if (uploadedImage.startsWith('blob:')) {
            const response = await fetch(uploadedImage)
            const blob = await response.blob()
            const file = new File([blob], 'search-image.jpg', { type: blob.type || 'image/jpeg' })
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData })
            if (uploadRes.ok) {
              const data = await uploadRes.json()
              finalImageUrl = data.url || finalImageUrl
            }
          } else if (/^https?:\/\//i.test(uploadedImage)) {
            // For external URLs, fetch and reupload to R2 for persistence
            const imageResp = await fetch(uploadedImage)
            if (imageResp.ok) {
              const blob = await imageResp.blob()
              const file = new File([blob], 'search-image.jpg', { type: blob.type || 'image/jpeg' })
              const formData = new FormData()
              formData.append('file', file)
              const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData })
              if (uploadRes.ok) {
                const data = await uploadRes.json()
                finalImageUrl = data.url || finalImageUrl
              }
            }
          }
        } catch (e) {
          console.warn('Failed to upload input image to R2:', e)
        }

        await createSearchInteraction({
          inputImageUrl: finalImageUrl,
          searchParams: {
            scoreThreshold: filters.confidence_min || 0.1,
            diamondWtMin: filters.diamond_wt_min,
            diamondWtMax: filters.diamond_wt_max,
            ctrstoneWtMin: filters.ctrstone_wt_min,
            ctrstoneWtMax: filters.ctrstone_wt_max,
            resultSize
          },
          totalResults: searchResults.length
        })
        console.log("Creating search interactions!!!!!!------->");
      } catch (error) {
        console.error('Failed to create search interaction:', error)
        // Don't show error to user for this background operation
      }
    }
    
    // Scroll to top when new results are loaded
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFindSimilar = (imageUrl: string) => {
    setError(null)
    
    // Clear any active filters that might hide the new results
    setFilters({})
    
    // Store the original image URL for searching (not the blob URL)
    setSearchImageUrl(imageUrl)
    
    // Update the Image Input section to show the selected image
    handleImageUpload(imageUrl)
    setUploadedImage(imageUrl)
    
    // Trigger search in ImageDrop component with a unique value
    setTriggerSearch(Date.now())
  }

  const handleApplyConfidenceFilter = (confidence: number) => {
    setError(null)
    
    posthog.capture('confidence_filter', { confidence_value: confidence })
    
    // Update filters with new confidence threshold
    setFilters(prev => ({ ...prev, confidence_min: confidence }))
    
    // If we have a search image URL, re-run the search with new confidence
    if (searchImageUrl) {
      setTriggerSearch(Date.now())
    }
  }

  const handleResultSizeChange = (newSize: number) => {
    console.log('handleResultSizeChange called with:', newSize)
    
    posthog.capture('no_of_results', { result_count: newSize })
    
    setResultSize(newSize)
    // Don't trigger search immediately - wait for Apply button
  }

  const handleApplyAllFilters = () => {
    console.log('handleApplyAllFilters called, searchImageUrl:', searchImageUrl, 'resultSize:', resultSize)
    // If we have a search image URL, re-run the search with current filters and result size
    if (searchImageUrl) {
      console.log('Applying all filters with result size:', resultSize)
      setTriggerSearch(Date.now())
    } else {
      console.log('No searchImageUrl, cannot trigger search')
    }
  }

  const handleSkuSearch = async () => {
    if (!skuSearchValue.trim()) {
      setError('Please enter a SKU value to search')
      return
    }

    posthog.capture('search_with_sku', { sku: skuSearchValue.trim() })

    setSkuSearching(true)
    setSearching(true) // Show the main "Searching for similar products..." loader
    setError(null)
    
    // Clear the uploaded image and results when SKU search starts
    setUploadedImage(null)
    setSearchImageUrl(null)
    setResults([]) // Clear previous search results immediately

    try {
      const response = await fetch('/api/search/by-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: skuSearchValue.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to search by SKU')
      }

      const searchResult = await response.json()
      
      // Console log the image_url as requested
      if (searchResult.image_url) {
        console.log('SKU Search Image URL:', searchResult.image_url)
      }
      
      // If SKU was found, trigger URL search using the ImageDrop component
      if (searchResult.found && searchResult.image_url) {
        console.log('🔍 Triggering URL search with SKU image...')
        setTriggerUrlSearch(searchResult.image_url)
        // Keep searching state true - it will be reset when URL search completes via handleSearchResults
      } else {
        // No results found - only reset searching state here
        setResults([])
        setError(`No product found with SKU: ${skuSearchValue.trim()}`)
        setSearching(false) // Hide the main loader only when SKU search fails
      }
      
      // Scroll to top when new results are loaded
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      setSearching(false) // Hide the main loader only when SKU search fails
    } finally {
      setSkuSearching(false)
      // Don't reset searching state here - let it be managed by the URL search completion
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header - More compact on mobile */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">mirrAR Catalogue Search</h1>
              <p className="text-sm sm:text-base text-gray-600">Upload an image to find similar products</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {session.user?.email}
              </span>
              <button
                onClick={() => {
                  posthog.capture('logout')
                  setShowLogoutModal(true)
                }}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mobile-first layout */}
        <div className="space-y-4 sm:space-y-6 lg:hidden">
          {/* Image Input - Full width on mobile/tablet */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Image Input</h2>
            <ImageDrop 
              onImageUpload={handleImageUpload}
              onSearchResults={handleSearchResults}
              onSearching={setSearching}
              uploadedImage={uploadedImage}
              triggerSearch={triggerSearch}
              searchImageUrl={searchImageUrl}
              triggerUrlSearch={triggerUrlSearch}
              scoreThreshold={filters.confidence_min || 0.1}
              diamondWtMin={filters.diamond_wt_min}
              diamondWtMax={filters.diamond_wt_max}
              ctrstoneWtMin={filters.ctrstone_wt_min}
              ctrstoneWtMax={filters.ctrstone_wt_max}
              resultSize={resultSize}
            />
          </div>

          {/* SKU Search - Full width on mobile/tablet (conditionally shown) */}
          {showSkuSection && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Search with SKU</h2>
            <div className="space-y-4">
              <div>
                <div className="flex gap-2">
                  <input
                    id="sku-search"
                    type="text"
                    value={skuSearchValue}
                    onChange={(e) => setSkuSearchValue(e.target.value)}
                    placeholder="Enter SKU code..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSkuSearch()
                      }
                    }}
                  />
                  <button
                    onClick={handleSkuSearch}
                    disabled={skuSearching || !skuSearchValue.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {skuSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Find products by SKU code.
              </p>
            </div>
          </div>
          )}
    
          <div className="sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
            >
              <span className="font-medium text-gray-800">Filters</span>
              {/* <span className="text-sm text-gray-500">
                {filteredResults.length} of {results.length} results
              </span> */}
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filters - Hidden by default on mobile, always visible on tablet */}
          <div className={`sm:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="sm:hidden mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Filters</h3>
                <div className="text-sm text-gray-700 font-medium mb-4">
                  Showing {Math.min(1, filteredResults.length)}-{Math.min(20, filteredResults.length)} of {filteredResults.length}
                </div>
              </div>
              <FiltersPanel 
                filters={filters}
                onFiltersChange={setFilters}
                results={results}
                onApplyConfidenceFilter={handleApplyConfidenceFilter}
                isSearching={searching}
                resultSize={resultSize}
                onResultSizeChange={handleResultSizeChange}
                onApplyAllFilters={handleApplyAllFilters}
              />
            </div>
          </div>

          {/* Search Results - Full width on mobile/tablet */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
              <div className="flex items-center space-x-4">
                {results.length > 0 && (
                  <span className="text-sm text-gray-700 font-medium">
                    Showing {Math.min(1, filteredResults.length)}-{Math.min(20, filteredResults.length)} of {filteredResults.length}
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  <label htmlFor="result-size" className="text-sm text-gray-600">Results:</label>
                  <select
                    id="result-size"
                    value={resultSize}
                    onChange={(e) => handleResultSizeChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
            
            <ResultsGrid 
              results={filteredResults} 
              searching={searching} 
              onFindSimilar={handleFindSimilar}
              onToggleInteraction={handleToggleInteraction}
              getInteractionForSku={getInteraction}
            />
          </div>
        </div>

        {/* Desktop Layout - 2-column layout (lg and above) */}
        <div className="hidden lg:grid lg:grid-cols-10 lg:gap-8">
          {/* Left Column - Image Input and Filters (30% width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image Input */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Image Input</h2>
              <ImageDrop 
                onImageUpload={handleImageUpload}
                onSearchResults={handleSearchResults}
                onSearching={setSearching}
                uploadedImage={uploadedImage}
                triggerSearch={triggerSearch}
                searchImageUrl={searchImageUrl}
                triggerUrlSearch={triggerUrlSearch}
                scoreThreshold={filters.confidence_min || 0.1}
                diamondWtMin={filters.diamond_wt_min}
                diamondWtMax={filters.diamond_wt_max}
                ctrstoneWtMin={filters.ctrstone_wt_min}
                ctrstoneWtMax={filters.ctrstone_wt_max}
                resultSize={resultSize}
              />
            </div>

            {/* SKU Search (conditionally shown) */}
            {showSkuSection && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Search with SKU</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <input
                      id="sku-search-desktop"
                      type="text"
                      value={skuSearchValue}
                      onChange={(e) => setSkuSearchValue(e.target.value)}
                      placeholder="Enter SKU code..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800 placeholder-gray-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSkuSearch()
                        }
                      }}
                    />
                    <button
                      onClick={handleSkuSearch}
                      disabled={skuSearching || !skuSearchValue.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {skuSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Search for products using their SKU code. This will find exact matches and similar products.
                </p>
              </div>
            </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FiltersPanel 
                filters={filters}
                onFiltersChange={setFilters}
                results={results}
                onApplyConfidenceFilter={handleApplyConfidenceFilter}
                isSearching={searching}
                resultSize={resultSize}
                onResultSizeChange={handleResultSizeChange}
                onApplyAllFilters={handleApplyAllFilters}
              />
            </div>
          </div>

          {/* Right Column - Search Results (70% width) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
                <div className="flex items-center space-x-4">
                  {results.length > 0 && (
                    <span className="text-sm text-gray-700 font-medium">
                      Showing {Math.min(1, filteredResults.length)}-{Math.min(20, filteredResults.length)} of {filteredResults.length}
                    </span>
                  )}
                </div>
              </div>
              
              <ResultsGrid 
                results={filteredResults} 
                searching={searching} 
                onFindSimilar={handleFindSimilar}
                onToggleInteraction={handleToggleInteraction}
                getInteractionForSku={getInteraction}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        userEmail={session.user?.email || undefined}
      />
    </div>
  )
}
