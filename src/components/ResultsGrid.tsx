'use client'
import React, { useState, useEffect } from 'react'
import ActionButtons from './ActionButtons'
import CopySku from './CopySku'

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  description?: string | null
  attributes: Record<string, unknown>
}

interface ResultsGridProps {
  results: SearchResult[]
  searching?: boolean
  onFindSimilar?: (imageUrl: string) => void
  onToggleInteraction?: (
    skuId: string,
    skuCode: string | undefined,
    fileName: string | undefined,
    imageUrl: string | undefined,
    interactionType: 'LIKE' | 'DISLIKE',
    similarityScore: number,
    resultPosition: number
  ) => Promise<void> | void
  getInteractionForSku?: (skuId: string) => 'LIKE' | 'DISLIKE' | undefined
}

const ITEMS_PER_PAGE = 20

export default function ResultsGrid({ results, searching, onFindSimilar, onToggleInteraction, getInteractionForSku }: ResultsGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)

  // Reset to first page when results change
  useEffect(() => {
    setCurrentPage(1)
  }, [results])

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPopup])

  const handleImageClick = (result: SearchResult, event: React.MouseEvent) => {
    setSelectedResult(result)
    setClickedElement(event.currentTarget as HTMLElement)
    setShowPopup(true)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setSelectedResult(null)
  }

  // Sort results by confidence (high to low)
  const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence)

  // Paginate results
  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedResults = sortedResults.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    window.clearTimeout((showToast as unknown as { _t?: number })._t)
    ;(showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 1800)
  }

  const performToggle = async (
    result: SearchResult,
    interactionType: 'LIKE' | 'DISLIKE',
    position: number
  ) => {
    if (!onToggleInteraction) return
    const before = getInteractionForSku ? getInteractionForSku(result.sku_id) : undefined
    try {
      await onToggleInteraction(
        result.sku_id,
        result.sku_code,
        result.file_name,
        result.image_url,
        interactionType,
        result.confidence,
        position
      )
      const after = getInteractionForSku ? getInteractionForSku(result.sku_id) : undefined
      const name = result.sku_code || result.file_name || 'item'
      if (before === interactionType && after === undefined) {
        showToast(`image ${interactionType === 'LIKE' ? 'like' : 'dislike'} removed: ${name}`, 'info')
      } else if (interactionType === 'LIKE') {
        showToast(`image liked: ${name}`, 'success')
      } else if (interactionType === 'DISLIKE') {
        showToast(`image disliked: ${name}`, 'success')
      } else {
        showToast(`image interaction updated: ${name}`, 'success')
      }
    } catch (e) {
      showToast('Failed to save interaction', 'error')
    }
  }

  if (searching) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-700 font-medium">Searching for similar products...</p>
        </div>
        <p className="text-xs text-gray-600 mt-2">This may take a few seconds</p>
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
        <p className="text-sm text-gray-800 font-semibold">No results yet</p>
        <p className="text-xs text-gray-600 mt-2">Upload an image to search for similar products</p>

      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {paginatedResults.map((result: SearchResult, index) => { const descText = String(result.description ?? '\u00A0'); const _attrs = result.attributes as { category?: unknown }; const categoryLabel = typeof _attrs.category === 'string' ? (_attrs.category as string) : null; return (
        <div 
          key={`${result.sku_id}-${index}`} 
          className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col"
        >
          {/* Image Container with Confidence Indicator */}
          <div 
            className="relative aspect-square bg-white p-3 cursor-zoom-in hover:bg-gray-50 transition-colors"
            onClick={(e) => handleImageClick(result, e)}
          >
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

            {/* Find Similar Icon Button */}
            {onFindSimilar && (
              <div className="absolute top-2 left-2">
                <button
                  onClick={() => onFindSimilar(result.image_url)}
                  className="p-1.5 rounded-md transition-colors text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Find similar products"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            )}

          </div>
          
          {/* Content Section - Flex to push button to bottom */}
          <div className="px-3 pb-3 flex flex-col flex-1">
            {/* Product Info Row */}
            <div className="flex items-start justify-between gap-2 flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm text-gray-900 break-words" title={result.sku_code}>
                    {result.sku_code}
                  </div>
                  <CopySku skuCode={result.sku_code} />
                </div>
                {/* Description - Always show for consistent layout */}
                <div className="text-xs text-gray-700 mb-2 min-h-[2.5rem] break-words">
                  {descText}
                </div>
                {/* Category Tag */}
                {categoryLabel ? (
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-md font-semibold">
                    {categoryLabel}
                  </span>
                ) : null}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-start">
              <ActionButtons 
              currentInteraction={getInteractionForSku ? getInteractionForSku(result.sku_id) : undefined}
              onLike={() => performToggle(result, 'LIKE', startIndex + index + 1)}
              onDislike={() => performToggle(result, 'DISLIKE', startIndex + index + 1)}
              />
            </div>
            
          </div>
        </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
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
                    className={`px-3 py-2 text-sm rounded-md font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
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
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Animated Scale-Up Overlay */}
      {showPopup && selectedResult && clickedElement && (
        <div 
          className="fixed inset-0 z-50"
          onClick={handleClosePopup}
        >
          <div
            className="absolute bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200"
            style={{
              left: clickedElement.getBoundingClientRect().left,
              top: clickedElement.getBoundingClientRect().top,
              width: clickedElement.getBoundingClientRect().width,
              height: clickedElement.getBoundingClientRect().height,
              transform: 'scale(2)',
              transformOrigin: 'center center',
              transition: 'all 0.3s ease-out',
              zIndex: 1000
            }}
            onClick={(e) => e.stopPropagation()}
          >
{(() => {
              const thumbnailImg = clickedElement.querySelector('img')
              if (thumbnailImg && selectedResult.image_url) {
                return (
                  <img
                    src={thumbnailImg.src}
                    alt={selectedResult.sku_code}
                    className="w-full h-full object-contain"
                  />
                )
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Image not available
                  </div>
                )
              }
            })()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
        }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
