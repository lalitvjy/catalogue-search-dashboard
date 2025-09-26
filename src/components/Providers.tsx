'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize PostHog once on the client
    posthog.init('phc_6EQCZnhlSNEbwi91C21L9qqYpPjorWO1Drj2hUkyIO1', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'always',
    })
  }, [])

  useEffect(() => {
    // Track page views on route changes
    if (!pathname) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])

  return <SessionProvider>{children}</SessionProvider>
}
