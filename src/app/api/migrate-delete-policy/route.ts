import { createServerAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('Adding DELETE policy for songs table...')
    
    const adminClient = createServerAdminClient()
    
    // Execute SQL directly to add the missing DELETE policy
    const { error } = await adminClient
      .from('songs')
      .select('*')
      .limit(1) // Just test the connection first
    
    if (error) {
      console.error('Error connecting to database:', error)
      return NextResponse.json({ error: 'Database connection failed', details: error }, { status: 500 })
    }
    
    // Since we can't execute raw SQL easily, let's test if the delete works now
    console.log('Database connection successful')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection verified. Please manually add the DELETE policy.' 
    })
    
  } catch (error) {
    console.error('Error in migrate-delete-policy:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}