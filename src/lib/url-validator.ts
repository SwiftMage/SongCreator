/**
 * URL validation and security utilities
 */

// Allowed domains for external downloads
const ALLOWED_DOMAINS = [
  'mureka.ai',
  'api.mureka.ai',
  'cdn.mureka.ai',
  // Add other trusted domains as needed
]

// Blocked IP ranges (private networks, localhost, etc.)
const BLOCKED_IP_PATTERNS = [
  /^127\./, // 127.0.0.0/8 (localhost)
  /^10\./, // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12 (private)
  /^192\.168\./, // 192.168.0.0/16 (private)
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^::1$/, // IPv6 localhost
  /^fe80:/, // IPv6 link-local
  /^fc00:/, // IPv6 unique local
]

export interface URLValidationResult {
  isValid: boolean
  error?: string
  sanitizedUrl?: string
}

export function validateExternalURL(url: string): URLValidationResult {
  try {
    // Basic URL parsing
    const urlObj = new URL(url)
    
    // Only allow HTTPS (and HTTP for development)
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS protocols are allowed'
      }
    }
    
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only HTTPS is allowed in production'
      }
    }
    
    // Check if domain is in allowlist
    const hostname = urlObj.hostname.toLowerCase()
    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain)
    })
    
    if (!isAllowedDomain) {
      return {
        isValid: false,
        error: `Domain not allowed: ${hostname}`
      }
    }
    
    // Check for blocked IP addresses
    const isBlockedIP = BLOCKED_IP_PATTERNS.some(pattern => pattern.test(hostname))
    if (isBlockedIP) {
      return {
        isValid: false,
        error: 'Access to private/internal networks is not allowed'
      }
    }
    
    // Additional security checks
    if (urlObj.username || urlObj.password) {
      return {
        isValid: false,
        error: 'URLs with credentials are not allowed'
      }
    }
    
    // Sanitize the URL (remove potential harmful components)
    const sanitizedUrl = new URL(urlObj.protocol + '//' + urlObj.host + urlObj.pathname + urlObj.search)
    
    return {
      isValid: true,
      sanitizedUrl: sanitizedUrl.toString()
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    }
  }
}

export function validateFilename(filename: string): URLValidationResult {
  // Basic filename validation
  if (!filename || filename.length === 0) {
    return {
      isValid: false,
      error: 'Filename cannot be empty'
    }
  }
  
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid characters in filename'
    }
  }
  
  // Check for reasonable length
  if (filename.length > 255) {
    return {
      isValid: false,
      error: 'Filename too long'
    }
  }
  
  // Only allow certain file extensions
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac']
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: 'Invalid file extension'
    }
  }
  
  // Sanitize filename (remove potentially harmful characters)
  const sanitizedFilename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
  
  return {
    isValid: true,
    sanitizedUrl: sanitizedFilename
  }
}

// Additional security: validate content type
export function validateContentType(contentType: string | null): boolean {
  if (!contentType) return false
  
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/aac'
  ]
  
  return allowedTypes.some(type => contentType.toLowerCase().includes(type))
}