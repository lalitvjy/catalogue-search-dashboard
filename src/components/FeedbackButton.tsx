'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'

export default function FeedbackButton() {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  
  // Only show on the search page
  if (pathname !== '/search') {
    return null
  }

  return (
    <a
      href="https://mirrar.canny.io/reverse-image-search"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${
        isHovered ? 'scale-105 shadow-xl' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => posthog.capture('give_feedback')}
      title="Provide feedback"
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      <span className="font-medium text-sm">Give Feedback</span>
    </a>
  )
}
