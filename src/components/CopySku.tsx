'use client'
import { useState } from 'react'
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'
import posthog from 'posthog-js'

interface CopySkuProps {
  skuCode: string
  className?: string
  productData?: {
    sku_id?: string
    confidence?: number
    file_name?: string
  }
}

export default function CopySku({ skuCode, className = '', productData }: CopySkuProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    posthog.capture('clicked_copy', {
      sku_code: skuCode,
      ...productData
    })
    
    try {
      await navigator.clipboard.writeText(skuCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = skuCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-colors ${
        copied 
          ? 'text-green-600 hover:text-green-700 bg-green-50' 
          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
      } ${className}`}
      title="Copy SKU to clipboard"
    >
      {copied ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <DocumentDuplicateIcon className="w-4 h-4" />
      )}
    </button>
  )
}
