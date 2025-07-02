import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, getClientIdentifier, applyRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - identify by songId/IP for music generation
    const identifier = getClientIdentifier(request)
    const rateLimitResponse = await applyRateLimit(request, rateLimiters.musicGeneration, identifier)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Check for maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const { lyrics, songId, style, model } = await request.json()

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
    console.log('Lyrics length:', lyrics?.length)
    console.log('Style:', style)
    console.log('Custom model received:', model)
    console.log('Model to use:', model || "mureka-v6")
    console.log('API Key exists:', !!process.env.MUREKA_API_KEY)
    console.log('API Key length:', process.env.MUREKA_API_KEY?.length)

    // Clean lyrics of potentially problematic characters
    const cleanedLyrics = lyrics.replace(/⸻/g, '---').replace(/[^\x00-\x7F]/g, '')
    
    // Prepare the request payload for Mureka API with supported parameters only
    const payload: { lyrics: any; prompt: any; model: string } = {
      lyrics: cleanedLyrics,
      prompt: style || "pop, upbeat, modern",
      model: model || "auto"
    }

    console.log('Mureka API Request:', JSON.stringify(payload, null, 2))

    // Make request to Mureka API with retry logic for rate limits
    const headers = {
      'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
      'Content-Type': 'application/json',
    }
    
    console.log('Request headers prepared for Mureka API')
    
    let murekaResponse: Response | undefined
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount <= maxRetries) {
      murekaResponse = await fetch('https://api.mureka.ai/v1/song/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      // If successful, break out of retry loop
      if (murekaResponse.ok) {
        break
      }

      // If it's a rate limit error and we have retries left
      if (murekaResponse.status === 429 && retryCount < maxRetries) {
        const errorData = await murekaResponse.text()
        console.log(`Rate limit hit (attempt ${retryCount + 1}/${maxRetries + 1}). Waiting before retry...`)
        console.log('Error response:', errorData)
        
        // Exponential backoff: wait 30s, 60s, 120s
        const waitTime = 30000 * Math.pow(2, retryCount)
        console.log(`Waiting ${waitTime/1000} seconds before retry...`)
        
        await new Promise(resolve => setTimeout(resolve, waitTime))
        retryCount++
        continue
      }

      // For non-rate-limit errors or if we've exhausted retries, break and handle error
      break
    }

    if (!murekaResponse || !murekaResponse.ok) {
      if (!murekaResponse) {
        throw new Error('Failed to connect to Mureka API')
      }
      
      const errorData = await murekaResponse.text()
      console.error('Mureka API Error (final attempt):', errorData)
      
      if (murekaResponse.status === 429) {
        throw new Error(`Rate limit reached. Please wait 5-10 minutes before trying again. If this persists, you may have a stuck task - check the debug panel for active tasks.`)
      }
      
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