import { useEffect, useRef, useMemo } from 'react'
import posthog from 'posthog-js'

interface UseImpressionTrackingOptions {
  eventName: string
  properties?: Record<string, unknown>
  threshold?: number // 0 to 1, how much of element must be visible
  triggerOnce?: boolean // Only fire once
  enabled?: boolean // Allow conditional tracking
}

export function useImpressionTracking({
  eventName,
  properties = {},
  threshold = 0.5, // 50% of element must be visible
  triggerOnce = true,
  enabled = true
}: UseImpressionTrackingOptions) {
  const elementRef = useRef<HTMLElement>(null)
  const hasTrackedRef = useRef(false)
  
  // Serialize properties for comparison
  const propertiesString = JSON.stringify(properties)
  
  // Memoize properties to avoid unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedProperties = useMemo(() => properties, [propertiesString])

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const element = elementRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible
            if (!triggerOnce || !hasTrackedRef.current) {
              posthog.capture(eventName, memoizedProperties)
              hasTrackedRef.current = true
              
              if (triggerOnce) {
                observer.disconnect()
              }
            }
          }
        })
      },
      {
        threshold,
        rootMargin: '0px' // Can adjust to fire before element is fully visible
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [eventName, memoizedProperties, threshold, triggerOnce, enabled])

  return elementRef
}

