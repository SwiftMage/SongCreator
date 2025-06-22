import { NextRequest, NextResponse } from 'next/server'
import { ensureAudioBackupBucket, isAudioBackupEnabled } from '@/lib/audio-backup'

export async function POST() {
  try {
    if (!isAudioBackupEnabled()) {
      return NextResponse.json({
        success: false,
        message: 'Audio backup is not enabled. Set ENABLE_AUDIO_BACKUP=true in your environment variables.'
      }, { status: 400 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Supabase service role key is not configured.'
      }, { status: 500 })
    }

    console.log('Setting up audio backup storage bucket...')
    
    await ensureAudioBackupBucket()
    
    return NextResponse.json({
      success: true,
      message: 'Audio backup storage bucket has been set up successfully.'
    })

  } catch (error) {
    console.error('Error setting up backup storage:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set up backup storage'
    }, { status: 500 })
  }
}