'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface ExtendedSession {
  brandId?: string
}

interface ImageDropProps {
  onImageUpload: (imageUrl: string) => void
  onSearchResults?: (results: unknown[]) => void
  onSearching?: (searching: boolean) => void
  uploadedImage?: string | null
}

export default function ImageDrop({ onImageUpload, onSearchResults, onSearching, uploadedImage }: ImageDropProps) {
  const { data: session } = useSession()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Clear any previous errors
    setError(null)
    setUploadProgress(0)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setUploading(true)
    onSearching?.(true)
    setUploadProgress(10) // Initial progress
    
    try {
      // Create a temporary URL for display FIRST, before API call
      const tempUrl = URL.createObjectURL(file)
      
      // Set the uploaded image immediately for display via parent callback
      onImageUpload(tempUrl)
      setUploadProgress(30) // Image loaded
      
      // Create form data for our API
      const formData = new FormData()
      formData.append('file', file, file.name || 'image.jpg')
      formData.append('limit', '20')
      formData.append('score_threshold', '0.1')
      
      // Add brand ID from session if available
      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession?.brandId
      if (brandId) {
        formData.append('brand_id', brandId)
        console.log('🔍 Added brand_id to request:', brandId)
      }

      setUploadProgress(50) // FormData prepared

      // Call our API endpoint which will handle the external API call
      const searchResponse = await fetch('/api/search/image', {
        method: 'POST',
        body: formData
      })

      setUploadProgress(80) // API call completed

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('Search API error:', searchResponse.status, errorText)
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to search for similar images'
        if (searchResponse.status === 400) {
          errorMessage = 'Invalid image format or corrupted file'
        } else if (searchResponse.status === 413) {
          errorMessage = 'Image file is too large'
        } else if (searchResponse.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment'
        } else if (searchResponse.status >= 500) {
          errorMessage = 'Search service is temporarily unavailable'
        }
        
        throw new Error(errorMessage)
      }

      const searchResults = await searchResponse.json()
      setUploadProgress(90) // Results received
      
      // The API already transforms the results, so we just use them directly
      const results = searchResults.results || []

      // Pass results to parent component
      onSearchResults?.(results)
      setUploadProgress(100) // Complete
      
    } catch (error) {
      console.error('File search failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload and search image. Please try again.'
      setError(errorMessage)
      
      // If search fails, remove the uploaded image
      onImageUpload('')
      onSearchResults?.([])
      
    } finally {
      setUploading(false)
      setUploadProgress(0) // Reset progress
      onSearching?.(false)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0])
    }
  }

  const removeImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
    }
    onImageUpload('')
    onSearchResults?.([])
    setError(null) // Clear any errors
    setUploadProgress(0) // Reset progress
  }

  // If image is uploaded, show it with remove button
  if (uploadedImage) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
          <img
            src={uploadedImage}
            alt="Uploaded image"
            className="w-full h-full object-contain"
            style={{ aspectRatio: '1 / 1', backgroundColor: '#f3f4f6' }}
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="Remove image"
          >
            ×
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-sm font-medium mb-2">Searching for similar products...</p>
                {/* Progress bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs opacity-75">{uploadProgress}% complete</p>
              </div>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">
            {uploading ? 'Searching for similar products...' : 'Image uploaded successfully'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click the × button to remove and upload another
          </p>
          {uploading && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button 
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-gray-600">
              {uploading ? 'Searching...' : 'Drop an image here or click to upload'}
            </div>
            <div className="text-sm text-gray-500">
              Supports: JPG, PNG, GIF
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}
