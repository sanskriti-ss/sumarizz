'use client'

import { useEffect, ReactNode } from 'react'

interface MSWProviderProps {
  children: ReactNode
}

export function MSWProvider({ children }: MSWProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only enable MSW in development
      if (process.env.NODE_ENV === 'development') {
        import('@/mocks/browser').then(({ worker }) => {
          worker.start({
            onUnhandledRequest: 'bypass',
          })
        })
      }
    }
  }, [])

  return <>{children}</>
}
