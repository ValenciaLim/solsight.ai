/**
 * Performance Monitor Component
 * 
 * Monitors and logs navigation performance to help identify bottlenecks
 */

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PerformanceMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    const startTime = performance.now()
    
    // Monitor when the page is fully loaded
    const handleLoad = () => {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Log performance warnings only
      if (loadTime > 1000) {
        console.warn(`⚠️  Slow navigation to ${pathname}: ${loadTime.toFixed(2)}ms`)
      }
    }

    // Use different events to detect when page is loaded
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname])

  return null // This component doesn't render anything
}

