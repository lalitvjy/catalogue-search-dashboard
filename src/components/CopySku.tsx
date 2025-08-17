'use client'
import { useState } from 'react'

interface CopySkuProps {
  skuCode: string
  className?: string
}

export default function CopySku({ skuCode, className = '' }: CopySkuProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
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
      className={`text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors ${className}`}
      title="Copy SKU to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
