import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check for maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    if (!process.env.MUREKA_API_KEY) {
      return NextResponse.json(
        { error: 'Mureka API key not configured' },
        { status: 500 }
      )
    }

    console.log('Testing Mureka API connection...')
    if (process.env.NODE_ENV === 'development') {
      console.log('API connection configured:', !!process.env.MUREKA_API_KEY)
    }

    // Try to make a simple request to a non-generation endpoint
    // Since we don't know if Mureka has a status/health endpoint, 
    // we'll try querying a fake task ID to see the response format
    const testResponse = await fetch('https://api.mureka.ai/v1/song/query/test-connection-check', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const responseText = await testResponse.text()
    console.log('Mureka test response status:', testResponse.status)
    console.log('Mureka test response:', responseText)

    return NextResponse.json({
      connected: testResponse.status !== 401 && testResponse.status !== 403,
      statusCode: testResponse.status,
      response: responseText,
      apiKeyConfigured: !!process.env.MUREKA_API_KEY,
      apiKeyLength: process.env.MUREKA_API_KEY?.length
    })

  } catch (error) {
    console.error('Error testing Mureka connection:', error)
    
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.MUREKA_API_KEY
    })
  }
}