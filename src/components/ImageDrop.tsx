'use client'
import { useState, useEffect, useRef } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import { useSession } from 'next-auth/react'

interface ExtendedSession {
  brandId?: string
}

interface SearchResult {
  sku_id: string
  sku_code: string
  file_name: string
  image_url: string
  confidence: number
  description?: string | null
  attributes: Record<string, unknown>
}

interface ImageDropProps {
  onImageUpload: (imageUrl: string) => void
  onSearchResults?: (results: SearchResult[]) => void
  onSearching?: (searching: boolean) => void
  uploadedImage?: string | null
  triggerSearch?: number  // When changed, triggers search for current uploaded image
  searchImageUrl?: string | null  // Original image URL to search (not blob URL)
  scoreThreshold?: number  // Score threshold for search
  diamondWtMin?: number  // Diamond weight min filter
  diamondWtMax?: number  // Diamond weight max filter
  ctrstoneWtMin?: number  // Center stone weight min filter
  ctrstoneWtMax?: number  // Center stone weight max filter
  resultSize?: number  // Number of results to return
}

export default function ImageDrop({ onImageUpload, onSearchResults, onSearching, uploadedImage, triggerSearch, searchImageUrl, scoreThreshold, diamondWtMin, diamondWtMax, ctrstoneWtMin, ctrstoneWtMax, resultSize }: ImageDropProps) {
  const { data: session } = useSession()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [searchMode, setSearchMode] = useState<'upload' | 'url' | 'clipboard'>('upload')
  const [clipboardReady, setClipboardReady] = useState(false)
  const [crop, setCrop] = useState<Crop | undefined>()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const cropTimeoutRef = useRef<number | null>(null)

  const searchWithFile = async (file: File) => {
    try {
      setUploading(true)
      onSearching?.(true)
      setUploadProgress(10)

      const formData = new FormData()
      formData.append('file', file, file.name || 'image.jpg')
      formData.append('limit', (resultSize || 20).toString())
      formData.append('score_threshold', (scoreThreshold || 0.1).toString())
      formData.append('diamond_wt_min', (diamondWtMin || '').toString())
      formData.append('diamond_wt_max', (diamondWtMax || '').toString())
      formData.append('ctrstone_wt_min', (ctrstoneWtMin || '').toString())
      formData.append('ctrstone_wt_max', (ctrstoneWtMax || '').toString())

      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession?.brandId
      if (brandId) {
        formData.append('brand_id', brandId)
      }

      setUploadProgress(40)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      let searchResponse: Response
      try {
        searchResponse = await fetch('/api/search/image', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeoutId)
      }

      setUploadProgress(80)

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('Cropped search API error:', searchResponse.status, errorText)
        let errorMessage = 'Failed to search cropped image'
        if (searchResponse.status === 400) errorMessage = 'Invalid cropped image'
        if (searchResponse.status === 413) errorMessage = 'Cropped image is too large'
        if (searchResponse.status === 429) errorMessage = 'Too many requests. Please wait'
        if (searchResponse.status >= 500) errorMessage = 'Search service temporarily unavailable'
        throw new Error(errorMessage)
      }

      const searchResults = await searchResponse.json()
      const results = searchResults.results || []
      onSearchResults?.(results)
      setUploadProgress(100)
    } catch (err) {
      console.error('Cropped image search failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to search cropped image.'
      setError(errorMessage)
      onSearchResults?.([])
    } finally {
      setUploading(false)
      setUploadProgress(0)
      onSearching?.(false)
    }
  }

  const getCroppedBlob = async (sourceUrl: string, cropRect: Crop): Promise<Blob> => {
    const sourceBlob = sourceUrl.startsWith('blob:')
      ? await (await fetch(sourceUrl)).blob()
      : await (await fetch(sourceUrl, { cache: 'no-store' })).blob()

    const imageObjectUrl = URL.createObjectURL(sourceBlob)
    try {
      const imageEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageObjectUrl
      })

      const displayedWidth = imgRef.current?.clientWidth || imageEl.naturalWidth
      const displayedHeight = imgRef.current?.clientHeight || imageEl.naturalHeight
      const scaleX = imageEl.naturalWidth / Math.max(1, displayedWidth)
      const scaleY = imageEl.naturalHeight / Math.max(1, displayedHeight)

      const sx = Math.max(0, Math.floor((cropRect.x || 0) * scaleX))
      const sy = Math.max(0, Math.floor((cropRect.y || 0) * scaleY))
      const sWidth = Math.max(1, Math.floor((cropRect.width || 0) * scaleX))
      const sHeight = Math.max(1, Math.floor((cropRect.height || 0) * scaleY))

      const canvas = document.createElement('canvas')
      canvas.width = sWidth
      canvas.height = sHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(imageEl, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight)

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/jpeg', 0.92)
      })
      return blob
    } finally {
      URL.revokeObjectURL(imageObjectUrl)
    }
  }

  const handleCropComplete = (c: Crop) => {
    if (cropTimeoutRef.current) {
      window.clearTimeout(cropTimeoutRef.current)
      cropTimeoutRef.current = null
    }
    cropTimeoutRef.current = window.setTimeout(async () => {
      if (!uploadedImage || !c || (c.width ?? 0) < 5 || (c.height ?? 0) < 5) return
      if (uploading) return
      try {
        const blob = await getCroppedBlob(uploadedImage, c)
        const file = new File([blob], 'crop.jpg', { type: blob.type || 'image/jpeg' })
        await searchWithFile(file)
      } catch (e) {
        console.error('Cropping failed:', e)
        setError('Failed to crop image. Try a different selection.')
      }
    }, 400)
  }

  // Handle triggering search for existing uploaded image
  useEffect(() => {
    console.log('ImageDrop useEffect triggered:', { triggerSearch, searchImageUrl, resultSize, scoreThreshold, diamondWtMin, diamondWtMax, ctrstoneWtMin, ctrstoneWtMax })
    if (triggerSearch && triggerSearch > 0 && searchImageUrl) {
      console.log('Triggering search with params:', { imageUrl: searchImageUrl, resultSize, scoreThreshold, diamondWtMin, diamondWtMax, ctrstoneWtMin, ctrstoneWtMax })
      searchForImageUrl(searchImageUrl)
    }
  }, [triggerSearch, searchImageUrl, resultSize, scoreThreshold, diamondWtMin, diamondWtMax, ctrstoneWtMin, ctrstoneWtMax])

  // Global paste event listener when clipboard tab is active
  useEffect(() => {
    const handleGlobalPaste = async (event: ClipboardEvent) => {
      if (searchMode !== 'clipboard') return
      
      const items = event.clipboardData?.items
      if (!items) return
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await handleFileFromClipboard(file)
          }
          return
        }
      }
      
      setError('No image found in clipboard')
    }

    if (searchMode === 'clipboard') {
      document.addEventListener('paste', handleGlobalPaste)
    }

    return () => {
      document.removeEventListener('paste', handleGlobalPaste)
    }
  }, [searchMode])

  const searchByUrl = async (url: string) => {
    try {
      setUploading(true)
      setError(null)

      // Set the URL for display (will show as a placeholder)
      onImageUpload(url)
      
      // Start the search process
      onSearching?.(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let searchResponse: Response
      try {
        searchResponse = await fetch('/api/search/image-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: url,
            limit: resultSize || 20,
            score_threshold: scoreThreshold || 0.1,
            diamond_wt_min: diamondWtMin || '',
            diamond_wt_max: diamondWtMax || '',
            ctrstone_wt_min: ctrstoneWtMin || '',
            ctrstone_wt_max: ctrstoneWtMax || ''
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw new Error('Failed to search image URL')
      }

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('URL Search API error:', searchResponse.status, errorText)
        
        let errorMessage = 'Failed to search image URL'
        if (searchResponse.status === 400) {
          errorMessage = 'Invalid image URL or format'
        } else if (searchResponse.status >= 500) {
          errorMessage = 'Search service is temporarily unavailable'
        }
        
        throw new Error(errorMessage)
      }

      const searchResults = await searchResponse.json()
      const results = searchResults.results || []
      onSearchResults?.(results)
      
    } catch (error) {
      console.error('URL search failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to search image URL. Please try again.'
      setError(errorMessage)
      onSearchResults?.([])
      
      // If search fails, remove the uploaded image
      onImageUpload('')
      
    } finally {
      setUploading(false)
      onSearching?.(false)
    }
  }

  const searchForImageUrl = async (imageUrl: string) => {
    try {
      setUploading(true)
      onSearching?.(true)
      setUploadProgress(10)
      setError(null)

      setUploadProgress(30)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let searchResponse: Response
      
      // Check if it's a blob URL (from file upload) or regular URL
      if (imageUrl.startsWith('blob:')) {
        // Convert blob URL to file and use /api/search/image endpoint
        try {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const file = new File([blob], 'image.jpg', { type: blob.type })
          
          // Create form data for our API
          const formData = new FormData()
          formData.append('file', file, file.name || 'image.jpg')
          formData.append('limit', (resultSize || 20).toString())
          formData.append('score_threshold', (scoreThreshold || 0.1).toString())
          formData.append('diamond_wt_min', (diamondWtMin || '').toString())
          formData.append('diamond_wt_max', (diamondWtMax || '').toString())
          formData.append('ctrstone_wt_min', (ctrstoneWtMin || '').toString())
          formData.append('ctrstone_wt_max', (ctrstoneWtMax || '').toString())
          
          // Add brand ID from session if available
          const extendedSession = session as unknown as ExtendedSession
          const brandId = extendedSession?.brandId
          if (brandId) {
            formData.append('brand_id', brandId)
          }
          
          searchResponse = await fetch('/api/search/image', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          })
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw new Error('Failed to process uploaded image for re-search')
        }
      } else {
        // Use regular URL-based search API endpoint
        try {
          searchResponse = await fetch('/api/search/image-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_url: imageUrl,
              limit: resultSize || 20,
              score_threshold: scoreThreshold || 0.1,
              diamond_wt_min: diamondWtMin || '',
              diamond_wt_max: diamondWtMax || '',
              ctrstone_wt_min: ctrstoneWtMin || '',
              ctrstone_wt_max: ctrstoneWtMax || ''
            }),
            signal: controller.signal
          })
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw new Error('Failed to search image URL')
        }
      }
      
      clearTimeout(timeoutId)

      setUploadProgress(80)

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('Search API error:', searchResponse.status, errorText)
        
        let errorMessage = 'Failed to search for similar images'
        if (searchResponse.status === 400) {
          errorMessage = 'Invalid image URL or format'
        } else if (searchResponse.status >= 500) {
          errorMessage = 'Search service is temporarily unavailable'
        }
        
        throw new Error(errorMessage)
      }

      const searchResults = await searchResponse.json()
      setUploadProgress(90)
      
      const results = searchResults.results || []
      onSearchResults?.(results)
      setUploadProgress(100)
      
      
    } catch (error) {
      console.error('ImageDrop search failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to search image. Please try again.'
      setError(errorMessage)
      onSearchResults?.([])
      
    } finally {
      setUploading(false)
      setUploadProgress(0)
      onSearching?.(false)
    }
  }

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

    // Validate file type - only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError(`Please upload a JPG, PNG, or WebP image. ${file.type} files are not supported for jewelry search.`)
      return
    }

    // Validate file size (max 5MB for better performance)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 5MB.`)
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
      setCrop(undefined) // Reset crop area for new image
      setUploadProgress(30) // Image loaded
      
      // Create form data for our API
      const formData = new FormData()
      formData.append('file', file, file.name || 'image.jpg')
      formData.append('limit', (resultSize || 20).toString())
      formData.append('score_threshold', (scoreThreshold || 0.1).toString())
      formData.append('diamond_wt_min', (diamondWtMin || '').toString())
      formData.append('diamond_wt_max', (diamondWtMax || '').toString())
      formData.append('ctrstone_wt_min', (ctrstoneWtMin || '').toString())
      formData.append('ctrstone_wt_max', (ctrstoneWtMax || '').toString())
      
      // Add brand ID from session if available
      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession?.brandId
      if (brandId) {
        formData.append('brand_id', brandId)
      }

      setUploadProgress(50) // FormData prepared

      // Call our API endpoint which will handle the external API call with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let searchResponse: Response
      try {
        searchResponse = await fetch('/api/search/image', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Search request timed out. Please try again with a smaller image.')
        }
        throw fetchError
      }

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
    setImageUrl('') // Clear URL input
    setSearchMode('upload') // Reset to upload mode
    setClipboardReady(false) // Reset clipboard state
    setCrop(undefined) // Reset crop area
  }

  const handleUrlSearch = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL')
      return
    }
    
    // Validate URL format
    try {
      new URL(imageUrl.trim())
    } catch {
      setError('Please enter a valid URL')
      return
    }
    
    // Set the image URL for display
    onImageUpload(imageUrl.trim())
    setCrop(undefined) // Reset crop area for new image
    await searchByUrl(imageUrl.trim())
  }

  const handleClipboardPaste = async (event: React.ClipboardEvent) => {
    if (!clipboardReady) return
    
    const items = event.clipboardData.items
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleFileFromClipboard(file)
          setClipboardReady(false) // Reset after paste
        }
        return
      }
    }
    
    if (clipboardReady) {
      setError('No image found in clipboard')
      setClipboardReady(false)
    }
  }

  const handleClipboardClick = () => {
    setClipboardReady(true)
  }

  const handleFileFromClipboard = async (file: File) => {
    // Clear any previous errors
    setError(null)
    setUploadProgress(0)

    // Validate file type - only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError(`Please upload a JPG, PNG, or WebP image. ${file.type} files are not supported for jewelry search.`)
      return
    }

    // Validate file size (max 5MB for better performance)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 5MB.`)
      return
    }

    setUploading(true)
    onSearching?.(true)
    
    try {
      // Create a temporary URL for display FIRST, before API call
      const tempUrl = URL.createObjectURL(file)
      
      // Set the uploaded image immediately for display via parent callback
      onImageUpload(tempUrl)
      setCrop(undefined) // Reset crop area for new image
      
      // Create form data for our API
      const formData = new FormData()
      formData.append('file', file, file.name || 'image.jpg')
      formData.append('limit', (resultSize || 20).toString())
      formData.append('score_threshold', (scoreThreshold || 0.1).toString())
      formData.append('diamond_wt_min', (diamondWtMin || '').toString())
      formData.append('diamond_wt_max', (diamondWtMax || '').toString())
      formData.append('ctrstone_wt_min', (ctrstoneWtMin || '').toString())
      formData.append('ctrstone_wt_max', (ctrstoneWtMax || '').toString())
      
      // Add brand ID from session if available
      const extendedSession = session as unknown as ExtendedSession
      const brandId = extendedSession?.brandId
      if (brandId) {
        formData.append('brand_id', brandId)
      }

      // Call our API endpoint which will handle the external API call with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let searchResponse: Response
      try {
        searchResponse = await fetch('/api/search/image', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Search request timed out. Please try again with a smaller image.')
        }
        throw fetchError
      }

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
      
      // The API already transforms the results, so we just use them directly
      const results = searchResults.results || []

      // Pass results to parent component
      onSearchResults?.(results)
      
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

  // If image is uploaded, show it with remove button
  if (uploadedImage) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={handleCropComplete}>
            <img
              src={uploadedImage}
              alt="Uploaded image"
              className="w-full h-full object-contain"
              style={{ aspectRatio: '1 / 1', backgroundColor: '#f3f4f6' }}
              ref={imgRef}
            />
          </ReactCrop>
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="Remove image"
          >
            ×
          </button>
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

      {/* Mode Toggle */}
      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSearchMode('upload')}
          className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            searchMode === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upload
        </button>
        <button
          onClick={() => setSearchMode('url')}
          className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            searchMode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          URL
        </button>
        <button
          onClick={() => setSearchMode('clipboard')}
          className={`px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            searchMode === 'clipboard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Paste
        </button>
      </div>

      {/* Upload Mode */}
      {searchMode === 'upload' && (
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
                Supports: JPG, PNG, WebP (max 5MB) • For best results, use clear photos of jewelry
              </div>
            </div>
          </label>
        </div>
      )}

      {/* URL Mode */}
      {searchMode === 'url' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              disabled={uploading}
            />
            <button
              onClick={handleUrlSearch}
              disabled={uploading || !imageUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {uploading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Enter a direct URL to an image (JPG, PNG, WebP supported)
          </div>
        </div>
      )}

      {/* Clipboard Mode */}
      {searchMode === 'clipboard' && (
        <div className="space-y-3">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              clipboardReady 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={handleClipboardClick}
            onPaste={handleClipboardPaste}
          >
            <div className="space-y-3">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                clipboardReady ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <svg className={`w-6 h-6 ${clipboardReady ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className={`${clipboardReady ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                {uploading ? 'Processing...' : 
                 clipboardReady ? 'Ready! Paste with Ctrl+V' : 
                 'Click here or paste (Ctrl+V)'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Supports images copied from web pages, screenshots, or image editing software
          </div>
        </div>
      )}
    </div>
  )
}
