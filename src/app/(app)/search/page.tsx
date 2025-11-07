'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageDrop from '@/components/ImageDrop'
import ResultsGrid from '@/components/ResultsGrid'
import FiltersPanel from '@/components/FiltersPanel'
import LogoutModal from '@/components/LogoutModal'
import OpenSparkStudioButton from '@/components/OpenSparkStudioButton'
import SkuTextSearch from '@/components/SkuTextSearch'
import { useSearchInteractions } from '@/hooks/useSearchInteractions'
import posthog from 'posthog-js'
import { useImpressionTracking } from '@/hooks/useImpressionTracking'

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
  const [isTextSearch, setIsTextSearch] = useState(false)
  const [filters, setFilters] = useState<Filters>({})
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [searchImageUrl, setSearchImageUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState<number>(100)
  const [triggerUrlSearch, setTriggerUrlSearch] = useState<string | null>(null)
  const [lastSkuSearch, setLastSkuSearch] = useState<string | null>(null)
  const [triggerSkuSearch, setTriggerSkuSearch] = useState<string | null>(null)
  // Initialize from localStorage if available, otherwise default to empty array
  const [allowedTabs, setAllowedTabs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('allowedTabs')
      return cached !== null ? JSON.parse(cached) : []
    }
    return []
  })
  const { currentSearchInteraction, createSearchInteraction, toggleInteraction, getInteraction } = useSearchInteractions()
  
  // Impression tracking for search page elements
  const logoutButtonRef = useImpressionTracking({ eventName: 'imp_logout' })

  const performSkuSearch = useCallback(async (skuValue: string) => {
    try {
      setSearching(true)
      setError(null)

      const response = await fetch('/api/search/by-field-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: skuValue.trim(),
          limit: resultSize,
          score_threshold: filters.confidence_min || 0.1
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to search by SKU')
      }

      const searchResult = await response.json()
      const results = searchResult.results || []
      
      if (results.length > 0) {
        console.log('✅ SKU Search found', results.length, 'results')
        setResults(results)
      } else {
        setResults([])
        setError(`No product found with SKU: ${skuValue.trim()}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [resultSize, filters.confidence_min])

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

  // Handle SKU search trigger
  useEffect(() => {
    if (triggerSkuSearch) {
      performSkuSearch(triggerSkuSearch)
      // Reset after processing
      const timer = setTimeout(() => {
        setTriggerSkuSearch(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [triggerSkuSearch, performSkuSearch])

  // Fetch component show configuration after login to decide which tabs to show
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
        
        // Parse the show array to extract 'sku' and 'text' values
        let tabs: string[] = []
        if (Array.isArray(showVal)) {
          tabs = showVal.filter((item: unknown) => item === 'sku' || item === 'text')
        }
        
        if (!isCancelled) {
          // Get the current localStorage value
          const cachedValue = localStorage.getItem('allowedTabs')
          const cachedTabs = cachedValue !== null ? JSON.parse(cachedValue) : []
          
          // Update state and localStorage if the value has changed
          const hasChanged = JSON.stringify(cachedTabs) !== JSON.stringify(tabs)
          if (cachedValue === null || hasChanged) {
            console.log('[component/show] updating allowedTabs from', cachedTabs, 'to', tabs)
            localStorage.setItem('allowedTabs', JSON.stringify(tabs))
            setAllowedTabs(tabs)
          } else {
            console.log('[component/show] value unchanged:', tabs)
          }
        }
        const tEnd = performance.now()
        console.log('[component/show] total useEffect time', Math.round(tEnd - t0), 'ms')
      } catch {
        if (!isCancelled) {
          const fallbackValue: string[] = []
          localStorage.setItem('allowedTabs', JSON.stringify(fallbackValue))
          setAllowedTabs(fallbackValue)
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

  const handleSearchResults = async (searchResults: SearchResult[], isText: boolean = false) => {
    setResults(searchResults)
    setIsTextSearch(isText)
    
    // Track search results impression with full response data
    if (searchResults.length > 0) {
      posthog.capture('imp_search_results_loaded', {
        total_results: searchResults.length,
        results: searchResults.map((result, index) => ({
          sku_id: result.sku_id,
          sku_code: result.sku_code,
          confidence: result.confidence,
          position: index + 1,
          file_name: result.file_name,
          price: result.price,
          category: result.attributes?.category
        }))
      })
    }
    
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
    console.log('handleApplyAllFilters called, searchImageUrl:', searchImageUrl, 'lastSkuSearch:', lastSkuSearch, 'resultSize:', resultSize)
    // If we have a search image URL, re-run the search with current filters and result size
    if (searchImageUrl) {
      console.log('Applying all filters with result size:', resultSize)
      setTriggerSearch(Date.now())
    } else if (lastSkuSearch) {
      console.log('Re-running SKU search with filters:', lastSkuSearch)
      // Trigger SKU search with current filters
      setTriggerSkuSearch(lastSkuSearch)
    } else {
      console.log('No search context, cannot trigger search')
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
              <OpenSparkStudioButton />
              <button
                ref={logoutButtonRef as React.RefObject<HTMLButtonElement>}
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

            {/* SKU/Text Search - Full width on mobile/tablet (conditionally shown) */}
          {allowedTabs.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Search With Text</h2>
              <SkuTextSearch
                onSearchResults={handleSearchResults}
                onSearching={setSearching}
                onImageUpload={handleImageUpload}
                onSkuSearch={(sku) => setLastSkuSearch(sku)}
                scoreThreshold={filters.confidence_min || 0.1}
                resultSize={resultSize}
                allowedTabs={allowedTabs}
              />
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
                  Showing {Math.min(1, filteredResults.length)}-{Math.min(resultSize, filteredResults.length)} of {filteredResults.length}
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
                    Showing {Math.min(1, filteredResults.length)}-{Math.min(resultSize, filteredResults.length)} of {filteredResults.length}
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
              isTextSearch={isTextSearch}
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

            {/* SKU/Text Search (conditionally shown) */}
            {allowedTabs.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Search With Text</h2>
                <SkuTextSearch
                  onSearchResults={handleSearchResults}
                  onSearching={setSearching}
                  onImageUpload={handleImageUpload}
                  onSkuSearch={(sku) => setLastSkuSearch(sku)}
                  scoreThreshold={filters.confidence_min || 0.1}
                  resultSize={resultSize}
                  allowedTabs={allowedTabs}
                />
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
                      Showing {Math.min(1, filteredResults.length)}-{Math.min(resultSize, filteredResults.length)} of {filteredResults.length}
                    </span>
                  )}
                </div>
              </div>
              
              <ResultsGrid 
                results={filteredResults} 
                searching={searching} 
                isTextSearch={isTextSearch}
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
