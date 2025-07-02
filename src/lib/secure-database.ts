/**
 * Secure database operations that work with enhanced RLS policies
 */

import { createServerAdminClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']

/**
 * Secure credit management operations using service role
 */
export class SecureCreditManager {
  private adminClient = createServerAdminClient()

  /**
   * Add credits to a user's account (admin operation)
   */
  async addCredits(userId: string, amount: number, reason: string = 'Admin action'): Promise<{
    success: boolean
    newBalance?: number
    error?: string
  }> {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Credit amount must be positive' }
      }

      if (amount > 1000) {
        return { success: false, error: 'Cannot add more than 1000 credits at once' }
      }

      // Get current credits
      const { data: profile, error: fetchError } = await this.adminClient
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single()

      if (fetchError) {
        return { success: false, error: 'User profile not found' }
      }

      const currentCredits = profile.credits_remaining || 0
      const newCredits = currentCredits + amount

      // Update credits using service role (bypasses RLS restriction)
      const { error: updateError } = await this.adminClient
        .from('profiles')
        .update({ credits_remaining: newCredits })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Failed to update credits' }
      }

      // Log the credit addition for audit trail
      await this.logCreditChange(userId, currentCredits, newCredits, reason, 'ADD')

      return { success: true, newBalance: newCredits }
    } catch (error) {
      console.error('Error adding credits:', error)
      return { success: false, error: 'Internal error adding credits' }
    }
  }

  /**
   * Deduct credits from a user's account (admin operation)
   */
  async deductCredits(userId: string, amount: number, reason: string = 'Service usage'): Promise<{
    success: boolean
    newBalance?: number
    error?: string
  }> {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Deduction amount must be positive' }
      }

      // Get current credits
      const { data: profile, error: fetchError } = await this.adminClient
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single()

      if (fetchError) {
        return { success: false, error: 'User profile not found' }
      }

      const currentCredits = profile.credits_remaining || 0

      if (currentCredits < amount) {
        return { success: false, error: 'Insufficient credits' }
      }

      const newCredits = currentCredits - amount

      // Update credits using service role
      const { error: updateError } = await this.adminClient
        .from('profiles')
        .update({ credits_remaining: newCredits })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Failed to deduct credits' }
      }

      // Log the credit deduction
      await this.logCreditChange(userId, currentCredits, newCredits, reason, 'DEDUCT')

      return { success: true, newBalance: newCredits }
    } catch (error) {
      console.error('Error deducting credits:', error)
      return { success: false, error: 'Internal error deducting credits' }
    }
  }

  /**
   * Get user's current credit balance
   */
  async getCredits(userId: string): Promise<{
    success: boolean
    credits?: number
    error?: string
  }> {
    try {
      const { data: profile, error } = await this.adminClient
        .from('profiles')
        .select('credits_remaining')
        .eq('id', userId)
        .single()

      if (error) {
        return { success: false, error: 'User profile not found' }
      }

      return { success: true, credits: profile.credits_remaining || 0 }
    } catch (error) {
      console.error('Error getting credits:', error)
      return { success: false, error: 'Internal error getting credits' }
    }
  }

  /**
   * Log credit changes for audit trail
   */
  private async logCreditChange(
    userId: string,
    oldCredits: number,
    newCredits: number,
    reason: string,
    operation: 'ADD' | 'DEDUCT'
  ) {
    try {
      await this.adminClient.from('audit_log').insert({
        user_id: userId,
        table_name: 'profiles',
        operation: 'UPDATE',
        record_id: userId,
        old_data: { credits_remaining: oldCredits },
        new_data: { credits_remaining: newCredits },
        // Store additional context in a custom field if needed
      })
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to log credit change:', error)
    }
  }
}

/**
 * Secure database operations that respect RLS policies
 */
export class SecureDatabase {
  private adminClient = createServerAdminClient()

  /**
   * Check rate limits using database function
   */
  async checkRateLimit(
    userId: string | null,
    ipAddress: string | null,
    endpoint: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.adminClient
        .rpc('api_rate_limit_check', {
          p_endpoint: endpoint,
          p_user_id: userId,
          p_ip_address: ipAddress
        })

      if (error) {
        console.error('Rate limit check failed:', error)
        // Fail safe - allow request if rate limit check fails
        return true
      }

      return data as boolean
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail safe - allow request if there's an error
      return true
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    userId: string | null,
    eventType: 'RATE_LIMIT_EXCEEDED' | 'INVALID_ACCESS_ATTEMPT' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_QUERY' | 'LOGIN_ANOMALY' | 'DATA_EXPORT_LARGE',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.adminClient
        .rpc('log_security_event', {
          p_user_id: userId,
          p_event_type: eventType,
          p_severity: severity,
          p_description: description,
          p_metadata: metadata ? JSON.stringify(metadata) : null,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Get security status (admin only)
   */
  async getSecurityStatus(): Promise<any> {
    try {
      const { data, error } = await this.adminClient
        .rpc('get_security_status')

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get security status:', error)
      return null
    }
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity(): Promise<any[]> {
    try {
      const { data, error } = await this.adminClient
        .rpc('verify_data_integrity')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to verify data integrity:', error)
      return []
    }
  }
}

// Export singleton instances
export const secureCreditManager = new SecureCreditManager()
export const secureDatabase = new SecureDatabase()

// Helper function to get client IP from request
export function getClientIP(request: Request): string | null {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return null
}

// Helper function to validate and sanitize user input
export function sanitizeUserInput(input: string, maxLength: number = 1000): string {
  if (!input) return ''
  
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>"\''&%;(){}[\]\\|`~!@#$%^*+=]/g, '')
    .trim()
    .substring(0, maxLength)
  
  return sanitized
}