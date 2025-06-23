import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.MUREKA_API_KEY) {
      return NextResponse.json(
        { error: 'Mureka API key not configured' },
        { status: 500 }
      )
    }

    // Get recent songs with Mureka task IDs from database
    const supabase = createClient()
    const { data: recentSongs, error: dbError } = await supabase
      .from('songs')
      .select('id, mureka_task_id, created_at, status')
      .not('mureka_task_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch recent tasks' },
        { status: 500 }
      )
    }

    const activeTasks = []

    // Check status of each recent task
    for (const song of recentSongs || []) {
      if (song.mureka_task_id) {
        try {
          const murekaResponse = await fetch(`https://api.mureka.ai/v1/song/query/${song.mureka_task_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.MUREKA_API_KEY}`,
              'Content-Type': 'application/json',
            }
          })

          if (murekaResponse.ok) {
            const taskResult = await murekaResponse.json()
            activeTasks.push({
              songId: song.id,
              taskId: song.mureka_task_id,
              status: taskResult.status,
              createdAt: song.created_at,
              murekaCreatedAt: taskResult.created_at,
              model: taskResult.model
            })
          }
        } catch (error) {
          console.error(`Error checking task ${song.mureka_task_id}:`, error)
          // Continue checking other tasks
        }
      }
    }

    return NextResponse.json({
      activeTasks,
      totalFound: activeTasks.length
    })

  } catch (error) {
    console.error('Error listing Mureka tasks:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to list Mureka tasks' },
      { status: 500 }
    )
  }
}