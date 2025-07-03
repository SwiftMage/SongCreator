import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServerAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const supabase = await createServerComponentClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get profile data using regular client (what the frontend sees)
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get profile data using admin client (what actually exists in DB)
    const adminClient = createServerAdminClient()
    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get recent audit logs
    const { data: auditLogs, error: auditError } = await adminClient
      .from('audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      userProfile: {
        data: userProfile,
        error: userError
      },
      adminProfile: {
        data: adminProfile,
        error: adminError
      },
      auditLogs: {
        data: auditLogs,
        error: auditError
      }
    })

  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}