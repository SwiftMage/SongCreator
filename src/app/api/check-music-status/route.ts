import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.MUREKA_API_KEY) {
      return NextResponse.json(
        { error: 'Mureka API key not configured' },
        { status: 500 }
      )
    }

    console.log('Checking music generation status for task:', taskId)

    // Make request to Mureka API to check status
    const murekaResponse = await fetch(`https://api.mureka.ai/v1/song/query/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!murekaResponse.ok) {
      const errorData = await murekaResponse.text()
      console.error('Mureka API Error:', errorData)
      throw new Error(`Mureka API returned ${murekaResponse.status}: ${errorData}`)
    }

    const murekaResult = await murekaResponse.json()
    console.log('Mureka Status Response:', JSON.stringify(murekaResult, null, 2))

    // Extract all audio variations from the choices array
    const audioVariations = []
    
    if (murekaResult.choices && murekaResult.choices.length > 0) {
      murekaResult.choices.forEach((choice, index) => {
        audioVariations.push({
          index: index,
          url: choice.url,
          flacUrl: choice.flac_url,
          duration: choice.duration,
          lyricsWithTimings: choice.lyrics_sections
        })
      })
    }

    // For backward compatibility, use the first variation as the main audio
    const firstAudio = audioVariations[0] || {}

    return NextResponse.json({
      taskId: murekaResult.id,
      status: murekaResult.status,
      audioUrl: firstAudio.url || null,
      flacUrl: firstAudio.flacUrl || null,
      duration: firstAudio.duration || null,
      createdAt: murekaResult.created_at,
      finishedAt: murekaResult.finished_at,
      model: murekaResult.model,
      lyricsWithTimings: firstAudio.lyricsWithTimings,
      audioVariations: audioVariations, // All variations
      apiResponse: murekaResult
    })

  } catch (error) {
    console.error('Error checking music status:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check music status' },
      { status: 500 }
    )
  }
}