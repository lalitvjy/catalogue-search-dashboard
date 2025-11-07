'use client'
import { useState, useEffect, useMemo } from 'react'
import { useImpressionTracking } from '@/hooks/useImpressionTracking'

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

interface FiltersPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  results: SearchResult[]
  onApplyConfidenceFilter?: (confidence: number) => void
  isSearching?: boolean
  resultSize?: number
  onResultSizeChange?: (size: number) => void
  onApplyAllFilters?: (updatedFilters?: Filters) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FiltersPanel({ filters, onFiltersChange, results, onApplyConfidenceFilter, isSearching = false, resultSize = 20, onResultSizeChange, onApplyAllFilters }: FiltersPanelProps) {
  const [tempConfidence, setTempConfidence] = useState<number>(filters.confidence_min || 0)
  const [hasConfidenceChanged, setHasConfidenceChanged] = useState(false)
  const [hasAnyFilterChanged, setHasAnyFilterChanged] = useState(false)
  const [pendingFilters, setPendingFilters] = useState<Filters>({})

  // Impression refs
  const confidenceSliderRef = useImpressionTracking({ eventName: 'imp_confidence_filter' })
  const resultSizeRef = useImpressionTracking({ eventName: 'imp_no_of_results' })

  // Update temp confidence when filters change externally
  useEffect(() => {
    setTempConfidence(filters.confidence_min || 0)
    setHasConfidenceChanged(false)
    setHasAnyFilterChanged(false)
  }, [filters.confidence_min])

  // Extract unique tags, diamond_wt, and ctrstone_wt from search results
  const facets = useMemo(() => {
    const tags: Record<string, number> = {}
    const diamondWtValues: number[] = []
    const ctrstoneWtValues: number[] = []
    
    results.forEach(result => {
      const tag = result.attributes?.tags
      const diamondWt = result.attributes?.diamond_wt
      const ctrstoneWt = result.attributes?.ctrstone_wt
      
      if (tag && typeof tag === 'string') {
        tags[tag] = (tags[tag] || 0) + 1
      }
      
      if (diamondWt && (typeof diamondWt === 'string' || typeof diamondWt === 'number')) {
        const diamondWtNum = typeof diamondWt === 'string' ? parseFloat(diamondWt) : diamondWt
        if (!isNaN(diamondWtNum)) {
          diamondWtValues.push(diamondWtNum)
        }
      }
      
      if (ctrstoneWt && (typeof ctrstoneWt === 'string' || typeof ctrstoneWt === 'number')) {
        const ctrstoneWtNum = typeof ctrstoneWt === 'string' ? parseFloat(ctrstoneWt) : ctrstoneWt
        if (!isNaN(ctrstoneWtNum)) {
          ctrstoneWtValues.push(ctrstoneWtNum)
        }
      }
    })
    
    // Calculate min/max values
    const diamondWtMin = diamondWtValues.length > 0 ? Math.min(...diamondWtValues) : 0
    const diamondWtMax = diamondWtValues.length > 0 ? Math.max(...diamondWtValues) : 0
    const ctrstoneWtMin = ctrstoneWtValues.length > 0 ? Math.min(...ctrstoneWtValues) : 0
    const ctrstoneWtMax = ctrstoneWtValues.length > 0 ? Math.max(...ctrstoneWtValues) : 0
    
    // Debug logging
    if (results.length > 0) {
      console.log('Sample result attributes:', results[0]?.attributes)
      console.log('Diamond WT range:', { min: diamondWtMin, max: diamondWtMax, values: diamondWtValues.length })
      console.log('Center Stone WT range:', { min: ctrstoneWtMin, max: ctrstoneWtMax, values: ctrstoneWtValues.length })
    }
    
    return { 
      tags, 
      diamondWtMin, 
      diamondWtMax, 
      ctrstoneWtMin, 
      ctrstoneWtMax 
    }
  }, [results])

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    const newPendingFilters: Filters = { ...pendingFilters }
    if (value === '' || value === undefined) {
      delete newPendingFilters[key]
    } else {
      if (key === 'tags') {
        newPendingFilters[key] = value as string
      } else if (key === 'confidence_min') {
        newPendingFilters[key] = value as number
      } else if (key === 'diamond_wt_min' || key === 'diamond_wt_max' || key === 'ctrstone_wt_min' || key === 'ctrstone_wt_max') {
        newPendingFilters[key] = value as number
      }
    }
    setPendingFilters(newPendingFilters)
    setHasAnyFilterChanged(true)
  }

  const handleConfidenceSliderChange = (value: number) => {
    // Round to 2 decimal places for precision
    const roundedValue = Math.round(value * 100) / 100
    setTempConfidence(roundedValue)
    setHasConfidenceChanged(roundedValue !== (filters.confidence_min || 0))
    setHasAnyFilterChanged(true)
  }

  const handleResultSizeChange = (newSize: number) => {
    console.log('FiltersPanel handleResultSizeChange called with:', newSize)
    onResultSizeChange?.(newSize)
    setHasAnyFilterChanged(true)
  }

  const handleApplyAllFilters = () => {
    // Apply all pending filter changes
    const newFilters = { ...filters, ...pendingFilters }
    
    // Apply confidence filter if it has changed
    if (hasConfidenceChanged) {
      newFilters.confidence_min = tempConfidence
    }
    
    // Update filters with all changes
    onFiltersChange(newFilters)
    
    // Call parent's apply all filters function to trigger re-search
    // Pass the updated filters so parent can use the latest values
    // Don't call onApplyConfidenceFilter here to avoid double-triggering
    if (onApplyAllFilters) {
      onApplyAllFilters(newFilters)
    }
    
    // Reset all change flags and pending filters
    setHasConfidenceChanged(false)
    setHasAnyFilterChanged(false)
    setPendingFilters({})
  }

  const clearFilters = () => {
    onFiltersChange({})
    setHasAnyFilterChanged(false)
    setHasConfidenceChanged(false)
    setPendingFilters({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  // Filter results based on current filters
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      if (filters.tags && result.attributes?.tags !== filters.tags) {
        return false
      }
      if (filters.confidence_min && result.confidence < filters.confidence_min) {
        return false
      }
      return true
    })
  }, [results, filters])

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base">Filters</h3>
        <div className="flex items-center space-x-3">
          {hasAnyFilterChanged && (
            <button
              onClick={handleApplyAllFilters}
              disabled={isSearching}
              className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Apply & Re-search'}
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results Count - Hidden on mobile as it's shown in toggle button */}
      <div className="hidden sm:block text-sm text-gray-600">
        {filteredResults.length} of {results.length} results
      </div>

      {/* Category filter removed */}

      {/* Tags Filter */}
      {Object.keys(facets.tags).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <select
            value={pendingFilters.tags !== undefined ? pendingFilters.tags : (filters.tags || '')}
            onChange={(e) => handleFilterChange('tags', e.target.value || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All tags</option>
            {Object.entries(facets.tags)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([tag, count]) => (
                <option key={tag} value={tag}>
                  {tag} ({count})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Diamond Weight and Center Stone Weight filters hidden per requirement */}

      {/* Confidence Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Min Confidence: {tempConfidence > 0 ? (tempConfidence * 100).toFixed(0) + '%' : 'Any'}
        </label>
        <input
          ref={confidenceSliderRef as React.RefObject<HTMLInputElement>}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={tempConfidence}
          onChange={(e) => handleConfidenceSliderChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${tempConfidence * 100}%, #e5e7eb ${tempConfidence * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
        
      </div>

      {/* Result Count Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Results
        </label>
        <select
          ref={resultSizeRef as React.RefObject<HTMLSelectElement>}
          value={resultSize}
          onChange={(e) => handleResultSizeChange(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={20}>20 results</option>
          <option value={40}>40 results</option>
          <option value={100}>100 results</option>
        </select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-3 sm:pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).filter(([key]) => key !== 'category').map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {key === 'confidence_min' 
                  ? `Min confidence: ${(value * 100).toFixed(0)}%` 
                  : key === 'diamond_wt_min'
                    ? `Diamond Weight Min: ${value}`
                    : key === 'diamond_wt_max'
                      ? `Diamond Weight Max: ${value}`
                      : key === 'ctrstone_wt_min'
                        ? `Center Stone Weight Min: ${value}`
                        : key === 'ctrstone_wt_max'
                          ? `Center Stone Weight Max: ${value}`
                          : `${key}: ${value}`}
                <button
                  onClick={() => handleFilterChange(key as keyof Filters, undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
