import { NextRequest, NextResponse } from 'next/server'
import { secureCreditManager, secureDatabase, getClientIP } from '@/lib/secure-database'
import { sanitizeError, logSecureError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    const isAllowed = await secureDatabase.checkRateLimit(null, clientIP, 'admin_operations')
    
    if (!isAllowed) {
      await secureDatabase.logSecurityEvent(
        null,
        'RATE_LIMIT_EXCEEDED',
        'MEDIUM',
        'Rate limit exceeded for admin credit operation',
        { endpoint: 'add-test-credits', ip: clientIP }
      )
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Use secure credit manager
    const result = await secureCreditManager.addCredits(userId, 10, 'Test credits added via API')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Log successful operation
    await secureDatabase.logSecurityEvent(
      userId,
      'DATA_EXPORT_LARGE', // Using closest available enum value
      'LOW',
      'Test credits added successfully',
      { credits_added: 10, new_balance: result.newBalance }
    )

    return NextResponse.json({
      success: true,
      message: `Added 10 test credits. You now have ${result.newBalance} credits.`,
      newCredits: result.newBalance
    })

  } catch (error) {
    logSecureError('Failed to add test credits', error)
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to add test credits') },
      { status: 500 }
    )
  }
}