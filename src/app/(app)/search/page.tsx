'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageDrop from '@/components/ImageDrop'
import ResultsGrid from '@/components/ResultsGrid'
import FiltersPanel from '@/components/FiltersPanel'
import LogoutModal from '@/components/LogoutModal'

interface ExtendedSession {
  brandId?: string
}

interface Filters {
  category?: string
  tags?: string
  confidence_min?: number
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [filters, setFilters] = useState<Filters>({})
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  if (!session || !extendedSession.brandId) {
    return null
  }

  // Filter results based on current filters
  const filteredResults = results.filter(result => {
    if (filters.category && result.attributes?.category !== filters.category) {
      return false
    }
    if (filters.tags && result.attributes?.tags !== filters.tags) {
      return false
    }
    if (filters.confidence_min && result.confidence < filters.confidence_min) {
      return false
    }
    return true
  })



  const handleImageUpload = (url: string) => {
    setImageUrl(url)
    setUploadedImage(url || null)
    // If URL is empty (image removed), clear results
    if (!url) {
      setResults([])
    }
  }

  const handleSearchResults = (searchResults: any[]) => {
    setResults(searchResults)
  }

  const handleFindSimilar = async (imageUrl: string) => {
    try {
      setSearching(true)
      setUploadedImage(imageUrl)
      setError(null)

      // Convert image URL to blob and create FormData
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const formData = new FormData()
      
      // Create a file-like object from the blob
      const file = new File([blob], 'similar-search.jpg', { type: blob.type || 'image/jpeg' })
      formData.append('file', file)
      formData.append('limit', '20')
      formData.append('score_threshold', '0.1')
      
      // Add brand ID from session if available
      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession.brandId
      if (brandId) {
        formData.append('brand_id', brandId)
        console.log('🔍 Added brand_id to request:', brandId)
      }

      // Call our API endpoint
      const searchResponse = await fetch('/api/search/image', {
        method: 'POST',
        body: formData
      })

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('Search API error:', searchResponse.status, errorText)
        throw new Error('Failed to search for similar images')
      }

      const searchResults = await searchResponse.json()
      const results = searchResults.results || []
      
      setResults(results)
    } catch (error) {
      console.error('Find similar error:', error)
      setError(error instanceof Error ? error.message : 'Failed to search for similar images')
    } finally {
      setSearching(false)
    }
  }

  const runSearch = async () => {
    // File uploads are handled directly in ImageDrop component
    // This function is kept for potential future URL-based searches
    console.log('URL-based search not implemented - use file upload instead')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header - More compact on mobile */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Catalogue Search</h1>
              <p className="text-sm sm:text-base text-gray-600">Upload an image to find similar products</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {session.user?.email}
              </span>
              <button
                onClick={() => setShowLogoutModal(true)}
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
            />
          </div>

          {/* Mobile Filter Toggle Button */}
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
                <div className="text-sm text-gray-600 mb-4">
                  {filteredResults.length} of {results.length} results
                </div>
              </div>
              <FiltersPanel 
                filters={filters}
                onFiltersChange={setFilters}
                results={results}
              />
            </div>
          </div>

          {/* Search Results - Full width on mobile/tablet */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
              {results.length > 0 && (
                <span className="text-sm text-gray-500">
                  {filteredResults.length} of {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <ResultsGrid results={filteredResults} searching={searching} onFindSimilar={handleFindSimilar} />
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
              />
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FiltersPanel 
                filters={filters}
                onFiltersChange={setFilters}
                results={results}
              />
            </div>
          </div>

          {/* Right Column - Search Results (70% width) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Search Results</h2>
                
              </div>
              
              <ResultsGrid results={filteredResults} searching={searching} onFindSimilar={handleFindSimilar} />
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
