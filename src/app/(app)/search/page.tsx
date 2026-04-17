'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  plp_code?: string
  grouped_assets?: SearchResult[]
}

interface Filters {
  category?: string
  tags?: string
  confidence_min?: number
  diamond_wt_min?: number
  diamond_wt_max?: number
  ctrstone_wt_min?: number
  ctrstone_wt_max?: number
  onhand_min?: number
  salesmemo_min?: number
  lab_contractor_min?: number
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
  const [resultSize, setResultSize] = useState<number>(500)
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
  const [enabledFilters, setEnabledFilters] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('enabledFilters')
      return cached !== null ? JSON.parse(cached) : []
    }
    return []
  })
  const { currentSearchInteraction, createSearchInteraction, toggleInteraction, getInteraction } = useSearchInteractions()
  
  // Impression tracking for search page elements
  const logoutButtonRef = useImpressionTracking({ eventName: 'imp_logout' })

  // Debug: Log when results state changes
  useEffect(() => {
    console.log('Results state updated, new length:', results.length)
  }, [results])

  // Filter results based on current filters (memoized to prevent unnecessary re-renders)
  // Must be defined before any conditional returns to follow Rules of Hooks
  const filteredResults = useMemo(() => {
    console.log('filteredResults memo recalculating, results.length:', results.length, 'filters:', filters)
    return results.filter(result => {
      // Check category (text match)
      if (filters.category) {
        const category = result.attributes?.category
        if (typeof category !== 'string' || 
            !category.toLowerCase().includes(filters.category.toLowerCase())) {
          return false
        }
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
      // Check On Hand minimum
      if (filters.onhand_min !== undefined) {
        const val = Number(result.attributes?.total_onhand_qty)
        if (isNaN(val) || val < filters.onhand_min) return false
      }
      // Check Sales Memo minimum
      if (filters.salesmemo_min !== undefined) {
        const val = Number(result.attributes?.total_salesmemo_qty)
        if (isNaN(val) || val < filters.salesmemo_min) return false
      }
      // Check Lab+Contractor minimum
      if (filters.lab_contractor_min !== undefined) {
        const labVal = Number(result.attributes?.total_lab_qty) || 0
        const contractorVal = Number(result.attributes?.total_contractor_qty) || 0
        if ((labVal + contractorVal) < filters.lab_contractor_min) return false
      }
      if (filters.confidence_min && result.confidence < filters.confidence_min) {
        return false
      }
      return true
    })
  }, [results, filters])

  const handleSearchResults = useCallback(async (searchResults: SearchResult[], isText: boolean = false) => {
    console.log('handleSearchResults called with', searchResults.length, 'results')
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
  }, [uploadedImage, filters.confidence_min, filters.diamond_wt_min, filters.diamond_wt_max, filters.ctrstone_wt_min, filters.ctrstone_wt_max, resultSize, createSearchInteraction])

  const performSkuSearch = useCallback(async (skuValue: string, confidenceOverride?: number) => {
    try {
      setSearching(true)
      setError(null)

      // Use override if provided, otherwise use current filters
      const confidenceToUse = confidenceOverride !== undefined ? confidenceOverride : (filters.confidence_min || 0.1)

      const response = await fetch('/api/search/by-field-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: skuValue.trim(),
          limit: resultSize,
          score_threshold: confidenceToUse
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
        const baseApiUrl = process.env.NEXT_PUBLIC_API_SERVER_HOST || 'http://localhost:8081'
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
        const enabledFiltersVal = (data && (data.enabled_filters ?? data?.data?.enabled_filters)) as unknown
        
        // Parse the show array to extract 'sku' and 'text' values
        let tabs: string[] = []
        if (Array.isArray(showVal)) {
          tabs = showVal.filter((item: unknown) => item === 'sku' || item === 'text')
        }
        
        // Parse the enabled_filters array
        let filters: string[] = []
        if (Array.isArray(enabledFiltersVal)) {
          filters = enabledFiltersVal.filter((item: unknown) => typeof item === 'string') as string[]
        }
        
        if (!isCancelled) {
          // Get the current localStorage value for tabs
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
          
          // Get the current localStorage value for enabled filters
          const cachedFiltersValue = localStorage.getItem('enabledFilters')
          const cachedFilters = cachedFiltersValue !== null ? JSON.parse(cachedFiltersValue) : []
          
          // Update state and localStorage if the value has changed
          const hasFiltersChanged = JSON.stringify(cachedFilters) !== JSON.stringify(filters)
          if (cachedFiltersValue === null || hasFiltersChanged) {
            console.log('[component/show] updating enabledFilters from', cachedFilters, 'to', filters)
            localStorage.setItem('enabledFilters', JSON.stringify(filters))
            setEnabledFilters(filters)
          } else {
            console.log('[component/show] enabledFilters unchanged:', filters)
          }
        }
        const tEnd = performance.now()
        console.log('[component/show] total useEffect time', Math.round(tEnd - t0), 'ms')
      } catch {
        if (!isCancelled) {
          const fallbackValue: string[] = []
          localStorage.setItem('allowedTabs', JSON.stringify(fallbackValue))
          setAllowedTabs(fallbackValue)
          localStorage.setItem('enabledFilters', JSON.stringify(fallbackValue))
          setEnabledFilters(fallbackValue)
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



  const handleImageUpload = (url: string) => {
    setUploadedImage(url || null)
    // Set searchImageUrl for re-search functionality
    setSearchImageUrl(url || null)
    // If URL is empty (image removed), clear results
    if (!url) {
      setResults([])
    }
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

  const handleResultSizeChangeImmediate = (newSize: number) => {
    console.log('handleResultSizeChangeImmediate called with:', newSize)
    
    posthog.capture('no_of_results', { result_count: newSize })
    
    setResultSize(newSize)
    
    // Trigger search immediately with the new size
    if (searchImageUrl) {
      console.log('Triggering immediate search with new result size:', newSize)
      // Use setTimeout to ensure state update has been processed
      setTimeout(() => {
        setTriggerSearch(Date.now())
      }, 0)
    } else if (lastSkuSearch) {
      console.log('Re-running SKU search immediately with new result size:', newSize)
      // Use setTimeout to ensure state update
      setTimeout(() => {
        performSkuSearch(lastSkuSearch, filters.confidence_min)
      }, 0)
    }
  }

  const handleApplyAllFilters = (updatedFilters?: Filters, newResultSize?: number) => {
    console.log('handleApplyAllFilters called, searchImageUrl:', searchImageUrl, 'lastSkuSearch:', lastSkuSearch, 'resultSize:', resultSize, 'newResultSize:', newResultSize, 'updatedFilters:', updatedFilters)
    
    // Use updated filters if provided, otherwise use current filters state
    const filtersToUse = updatedFilters || filters
    
    // Use new result size if provided, otherwise use current resultSize state
    const resultSizeToUse = newResultSize !== undefined ? newResultSize : resultSize
    
    // Update filters state if updatedFilters was provided
    if (updatedFilters) {
      setFilters(updatedFilters)
    }
    
    // Update result size state if newResultSize was provided
    if (newResultSize !== undefined) {
      setResultSize(newResultSize)
    }
    
    // If we have a search image URL, re-run the search with updated filters and result size
    if (searchImageUrl) {
      console.log('Applying all filters with result size:', resultSizeToUse, 'confidence_min:', filtersToUse.confidence_min)
      // Use a small delay to ensure state is updated before triggering search
      setTimeout(() => {
        setTriggerSearch(Date.now())
      }, 0)
    } else if (lastSkuSearch) {
      console.log('Re-running SKU search with filters:', lastSkuSearch, 'confidence_min:', filtersToUse.confidence_min)
      // Trigger SKU search with updated confidence value
      performSkuSearch(lastSkuSearch, filtersToUse.confidence_min)
    } else {
      console.log('No search context, cannot trigger search')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="max-w-[1920px] mx-auto w-full flex flex-col h-full">
        {/* Header - More compact on mobile */}
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">mirrAR Catalogue Search</h1>
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
          <div className="flex-shrink-0 mx-4 sm:mx-6 mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
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

        {/* Main Content - Scrollable on mobile/tablet, fixed layout on desktop */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden px-4 sm:px-6 lg:px-6 pb-4 lg:pb-0">
          {/* Mobile-first layout */}
          <div className="space-y-4 sm:space-y-6 lg:hidden pb-4">
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
              category={filters.category}
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
                enabledFilters={enabledFilters}
              />
            </div>
          </div>

          {/* Search Results - Full width on mobile/tablet */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
              <div className="flex items-center space-x-2">
                <label htmlFor="result-size" className="text-sm text-gray-600">Results:</label>
                <select
                  id="result-size"
                  value={resultSize}
                  onChange={(e) => handleResultSizeChangeImmediate(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={100}>100</option>
                </select>
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
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 h-full">
          {/* Left Column - Image Input (sticky) + scrollable rest */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden">
            {/* Image Input - stays fixed at top */}
            <div className="flex-shrink-0 pb-6">
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
                  category={filters.category}
                  resultSize={resultSize}
                />
              </div>
            </div>

            {/* Scrollable area for text search + filters */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-6 pb-6">
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
                    enabledFilters={enabledFilters}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Search Results (expanded width) */}
          <div className="lg:col-span-9 flex flex-col overflow-hidden">
            <div className="bg-white rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
