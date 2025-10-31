'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import posthog from 'posthog-js'
import { ImageStoreProvider } from '@/lib/image-store'

function PostHogIdentify() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Identify logged-in users so PostHog shows email instead of a UUID
    if (status === 'authenticated' && session?.user?.email) {
      const distinctId = String((session as any).uid || session.user.email)
      posthog.identify(distinctId, {
        email: session.user.email,
        name: session.user.name || undefined,
      })
    }

    // Clear identity when logged out
    if (status === 'unauthenticated') {
      posthog.reset()
    }
  }, [session, status])

  return null
}

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
        <PostHogIdentify />
        {children}
      </ImageStoreProvider>
    </SessionProvider>
  )
}
