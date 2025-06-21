import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lyrics, songId, style } = await request.json()

    if (!lyrics) {
      return NextResponse.json(
        { error: 'Lyrics are required' },
        { status: 400 }
      )
    }

    if (!process.env.MUREKA_API_KEY) {
      return NextResponse.json(
        { error: 'Mureka API key not configured' },
        { status: 500 }
      )
    }

    console.log('Generating music for song:', songId)
    console.log('Lyrics:', lyrics)
    console.log('Style:', style)
    console.log('API Key exists:', !!process.env.MUREKA_API_KEY)
    console.log('API Key length:', process.env.MUREKA_API_KEY?.length)

    // Prepare the request payload for Mureka API with supported parameters only
    const payload = {
      lyrics: lyrics,
      model: "mureka-6", // Use the latest mureka-6 model for best quality
      prompt: style || "pop, upbeat, modern, high quality, studio production"
    }

    console.log('Mureka API Request:', JSON.stringify(payload, null, 2))

    // Make request to Mureka API
    const headers = {
      'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
      'Content-Type': 'application/json',
    }
    
    console.log('Request headers (auth masked):', {
      'Authorization': `Bearer ${process.env.MUREKA_API_KEY?.substring(0, 5)}...`,
      'Content-Type': 'application/json',
    })
    
    const murekaResponse = await fetch('https://api.mureka.ai/v1/song/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!murekaResponse.ok) {
      const errorData = await murekaResponse.text()
      console.error('Mureka API Error:', errorData)
      throw new Error(`Mureka API returned ${murekaResponse.status}: ${errorData}`)
    }

    const murekaResult = await murekaResponse.json()
    console.log('Mureka API Response:', JSON.stringify(murekaResult, null, 2))

    return NextResponse.json({
      taskId: murekaResult.id,
      status: murekaResult.status,
      traceId: murekaResult.trace_id,
      model: murekaResult.model,
      createdAt: murekaResult.created_at,
      songId,
      apiRequest: payload,
      apiResponse: murekaResult
    })

  } catch (error) {
    console.error('Error generating music:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate music' },
      { status: 500 }
    )
  }
}