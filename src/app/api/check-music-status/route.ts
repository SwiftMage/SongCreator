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

    return NextResponse.json({
      taskId: murekaResult.id,
      status: murekaResult.status,
      audioUrl: murekaResult.audio_url,
      duration: murekaResult.duration,
      createdAt: murekaResult.created_at,
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