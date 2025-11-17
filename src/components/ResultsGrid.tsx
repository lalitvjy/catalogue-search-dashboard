'use client'
import React, { useState, useEffect } from 'react'
import ActionButtons from './ActionButtons'
import CopySku from './CopySku'
import posthog from 'posthog-js'

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

interface ResultsGridProps {
  results: SearchResult[]
  searching?: boolean
  isTextSearch?: boolean
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
  onPaginationChange?: (currentPage: number, itemsPerPage: number, totalItems: number) => void
}

const ITEMS_PER_PAGE = 20

// Helper function to parse price string like "25,232.44 INR" and return formatted price with rupee symbol
const formatPrice = (priceStr: string | null | undefined): string | null => {
  if (!priceStr) return null
  
  // Extract the numeric part (including commas and decimals) from the string
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (!match) return null
  
  const numericValue = match[0]
  return `₹${numericValue}`
}

// Result Card Component with impression tracking
interface ResultCardProps {
  result: SearchResult
  index: number
  startIndex: number
  onImageClick: (result: SearchResult, event: React.MouseEvent) => void
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
  isTextSearch?: boolean
  duplicatesCount?: number
  duplicatesExpanded?: boolean
  onToggleDuplicates?: () => void
  isDuplicate?: boolean
}

function ResultCard({ result, index, startIndex, onImageClick, onFindSimilar, onToggleInteraction, getInteractionForSku, isTextSearch, duplicatesCount = 0, duplicatesExpanded = false, onToggleDuplicates, isDuplicate = false }: ResultCardProps) {
  const performToggle = async (
    result: SearchResult,
    interactionType: 'LIKE' | 'DISLIKE',
    position: number
  ) => {
    if (!onToggleInteraction) return
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
    } catch {
      // Intentionally silent on error
    }
  }

  const descText = String(result.description ?? '')
  const confidencePercent = Math.floor(result.confidence * 1000) / 10
  

  return (
    <div 
      key={`${result.sku_id}-${index}`} 
      className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col"
    >
      {/* Image Container with Confidence Indicator */}
      <div 
        className="relative aspect-square bg-white p-3 cursor-zoom-in hover:bg-gray-50 transition-colors"
        onClick={(e) => {
          posthog.capture('zoomed_in', { 
            sku_id: result.sku_id,
            sku_code: result.sku_code,
            confidence: result.confidence,
            file_name: result.file_name
          })
          onImageClick(result, e)
        }}
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
        
        {/* Confidence Badge - Hide for text search */}
        {!isTextSearch && (
          <div className="absolute top-2 right-2">
            <div className="bg-black/60 rounded-full px-2 py-1 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {confidencePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Find Similar Icon Button */}
        {onFindSimilar && (
          <div className="absolute top-2 left-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                posthog.capture('search_from_image', { 
                  sku_id: result.sku_id,
                  sku_code: result.sku_code,
                  confidence: result.confidence,
                  file_name: result.file_name,
                  image_url: result.image_url
                })
                onFindSimilar(result.image_url)
              }}
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
      
      {/* Content Section */}
      <div className="px-3 pb-3 flex flex-col flex-1">
        <div className="flex items-start gap-2 flex-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <div className="flex-1 min-w-0 font-semibold text-sm text-gray-900 break-all" title={result.sku_code}>
                {result.sku_code}
              </div>
              <CopySku 
                skuCode={result.sku_code} 
                className="flex-shrink-0 ml-2"
                productData={{
                  sku_id: result.sku_id,
                  confidence: result.confidence,
                  file_name: result.file_name
                }}
              />
            </div>
            {formatPrice(result.price) && (
              <div className="text-sm font-medium text-gray-700 mb-1">
                {formatPrice(result.price)}
              </div>
            )}
            <div className="text-[11px] text-gray-500 mb-2 truncate" title={result.file_name}>
              {result.file_name}
            </div>
            {descText.trim() !== '' ? (
              <div className="text-xs text-gray-700 mb-2 truncate">
                {descText}
              </div>
            ) : null}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex-shrink-0">
                <ActionButtons 
                  currentInteraction={getInteractionForSku ? getInteractionForSku(result.sku_id) : undefined}
                  onLike={() => performToggle(result, 'LIKE', startIndex + index + 1)}
                  onDislike={() => performToggle(result, 'DISLIKE', startIndex + index + 1)}
                  productData={{
                    sku_id: result.sku_id,
                    sku_code: result.sku_code,
                    confidence: result.confidence,
                    file_name: result.file_name
                  }}
                />
              </div>
              {duplicatesCount > 0 && (
                <button
                  type="button"
                  title={duplicatesExpanded ? `Hide duplicates for ${result.sku_code}` : `View ${duplicatesCount} more for ${result.sku_code}`}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onToggleDuplicates) onToggleDuplicates()
                  }}
                >
                  {duplicatesExpanded ? 'Hide' : `${duplicatesCount} more >`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple mount animation wrapper to make elements appear from the left (parent side)
function AnimatedWrapper({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`transform transition-all duration-1000 linear ${entered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 origin-left'}`} style={{ transitionDelay: `${delayMs}ms` }}>
      {children}
    </div>
  )
}

export default function ResultsGrid({ results, searching, isTextSearch, onFindSimilar, onToggleInteraction, getInteractionForSku, onPaginationChange }: ResultsGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [clickedElement, setClickedElement] = useState<HTMLElement | null>(null)
  const [popupTranslate, setPopupTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set())

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
    posthog.capture('zoomed_in', { 
      sku_id: result.sku_id,
      sku_code: result.sku_code,
      confidence: result.confidence,
      file_name: result.file_name
    })
    
    setSelectedResult(result)
    setClickedElement(event.currentTarget as HTMLElement)
    setShowPopup(true)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setSelectedResult(null)
  }

  // Ensure popup remains within viewport when scaled
  useEffect(() => {
    if (!showPopup || !clickedElement) {
      setPopupTranslate({ x: 0, y: 0 })
      return
    }

    const computeTranslate = () => {
      const rect = clickedElement.getBoundingClientRect()
      const scale = 2
      const margin = 8 // small margin from viewport edges

      // With transform-origin center, visual bounds after scale:
      const leftVis = rect.left + rect.width * (1 - scale) / 2
      const rightVis = rect.left + rect.width * (1 + scale) / 2
      const topVis = rect.top + rect.height * (1 - scale) / 2
      const bottomVis = rect.top + rect.height * (1 + scale) / 2

      const vw = window.innerWidth
      const vh = window.innerHeight

      // Compute minimal translation to keep within viewport
      let translateX = 0
      let translateY = 0

      if (leftVis < margin) {
        translateX = margin - leftVis
      } else if (rightVis > vw - margin) {
        translateX = (vw - margin) - rightVis
      }

      if (topVis < margin) {
        translateY = margin - topVis
      } else if (bottomVis > vh - margin) {
        translateY = (vh - margin) - bottomVis
      }

      setPopupTranslate({ x: translateX, y: translateY })
    }

    computeTranslate()
    // Recompute on resize to keep it visible
    window.addEventListener('resize', computeTranslate)
    return () => {
      window.removeEventListener('resize', computeTranslate)
    }
  }, [showPopup, clickedElement])

  // Sort results by confidence (high to low)
  const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence)

  // Group by sku_code so only the first item per SKU is shown in grid
  const skuToGroup = new Map<string, { primary: SearchResult; duplicates: SearchResult[] }>()
  for (const item of sortedResults) {
    const key = item.sku_code
    const existing = skuToGroup.get(key)
    if (!existing) {
      skuToGroup.set(key, { primary: item, duplicates: [] })
    } else {
      existing.duplicates.push(item)
    }
  }

  const primaryResults: SearchResult[] = []
  const duplicatesMap = new Map<string, SearchResult[]>()
  for (const [sku, group] of skuToGroup.entries()) {
    primaryResults.push(group.primary)
    if (group.duplicates.length > 0) {
      duplicatesMap.set(sku, group.duplicates)
    }
  }

  // Paginate primary results (one per SKU)
  const totalPages = Math.ceil(primaryResults.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedResults = primaryResults.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Notify parent about pagination changes
  useEffect(() => {
    if (onPaginationChange && primaryResults.length > 0) {
      onPaginationChange(currentPage, ITEMS_PER_PAGE, primaryResults.length)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, primaryResults.length])

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

      {/* Results Grid (unique SKUs) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {paginatedResults.flatMap((result: SearchResult, index) => {
          const dupes = duplicatesMap.get(result.sku_code) || []
          const hasDupes = dupes.length > 0
          const elements: React.ReactNode[] = []
          elements.push(
            <div key={`${result.sku_id}-${index}`} className="flex flex-col">
              <ResultCard
                result={result}
                index={index}
                startIndex={startIndex}
                onImageClick={handleImageClick}
                onFindSimilar={onFindSimilar}
                onToggleInteraction={onToggleInteraction}
                getInteractionForSku={getInteractionForSku}
                isTextSearch={isTextSearch}
                duplicatesCount={hasDupes ? dupes.length : 0}
                duplicatesExpanded={expandedSkus.has(result.sku_code)}
                onToggleDuplicates={() => {
                  setExpandedSkus(prev => {
                    const next = new Set(prev)
                    if (next.has(result.sku_code)) next.delete(result.sku_code)
                    else next.add(result.sku_code)
                    return next
                  })
                }}
              />
            </div>
          )
          if (expandedSkus.has(result.sku_code) && hasDupes) {
            dupes.forEach((dup, idx) => {
              elements.push(
                <AnimatedWrapper key={`${dup.sku_id}-dup-${idx}`} delayMs={idx * 120}>
                  <div className="flex flex-col">
                    <ResultCard
                      result={dup}
                      index={index + idx + 1}
                      startIndex={startIndex}
                      onImageClick={handleImageClick}
                      onFindSimilar={onFindSimilar}
                      onToggleInteraction={onToggleInteraction}
                      getInteractionForSku={getInteractionForSku}
                      isTextSearch={isTextSearch}
                      isDuplicate
                    />
                  </div>
                </AnimatedWrapper>
              )
            })
          }
          return elements
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
              transform: `translate(${popupTranslate.x}px, ${popupTranslate.y}px) scale(2)`,
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

      {/* Inline duplicates are rendered directly in the grid after their parent card */}

    </div>
  )
}
