import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, songId } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Generating lyrics for song:', songId)
    console.log('Prompt:', prompt)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a talented songwriter and lyricist. Create heartfelt, meaningful song lyrics based on the user's request. Structure the lyrics with verses, choruses, and a bridge as appropriate. Make the lyrics personal and emotionally resonant while incorporating the specific details provided. Always follow the requested format with TITLE: and LYRICS: sections as specified in the user's prompt."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response generated from OpenAI')
    }

    console.log('Generated response:', response)

    // Return the lyrics as-is since we're no longer parsing titles
    const lyrics = response.trim()

    return NextResponse.json({
      lyrics: lyrics,
      songId
    })

  } catch (error) {
    console.error('Error generating lyrics:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate lyrics' },
      { status: 500 }
    )
  }
}