import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create Supabase client with service role key for admin operations
    const supabase = await createServerComponentClient()

    // Set credits to zero
    const { error } = await supabase
      .from('profiles')
      .update({ credits_remaining: 0 })
      .eq('id', userId)

    if (error) {
      console.error('Error removing credits:', error)
      return NextResponse.json({ error: 'Failed to remove credits' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All credits removed successfully'
    })

  } catch (error) {
    console.error('Error in remove-test-credits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}