import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Add 10 credits for testing
    const creditsToAdd = 10
    
    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      throw fetchError
    }

    const currentCredits = profile?.credits_remaining || 0
    const newCredits = currentCredits + creditsToAdd

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits_remaining: newCredits })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: `Added ${creditsToAdd} test credits. You now have ${newCredits} credits.`,
      newCredits
    })

  } catch (error) {
    console.error('Error adding test credits:', error)
    return NextResponse.json(
      { error: 'Failed to add test credits' },
      { status: 500 }
    )
  }
}