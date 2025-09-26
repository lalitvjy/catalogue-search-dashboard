'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog once on the client
    if (typeof window !== 'undefined') {
      posthog.init('phc_6EQCZnhlSNEbwi91C21L9qqYpPjorWO1Drj2hUkyIO1', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'always',
        // PostHog automatically tracks SPA pageviews; no manual capture needed
      })
    }
  }, [])

  return <SessionProvider>{children}</SessionProvider>
}
