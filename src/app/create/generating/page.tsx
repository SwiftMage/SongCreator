'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Music, ArrowLeft, Check, Loader2 } from 'lucide-react'

interface GenerationStatus {
  status: 'preparing' | 'generating' | 'completed' | 'error'
  progress: number
  message: string
}

export default function GeneratingSongPage() {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'preparing',
    progress: 0,
    message: 'Preparing your song request...'
  })
  const [requestString, setRequestString] = useState('')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [error, setError] = useState('')
  const [songId, setSongId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const songIdParam = searchParams.get('songId')
    if (songIdParam) {
      setSongId(songIdParam)
      startGeneration(songIdParam)
    } else {
      setError('No song ID provided')
      setGenerationStatus({
        status: 'error',
        progress: 0,
        message: 'Invalid song request'
      })
    }
  }, [searchParams])

  const startGeneration = async (songId: string) => {
    try {
      // Fetch song data from database
      const { data: songData, error: fetchError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (fetchError || !songData) {
        throw new Error('Song not found')
      }

      const aiPrompt = songData.questionnaire_data.aiPrompt
      setRequestString(aiPrompt)

      // Update status to generating
      setGenerationStatus({
        status: 'generating',
        progress: 25,
        message: 'Sending request to AI...'
      })

      // Make API request to OpenAI
      const response = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          songId: songId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate lyrics')
      }

      setGenerationStatus({
        status: 'generating',
        progress: 75,
        message: 'AI is writing your lyrics...'
      })

      const result = await response.json()
      setGeneratedLyrics(result.lyrics)

      // Update song in database
      await supabase
        .from('songs')
        .update({
          generated_lyrics: result.lyrics,
          status: 'completed'
        })
        .eq('id', songId)

      setGenerationStatus({
        status: 'completed',
        progress: 100,
        message: 'Your song is ready!'
      })

    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setGenerationStatus({
        status: 'error',
        progress: 0,
        message: 'Failed to generate song'
      })

      // Update song status in database
      if (songId) {
        await supabase
          .from('songs')
          .update({ status: 'failed' })
          .eq('id', songId)
      }
    }
  }

  const getProgressColor = () => {
    switch (generationStatus.status) {
      case 'completed':
        return 'bg-green-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-purple-600'
    }
  }

  const getStatusIcon = () => {
    switch (generationStatus.status) {
      case 'completed':
        return <Check className="h-6 w-6 text-green-600" />
      case 'error':
        return <div className="h-6 w-6 rounded-full bg-red-600" />
      default:
        return <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">SongCreator</span>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              disabled={generationStatus.status === 'generating'}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {generationStatus.status === 'completed' ? 'Your Song is Ready!' : 'Generating Your Song'}
            </h1>
            <p className="text-gray-600">
              {generationStatus.status === 'completed' 
                ? 'Your personalized song has been created successfully!' 
                : 'Please wait while we create your personalized song...'}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-4 mb-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{generationStatus.message}</h3>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                      style={{ width: `${generationStatus.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Generation Failed</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Debug: Request String */}
          {requestString && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug: AI Request</h3>
              <div className="bg-white border rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {requestString}
                </pre>
              </div>
            </div>
          )}

          {/* Generated Lyrics */}
          {generatedLyrics && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Generated Lyrics</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <pre className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                  {generatedLyrics}
                </pre>
              </div>
              
              {generationStatus.status === 'completed' && (
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    View in Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLyrics)
                      // Could add a toast notification here
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Copy Lyrics
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading Animation */}
          {generationStatus.status === 'generating' && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-purple-600">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-lg font-medium">Creating something amazing...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}