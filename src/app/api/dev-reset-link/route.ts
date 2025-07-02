import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use service role key to generate recovery token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate a password recovery link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (error) {
      console.error('Error generating recovery link:', error)
      return NextResponse.json({ error: 'Failed to generate recovery link' }, { status: 500 })
    }

    if (!data.properties?.hashed_token) {
      return NextResponse.json({ error: 'No recovery token generated' }, { status: 500 })
    }

    // Construct the recovery URL
    const recoveryUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${data.properties.hashed_token}&type=recovery&redirect_to=${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`

    return NextResponse.json({ 
      recoveryUrl,
      message: 'Recovery link generated successfully (development only)'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}