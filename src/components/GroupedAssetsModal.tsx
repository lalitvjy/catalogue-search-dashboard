'use client'
import React, { useEffect } from 'react'
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
  plp_code?: string
  grouped_assets?: SearchResult[]
}

interface GroupedAssetsModalProps {
  isOpen: boolean
  onClose: () => void
  mainResult: SearchResult
  groupedAssets: SearchResult[]
  onImageClick?: (result: SearchResult) => void
}

const formatPrice = (priceStr: string | null | undefined): string | null => {
  if (!priceStr) return null
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (!match) return null
  const numericValue = match[0]
  return `₹${numericValue}`
}

export default function GroupedAssetsModal({
  isOpen,
  onClose,
  mainResult,
  groupedAssets,
  onImageClick
}: GroupedAssetsModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      posthog.capture('grouped_assets_modal_opened', {
        main_sku: mainResult.sku_code,
        plp_code: mainResult.plp_code,
        grouped_count: groupedAssets.length
      })
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, mainResult, groupedAssets.length])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const allResults = [mainResult, ...groupedAssets]

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Related Products
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {allResults.length} variants with PLP code: {mainResult.plp_code || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allResults.map((result, index) => {
              const confidencePercent = Math.floor(result.confidence * 1000) / 10
              const isMain = index === 0

              return (
                <div 
                  key={`${result.sku_id}-${index}`}
                  className={`group border-2 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
                    isMain ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Main Badge */}
                  {isMain && (
                    <div className="bg-blue-500 text-white text-xs font-semibold py-1 text-center">
                      Main Result
                    </div>
                  )}

                  {/* Image Container */}
                  <div 
                    className="relative aspect-square bg-white p-2 cursor-zoom-in hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      if (onImageClick) {
                        posthog.capture('grouped_asset_clicked', {
                          sku_id: result.sku_id,
                          sku_code: result.sku_code,
                          is_main: isMain
                        })
                        onImageClick(result)
                      }
                    }}
                  >
                    {result.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.image_url}
                        alt={result.sku_code}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const errorDiv = target.nextElementSibling as HTMLElement
                          if (errorDiv) errorDiv.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-gray-500 text-xs"
                      style={{ display: result.image_url ? 'none' : 'flex' }}
                    >
                      No Image
                    </div>
                    
                    {/* Confidence Badge */}
                    <div className="absolute top-1 right-1">
                      <div className="bg-black/60 rounded-full px-2 py-0.5">
                        <span className="text-white text-xs font-medium">
                          {confidencePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="px-2 pb-2 flex flex-col flex-1">
                    <div className="font-semibold text-xs text-gray-900 truncate mb-1" title={result.sku_code}>
                      {result.sku_code}
                    </div>
                    {formatPrice(result.price) && (
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {formatPrice(result.price)}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 truncate" title={result.file_name}>
                      {result.file_name}
                    </div>
                    {result.description && (
                      <div className="text-[10px] text-gray-600 truncate mt-1">
                        {result.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
