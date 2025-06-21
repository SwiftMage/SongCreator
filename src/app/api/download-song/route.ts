import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const audioUrl = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!audioUrl || !filename) {
      return NextResponse.json(
        { error: 'Missing url or filename parameter' },
        { status: 400 }
      )
    }

    console.log('Downloading from URL:', audioUrl)
    console.log('Setting filename to:', filename)

    // Fetch the audio file from Mureka's CDN
    const response = await fetch(audioUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`)
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    
    // Return the audio with our custom filename
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading song:', error)
    return NextResponse.json(
      { error: 'Failed to download song' },
      { status: 500 }
    )
  }
}