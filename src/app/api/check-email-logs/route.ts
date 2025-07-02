import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Use service role key to access admin functions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get recent auth events/logs
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10
    })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Get the most recent users and their email confirmation status
    const recentActivity = users.users.map(user => ({
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      confirmation_sent_at: user.confirmation_sent_at,
      last_sign_in_at: user.last_sign_in_at,
      id: user.id
    }))

    return NextResponse.json({
      recent_users: recentActivity,
      total: users.users.length,
      message: 'Check confirmation_sent_at to see if emails were sent'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}