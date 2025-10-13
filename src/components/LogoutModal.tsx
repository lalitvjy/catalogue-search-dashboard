'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import posthog from 'posthog-js'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function LogoutModal({ isOpen, onClose, userEmail }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isLoggingOut, onClose])

  const handleLogout = async () => {
    posthog.capture('sign_out')
    
    setIsLoggingOut(true)
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isLoggingOut ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200">
          
          {/* Modal Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                {/* Logout Icon */}
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Sign out of your account?
                </h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    You are currently signed in as
                  </p>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    {userEmail}
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    Are you sure you want to sign out? You'll need to sign in again to access your search results.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {/* Stay Signed In - Primary Action (Default) */}
            <button
              type="button"
              onClick={() => {
                posthog.capture('stay_signed_in', { source: 'logout_modal' })
                onClose()
              }}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
            >
              Stay Signed In
            </button>
            
            {/* Sign Out - Secondary Action */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
