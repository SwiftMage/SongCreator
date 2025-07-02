import { createServerAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateCSRFToken, getCSRFTokenFromRequest } from '@/lib/csrf'
import { sanitizeError, logSecureError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfToken = getCSRFTokenFromRequest(request)
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 })
    }
    
    const { songId, userId } = await request.json()
    
    if (!songId || !userId) {
      return NextResponse.json({ error: 'Missing songId or userId' }, { status: 400 })
    }
    
    console.log('=== DELETE SONG API ===')
    console.log('Song ID:', songId)
    console.log('User ID:', userId)
    
    const adminClient = createServerAdminClient()
    
    // Delete the song with admin privileges (bypasses RLS)
    const { data, error } = await adminClient
      .from('songs')
      .delete()
      .eq('id', songId)
      .eq('user_id', userId) // Safety check to ensure user owns the song
      .select()
    
    console.log('Delete result data:', data)
    console.log('Delete error:', error)
    
    if (error) {
      logSecureError('Song deletion failed', error, { songId, userId })
      return NextResponse.json({ error: sanitizeError(error, 'Failed to delete song') }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Song not found or user does not own this song' }, { status: 404 })
    }
    
    console.log('Song deleted successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Song deleted successfully',
      deletedSong: data[0]
    })
    
  } catch (error) {
    logSecureError('Delete song API error', error)
    return NextResponse.json({ 
      error: sanitizeError(error, 'Internal server error')
    }, { status: 500 })
  }
}