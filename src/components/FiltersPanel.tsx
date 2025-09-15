'use client'
import { useState, useEffect, useMemo } from 'react'

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  description?: string
  attributes: Record<string, unknown>
}

interface Filters {
  category?: string
  tags?: string
  confidence_min?: number
}

interface FiltersPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  results: SearchResult[]
  onApplyConfidenceFilter?: (confidence: number) => void
  isSearching?: boolean
}

export default function FiltersPanel({ filters, onFiltersChange, results, onApplyConfidenceFilter, isSearching = false }: FiltersPanelProps) {
  const [tempConfidence, setTempConfidence] = useState<number>(filters.confidence_min || 0)
  const [hasConfidenceChanged, setHasConfidenceChanged] = useState(false)

  // Update temp confidence when filters change externally
  useEffect(() => {
    setTempConfidence(filters.confidence_min || 0)
    setHasConfidenceChanged(false)
  }, [filters.confidence_min])

  // Extract unique categories and tags from search results
  const facets = useMemo(() => {
    const categories: Record<string, number> = {}
    const tags: Record<string, number> = {}
    
    results.forEach(result => {
      const category = result.attributes?.category
      const tag = result.attributes?.tags
      
      if (category) {
        categories[category] = (categories[category] || 0) + 1
      }
      
      if (tag) {
        tags[tag] = (tags[tag] || 0) + 1
      }
    })
    
    return { categories, tags }
  }, [results])

  const handleFilterChange = (key: keyof Filters, value: string | number | undefined) => {
    const newFilters = { ...filters }
    if (value === '' || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value as any
    }
    onFiltersChange(newFilters)
  }

  const handleConfidenceSliderChange = (value: number) => {
    // Round to nearest 5% (0.05)
    const roundedValue = Math.round(value / 0.05) * 0.05
    setTempConfidence(roundedValue)
    setHasConfidenceChanged(roundedValue !== (filters.confidence_min || 0))
  }

  const handleApplyConfidenceFilter = () => {
    if (onApplyConfidenceFilter) {
      onApplyConfidenceFilter(tempConfidence)
    } else {
      handleFilterChange('confidence_min', tempConfidence)
    }
    setHasConfidenceChanged(false)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  // Filter results based on current filters
  const filteredResults = useMemo(() => {
    return results.filter(result => {
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
  }, [results, filters])

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results Count - Hidden on mobile as it's shown in toggle button */}
      <div className="hidden sm:block text-sm text-gray-600">
        {filteredResults.length} of {results.length} results
      </div>

      {/* Category Filter */}
      {Object.keys(facets.categories).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All categories</option>
            {Object.entries(facets.categories)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([category, count]) => (
                <option key={category} value={category}>
                  {category} ({count})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Tags Filter */}
      {Object.keys(facets.tags).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <select
            value={filters.tags || ''}
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

      {/* Confidence Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Min Confidence: {tempConfidence > 0 ? (tempConfidence * 100).toFixed(0) + '%' : 'Any'}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
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
        
        {/* Apply Filter Button */}
        {hasConfidenceChanged && onApplyConfidenceFilter && (
          <div className="mt-3">
            <button
              onClick={handleApplyConfidenceFilter}
              disabled={isSearching}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Apply Filter & Re-search'}
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-3 sm:pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {key === 'confidence_min' ? `Min confidence: ${(value * 100).toFixed(0)}%` : `${key}: ${value}`}
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
