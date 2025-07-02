import { NextRequest, NextResponse } from 'next/server'
import { validateExternalURL, validateFilename, validateContentType } from '@/lib/url-validator'
import { rateLimiters, getClientIdentifier, applyRateLimit } from '@/lib/rate-limiter'
import { sanitizeError, logSecureError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for downloads
    const identifier = getClientIdentifier(request)
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.general, identifier)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const audioUrl = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!audioUrl || !filename) {
      return NextResponse.json(
        { error: 'Missing url or filename parameter' },
        { status: 400 }
      )
    }

    // Validate the external URL
    const urlValidation = validateExternalURL(audioUrl)
    if (!urlValidation.isValid) {
      logSecureError('Invalid download URL attempted', { url: audioUrl, error: urlValidation.error })
      return NextResponse.json(
        { error: 'Invalid or unauthorized URL' },
        { status: 400 }
      )
    }

    // Validate the filename
    const filenameValidation = validateFilename(filename)
    if (!filenameValidation.isValid) {
      return NextResponse.json(
        { error: filenameValidation.error },
        { status: 400 }
      )
    }

    const sanitizedUrl = urlValidation.sanitizedUrl!
    const sanitizedFilename = filenameValidation.sanitizedUrl!
    
    console.log('Downloading from validated URL')
    console.log('Setting filename to:', sanitizedFilename)

    // Fetch the audio file from validated URL
    const response = await fetch(sanitizedUrl, {
      // Add security headers
      headers: {
        'User-Agent': 'SongCreator-Download/1.0'
      },
      // Prevent redirects to unauthorized domains
      redirect: 'error'
    })
    
    if (!response.ok) {
      logSecureError('Failed to fetch audio file', { status: response.status, url: sanitizedUrl })
      throw new Error(`Failed to fetch audio: ${response.status}`)
    }

    // Validate content type
    const contentType = response.headers.get('content-type')
    if (!validateContentType(contentType)) {
      logSecureError('Invalid content type received', { contentType, url: sanitizedUrl })
      return NextResponse.json(
        { error: 'Invalid file type received' },
        { status: 400 }
      )
    }

    // Check content length (max 50MB for audio files)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 413 }
      )
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    
    // Return the audio with sanitized filename
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType || 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Content-Length': audioBuffer.byteLength.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    })

  } catch (error) {
    logSecureError('Song download failed', error)
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to download song') },
      { status: 500 }
    )
  }
}