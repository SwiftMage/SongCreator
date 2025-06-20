'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Music, ArrowLeft, Check, Loader2, Play, Volume2 } from 'lucide-react'

interface GenerationStatus {
  status: 'preparing' | 'generating' | 'completed' | 'error'
  progress: number
  message: string
}

interface MusicGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error'
  taskId?: string
  audioUrl?: string
  message: string
  audioVariations?: Array<{
    index: number
    url: string
    flacUrl: string
    duration: number
    lyricsWithTimings?: any
  }>
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
  
  // Music generation state
  const [musicStatus, setMusicStatus] = useState<MusicGenerationStatus>({
    status: 'idle',
    message: 'Ready to generate music'
  })
  const [musicApiRequest, setMusicApiRequest] = useState('')
  const [musicApiResponse, setMusicApiResponse] = useState('')
  const [songData, setSongData] = useState<any>(null)

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

      // Store song data for music generation
      setSongData(songData)

      // Check if lyrics already exist (user provided their own)
      if (songData.generated_lyrics && songData.questionnaire_data.lyricsChoice === 'own') {
        setGeneratedLyrics(songData.generated_lyrics)
        setRequestString('User provided their own lyrics')
        setGenerationStatus({
          status: 'completed',
          progress: 100,
          message: 'Your song is ready!'
        })
        return
      }

      // For AI-generated lyrics
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
          status: 'processing' // Change to processing, not completed yet
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

  const generateMusic = async () => {
    if (!generatedLyrics || !songData) {
      setError('No lyrics available for music generation')
      return
    }

    setMusicStatus({
      status: 'generating',
      message: 'Generating music from lyrics...'
    })

    try {
      // Generate style prompt from song data
      const formData = songData.questionnaire_data
      let stylePrompt = ''
      
      if (formData.genres?.length > 0) {
        stylePrompt += formData.genres.join(', ')
      }
      
      if (formData.singer) {
        stylePrompt += stylePrompt ? `, ${formData.singer} vocal` : `${formData.singer} vocal`
      }
      
      if (formData.energy) {
        stylePrompt += stylePrompt ? `, ${formData.energy} energy` : `${formData.energy} energy`
      }

      if (!stylePrompt) {
        stylePrompt = 'pop, modern'
      }

      const musicRequest = {
        lyrics: generatedLyrics,
        songId: songId,
        style: stylePrompt
      }

      setMusicApiRequest(JSON.stringify(musicRequest, null, 2))

      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(musicRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate music')
      }

      const result = await response.json()
      setMusicApiResponse(JSON.stringify(result.apiResponse, null, 2))
      
      setMusicStatus({
        status: 'generating',
        taskId: result.taskId,
        message: 'Music generation in progress...'
      })

      // Store task ID in database
      await supabase
        .from('songs')
        .update({
          mureka_task_id: result.taskId,
          mureka_data: result.apiResponse
        })
        .eq('id', songId)

      // Start polling for music status
      pollMusicStatus(result.taskId)

    } catch (error) {
      console.error('Music generation error:', error)
      setMusicStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate music'
      })
    }
  }

  const pollMusicStatus = async (taskId: string) => {
    try {
      const response = await fetch('/api/check-music-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) {
        throw new Error('Failed to check music status')
      }

      const result = await response.json()
      
      if (result.status === 'succeeded' && result.audioUrl) {
        setMusicStatus({
          status: 'completed',
          taskId: taskId,
          audioUrl: result.audioUrl,
          audioVariations: result.audioVariations,
          message: 'Music generated successfully!'
        })

        // Update song in database with audio URL and all variations
        await supabase
          .from('songs')
          .update({
            status: 'completed',
            audio_url: result.audioUrl,
            mureka_data: {
              taskId: result.taskId,
              model: result.model,
              audioVariations: result.audioVariations,
              finishedAt: result.finishedAt
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', songId)

      } else if (result.status === 'failed') {
        setMusicStatus({
          status: 'error',
          message: 'Music generation failed'
        })
      } else {
        // Still processing, poll again in 5 seconds
        setTimeout(() => pollMusicStatus(taskId), 5000)
      }

    } catch (error) {
      console.error('Error polling music status:', error)
      setMusicStatus({
        status: 'error',
        message: 'Failed to check music generation status'
      })
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
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Music className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">SongCreator</span>
            </Link>
            
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
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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
                <pre className="text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">
                  {generatedLyrics}
                </pre>
              </div>
              
              {generationStatus.status === 'completed' && (
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={generateMusic}
                    disabled={musicStatus.status === 'generating'}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    <Volume2 className="h-5 w-5 inline mr-2" />
                    {musicStatus.status === 'generating' ? 'Generating Music...' : 'Generate Music'}
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                  >
                    View in Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLyrics)
                      // Could add a toast notification here
                    }}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                  >
                    Copy Lyrics
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Music Generation Section */}
          {(musicStatus.status !== 'idle' || musicApiRequest) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Music Generation</h3>
              
              {/* Music Status */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  {musicStatus.status === 'generating' && <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />}
                  {musicStatus.status === 'completed' && <Check className="h-6 w-6 text-green-600" />}
                  {musicStatus.status === 'error' && <div className="h-6 w-6 rounded-full bg-red-600" />}
                  <span className="text-lg font-medium text-gray-900">{musicStatus.message}</span>
                </div>
              </div>

              {/* Generated Audio */}
              {musicStatus.status === 'completed' && musicStatus.audioUrl && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Your Generated Song{musicStatus.audioVariations && musicStatus.audioVariations.length > 1 ? 's' : ''}
                  </h4>
                  
                  {musicStatus.audioVariations && musicStatus.audioVariations.length > 1 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Mureka generated {musicStatus.audioVariations.length} variations of your song. Listen to each one and download your favorite!
                      </p>
                      {musicStatus.audioVariations.map((variation, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Version {index + 1}</h5>
                          <audio controls className="w-full mb-3">
                            <source src={variation.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                          <div className="flex space-x-3">
                            <a
                              href={variation.url}
                              download={`song-version-${index + 1}.mp3`}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Download MP3
                            </a>
                            <a
                              href={variation.flacUrl}
                              download={`song-version-${index + 1}.flac`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Download FLAC (High Quality)
                            </a>
                            <span className="text-sm text-gray-500 py-2">
                              Duration: {Math.floor(variation.duration / 1000 / 60)}:{String(Math.floor((variation.duration / 1000) % 60)).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <audio controls className="w-full">
                        <source src={musicStatus.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="mt-4 flex space-x-4">
                        <a
                          href={musicStatus.audioUrl}
                          download="generated-song.mp3"
                          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Download Song
                        </a>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Debug: Music API Request */}
              {musicApiRequest && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Debug: Mureka API Request</h4>
                  <div className="bg-gray-100 border rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {musicApiRequest}
                    </pre>
                  </div>
                </div>
              )}

              {/* Debug: Music API Response */}
              {musicApiResponse && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Debug: Mureka API Response</h4>
                  <div className="bg-gray-100 border rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {musicApiResponse}
                    </pre>
                  </div>
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