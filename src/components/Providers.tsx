'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { ImageStoreProvider } from '@/lib/image-store'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog once on the client
    if (typeof window !== 'undefined') {
      posthog.init('phc_6EQCZnhlSNEbwi91C21L9qqYpPjorWO1Drj2hUkyIO1', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'always',
        // PostHog automatically tracks SPA pageviews; no manual capture needed
        // Test API key
        //phc_jMPiP1J7GdhVMTZdWB2B8Ob6u2n610C2MMIggSpKbw5
        // Production API key
        //phc_6EQCZnhlSNEbwi91C21L9qqYpPjorWO1Drj2hUkyIO1 
      })
    }
  }, [])

  return (
    <SessionProvider>
      <ImageStoreProvider>
        {children}
      </ImageStoreProvider>
    </SessionProvider>
  )
}
