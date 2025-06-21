import { NextRequest, NextResponse } from 'next/server'
import { backupAudioFile, ensureAudioBackupBucket, isAudioBackupEnabled } from '@/lib/audio-backup'

export async function POST(request: NextRequest) {
  try {
    const { testUrl, testSongId } = await request.json()

    if (!isAudioBackupEnabled()) {
      return NextResponse.json({
        success: false,
        message: 'Audio backup is not enabled. Set ENABLE_AUDIO_BACKUP=true in your environment variables.'
      }, { status: 400 })
    }

    if (!testUrl || !testSongId) {
      return NextResponse.json({
        success: false,
        message: 'testUrl and testSongId parameters are required'
      }, { status: 400 })
    }

    console.log(`Testing audio backup with URL: ${testUrl} and songId: ${testSongId}`)

    // Ensure bucket exists
    await ensureAudioBackupBucket()

    // Test backup
    const backupUrl = await backupAudioFile(testUrl, testSongId, 0)

    return NextResponse.json({
      success: true,
      message: 'Audio backup test completed successfully',
      originalUrl: testUrl,
      backupUrl: backupUrl,
      songId: testSongId
    })

  } catch (error) {
    console.error('Error testing backup:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Backup test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}