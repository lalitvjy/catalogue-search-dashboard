'use client'
import { useState, useEffect } from 'react'
import CopySku from './CopySku'

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  description?: string
  attributes: Record<string, unknown>
}

interface ResultsGridProps {
  results: SearchResult[]
  searching?: boolean
  onFindSimilar?: (imageUrl: string) => void
}

const ITEMS_PER_PAGE = 20

export default function ResultsGrid({ results, searching, onFindSimilar }: ResultsGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'confidence' | 'name'>('confidence')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Reset to first page when results change
  useEffect(() => {
    setCurrentPage(1)
  }, [results])

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'confidence') {
      return sortOrder === 'desc' ? b.confidence - a.confidence : a.confidence - b.confidence
    } else {
      return sortOrder === 'desc' 
        ? b.file_name.localeCompare(a.file_name)
        : a.file_name.localeCompare(b.file_name)
    }
  })

  // Paginate results
  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedResults = sortedResults.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (searching) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Searching for similar products...</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 font-medium">No results yet</p>
        <p className="text-xs text-gray-500 mt-2">Upload an image to search for similar products</p>

      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      {results.length > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'confidence' | 'name')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="confidence">Confidence</option>
                <option value="name">Name</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              <span>{sortOrder === 'desc' ? 'High to Low' : 'Low to High'}</span>
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, results.length)} of {results.length}
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {paginatedResults.map((result: SearchResult, index) => {
          const description = String(result.description || '');
          return (
        <div key={`${result.sku_id}-${index}`} className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200">
          {/* Image Container with Confidence Indicator */}
          <div className="relative aspect-square bg-white p-3">
            {result.image_url ? (
              <img
                src={result.image_url}
                alt={result.sku_code}
                className="w-full h-full object-contain rounded-lg"
                style={{ aspectRatio: '1 / 1' }}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const errorDiv = target.nextElementSibling as HTMLElement
                  if (errorDiv) {
                    errorDiv.style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-sm"
              style={{ 
                aspectRatio: '1 / 1',
                display: result.image_url ? 'none' : 'flex'
              }}
            >
              Error Image loading
            </div>
            
            {/* Confidence Badge */}
            <div className="absolute top-2 right-2">
              <div className="bg-black/60 rounded-full px-2 py-1 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="px-3 pb-3 space-y-3">
            {/* Product Info Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 break-words mb-1" title={result.sku_code}>
                  {result.sku_code}
                </div>
                {/* Description - Always show for consistent layout */}
                <div className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem]" title={description}>
                  <span>{description}</span>
                </div>
                {/* Category Tag */}
                {result.attributes.category && typeof result.attributes.category === 'string' && (
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                    {result.attributes.category}
                  </span>
                )}
              </div>
              
              {/* Copy Action */}
              <div className="flex-shrink-0 mt-0.5">
                <CopySku skuCode={result.sku_code} />
              </div>
            </div>
            
            {/* Primary Action - Find Similar */}
            {onFindSimilar && (
              <button
                onClick={() => onFindSimilar(result.image_url)}
                className="w-full py-2 px-1.5 sm:px-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 flex items-center justify-center space-x-0.5 sm:space-x-1 shadow-sm whitespace-nowrap min-h-[32px]"
                title="Find similar products"
              >
                <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Find Similar</span>
              </button>
            )}
          </div>
        </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  }
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
