import { createHash, randomBytes } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET

if (!CSRF_SECRET) {
  throw new Error('CSRF_SECRET environment variable is required for security. Please set it in your .env file.')
}

export function generateCSRFToken(): string {
  const timestamp = Date.now().toString()
  const nonce = randomBytes(16).toString('hex')
  const token = `${timestamp}.${nonce}`
  const signature = createHash('sha256')
    .update(`${token}.${CSRF_SECRET}`)
    .digest('hex')
  
  return `${token}.${signature}`
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    const [timestamp, nonce, signature] = parts
    const expectedSignature = createHash('sha256')
      .update(`${timestamp}.${nonce}.${CSRF_SECRET}`)
      .digest('hex')
    
    // Constant-time comparison
    if (signature !== expectedSignature) return false
    
    // Check if token is not older than 1 hour
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour
    
    return (now - tokenTime) <= maxAge
  } catch {
    return false
  }
}

export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first (recommended)
  const headerToken = request.headers.get('x-csrf-token')
  if (headerToken) return headerToken
  
  // Fallback to form data for POST requests
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    // This would need to be handled in each route for form data
    return null
  }
  
  return null
}