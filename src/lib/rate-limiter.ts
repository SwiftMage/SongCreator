interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (identifier: string) => string // Custom key generator
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const now = Date.now()
    const windowStart = now
    const windowEnd = windowStart + this.config.windowMs

    let entry = rateLimitStore.get(key)

    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: windowEnd
      }
      rateLimitStore.set(key, entry)
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: windowEnd
      }
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiting - 100 requests per 15 minutes
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),

  // Strict rate limiting for resource-intensive operations - 10 requests per hour
  strict: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10
  }),

  // Auth-related operations - 5 attempts per 15 minutes
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  }),

  // Music generation - 5 requests per hour per user
  musicGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (userId: string) => `music_gen:${userId}`
  }),

  // Email sending - 3 requests per hour per user
  email: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (userId: string) => `email:${userId}`
  }),

  // Webhook endpoints - 1000 requests per 5 minutes per IP
  webhook: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1000,
    keyGenerator: (ip: string) => `webhook:${ip}`
  })
}

// Helper function to get client identifier
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return userId
  
  // Try to get IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `ip:${ip}`
}

// Rate limiting middleware
export async function applyRateLimit(
  request: Request,
  limiter: RateLimiter,
  identifier: string
): Promise<Response | null> {
  const result = await limiter.checkLimit(identifier)
  
  if (!result.allowed) {
    const headers = new Headers({
      'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'Retry-After': result.retryAfter?.toString() || '3600'
    })
    
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries())
        }
      }
    )
  }
  
  // Add rate limit headers to successful responses
  return null // No rate limit hit
}