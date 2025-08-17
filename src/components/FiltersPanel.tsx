'use client'
import { useState, useEffect, useMemo } from 'react'

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  attributes: Record<string, any>
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
}

export default function FiltersPanel({ filters, onFiltersChange, results }: FiltersPanelProps) {
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
          Min Confidence: {filters.confidence_min ? (filters.confidence_min * 100).toFixed(0) + '%' : 'Any'}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={filters.confidence_min || 0}
          onChange={(e) => handleFilterChange('confidence_min', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
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
