import { createServerAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeError, logSecureError } from '@/lib/error-handler'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Use admin client for credit operations
    const supabase = createServerAdminClient()

    // Get current credits first
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single()

    if (fetchError) {
      logSecureError('Failed to fetch user profile', fetchError, { userId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentCredits = profile?.credits_remaining || 0

    // Reset credits to 0 using the secure function
    const { data, error } = await supabase
      .rpc('update_user_credits', {
        target_user_id: userId,
        credit_change: -currentCredits, // Remove all credits
        operation_type: 'test_reset',
        operation_context: JSON.stringify({
          reason: 'Test credits removed via API',
          previous_credits: currentCredits,
          timestamp: new Date().toISOString()
        })
      })

    if (error) {
      logSecureError('Error removing credits', error, { userId })
      return NextResponse.json({ error: 'Failed to remove credits' }, { status: 500 })
    }

    const result = data as any

    return NextResponse.json({ 
      success: true, 
      message: 'All credits removed successfully',
      oldCredits: currentCredits,
      newCredits: 0
    })

  } catch (error) {
    logSecureError('Error in remove-test-credits API', error)
    return NextResponse.json({ 
      error: sanitizeError(error, 'Internal server error') 
    }, { status: 500 })
  }
}