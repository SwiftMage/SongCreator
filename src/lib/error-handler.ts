export function sanitizeError(error: unknown, fallbackMessage: string = 'Internal server error'): string {
  // In development, show detailed errors
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
  
  // In production, return generic error messages to prevent information disclosure
  if (error instanceof Error) {
    // Only expose certain safe error types in production
    const safeErrorPatterns = [
      /not found/i,
      /unauthorized/i,
      /forbidden/i,
      /invalid/i,
      /missing/i,
      /required/i
    ]
    
    const isSafeError = safeErrorPatterns.some(pattern => pattern.test(error.message))
    if (isSafeError) {
      return error.message
    }
  }
  
  return fallbackMessage
}

export function logSecureError(context: string, error: unknown, additionalInfo?: Record<string, any>) {
  // Always log the full error server-side for debugging
  console.error(`[${context}]`, error, additionalInfo || {})
}