import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server'
import { sanitizeError, logSecureError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const { userId, credits, reason = 'Credit addition', paymentContext } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Credits must be a positive number' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for credit management
    const adminClient = createServerAdminClient()

    // Call the secure credit update function we created in the migration
    const { data, error } = await adminClient
      .rpc('update_user_credits', {
        target_user_id: userId,
        credit_change: credits,
        operation_type: 'payment_processed',
        operation_context: JSON.stringify({
          reason: reason,
          payment_context: paymentContext,
          timestamp: new Date().toISOString()
        })
      })

    if (error) {
      logSecureError('Credit addition failed', error, { userId, credits })
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      )
    }

    // Parse the result from the database function
    const result = data as any

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Credit addition failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      oldCredits: result.old_credits,
      newCredits: result.new_credits,
      change: result.change
    })

  } catch (error) {
    logSecureError('Credit addition API error', error)
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to add credits') },
      { status: 500 }
    )
  }
}