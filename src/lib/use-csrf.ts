import { useState, useEffect } from 'react'

interface CSRFHook {
  csrfToken: string | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<void>
}

export function useCSRF(): CSRFHook {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCSRFToken = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      setCsrfToken(data.csrfToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to fetch CSRF token:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const refreshToken = async () => {
    await fetchCSRFToken()
  }

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken
  }
}

// Helper function for making secure API requests with CSRF protection
export async function makeSecureRequest(
  url: string, 
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Add CSRF token if provided and this is a state-changing operation
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    headers['X-CSRF-Token'] = csrfToken
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  })
}

// Hook for making secure API calls
export function useSecureAPI() {
  const { csrfToken, isLoading: csrfLoading, refreshToken } = useCSRF()

  const secureRequest = async (url: string, options: RequestInit = {}) => {
    // For critical operations, ensure we have a CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET') && !csrfToken) {
      await refreshToken()
    }

    return makeSecureRequest(url, options, csrfToken || undefined)
  }

  return {
    secureRequest,
    csrfToken,
    csrfLoading,
    refreshToken
  }
}