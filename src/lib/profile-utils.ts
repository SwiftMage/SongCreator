import { createClient } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface ProfileCreationResult {
  success: boolean
  profile?: any
  error?: string
}

/**
 * Ensures a user has a profile in the database.
 * If profile doesn't exist, creates one with proper user data.
 */
export async function ensureUserProfile(user: User): Promise<ProfileCreationResult> {
  const supabase = createClient()
  
  try {
    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile exists, return it
    if (existingProfile && !fetchError) {
      return {
        success: true,
        profile: existingProfile
      }
    }

    // If profile doesn't exist (PGRST116 = no rows), create it
    if (fetchError?.code === 'PGRST116') {
      console.log('Profile not found for user', user.id, 'creating new profile')
      
      const profileData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        subscription_status: 'free' as const,
        credits_remaining: 0
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single()

      if (createError) {
        console.error('Failed to create profile:', createError)
        return {
          success: false,
          error: `Failed to create user profile: ${createError.message}`
        }
      }

      console.log('Successfully created profile for user:', user.id)
      return {
        success: true,
        profile: newProfile
      }
    }

    // Some other error occurred
    console.error('Error fetching profile:', fetchError)
    return {
      success: false,
      error: `Profile fetch error: ${fetchError?.message || 'Unknown error'}`
    }

  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error)
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Checks if a user has a valid profile without creating one.
 * Useful for read-only checks.
 */
export async function checkUserProfile(userId: string): Promise<{exists: boolean, profile?: any}> {
  const supabase = createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error?.code === 'PGRST116') {
      return { exists: false }
    }

    if (error) {
      console.error('Error checking profile:', error)
      return { exists: false }
    }

    return { exists: true, profile }
  } catch (error) {
    console.error('Unexpected error checking profile:', error)
    return { exists: false }
  }
}