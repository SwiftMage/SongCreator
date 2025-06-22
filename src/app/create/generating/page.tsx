'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Music, ArrowLeft, Check, Loader2, Volume2 } from 'lucide-react'
import { getBestAudioUrl } from '@/lib/audio-player'

// Helper component for audio with fallback
function AudioWithFallback({ 
  primaryUrl, 
  backupUrl, 
  className 
}: { 
  primaryUrl: string; 
  backupUrl?: string; 
  className?: string 
}) {
  return (
    <audio controls className={className}>
      <source src={primaryUrl} type="audio/mpeg" />
      {backupUrl && <source src={backupUrl} type="audio/mpeg" />}
      Your browser does not support the audio element.
    </audio>
  )
}

// Helper component for download button with fallback
function DownloadButtonWithFallback({
  primaryUrl,
  backupUrl,
  filename,
  className,
  label
}: {
  primaryUrl: string;
  backupUrl?: string;
  filename: string;
  className: string;
  label: string;
}) {
  const handleDownload = async () => {
    console.log('=== DOWNLOAD BUTTON CLICKED ===')
    console.log('filename received:', filename)
    console.log('primaryUrl:', primaryUrl)
    console.log('backupUrl:', backupUrl)
    
    try {
      const bestUrl = await getBestAudioUrl(primaryUrl, backupUrl)
      if (bestUrl) {
        console.log('Downloading from URL:', bestUrl)
        console.log('Desired filename:', filename)
        
        // Use our API to proxy the download with custom filename
        const downloadUrl = `/api/download-song?url=${encodeURIComponent(bestUrl)}&filename=${encodeURIComponent(filename)}`
        console.log('Using download API:', downloadUrl)
        
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Download not available. The file may be temporarily unavailable.')
      }
    } catch (error) {
      console.error('Error downloading audio:', error)
      alert('Unable to download audio. The file may be temporarily unavailable.')
    }
  }

  return (
    <button onClick={handleDownload} className={className}>
      {label}
    </button>
  )
}

interface GenerationStatus {
  status: 'preparing' | 'generating' | 'completed' | 'error'
  progress: number
  message: string
}

interface MusicGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error'
  taskId?: string
  audioUrl?: string
  backupAudioUrl?: string
  message: string
  audioVariations?: Array<{
    index: number
    url: string
    flacUrl: string
    duration: number
    lyricsWithTimings?: any
  }>
  backupVariations?: Array<{
    index: number
    backupUrl: string
    originalUrl: string
  }>
}

function GeneratingSongPage() {
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'preparing',
    progress: 0,
    message: 'Preparing your song request...'
  })
  const [requestString, setRequestString] = useState('')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [editedLyrics, setEditedLyrics] = useState('')
  const [isEditingLyrics, setIsEditingLyrics] = useState(false)
  const [isSavingLyrics, setIsSavingLyrics] = useState(false)
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
  
  // Music progress bar state
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicProgressInterval, setMusicProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [showCompletionZoom, setShowCompletionZoom] = useState(false)

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

  // Cleanup music progress interval on unmount
  useEffect(() => {
    return () => {
      if (musicProgressInterval) {
        clearInterval(musicProgressInterval)
      }
    }
  }, [musicProgressInterval])

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
      setEditedLyrics(result.lyrics)

      // Update song in database with lyrics
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

  const saveLyricsEdits = async () => {
    if (!songId || !editedLyrics.trim()) {
      alert('Please enter lyrics to save')
      return
    }

    setIsSavingLyrics(true)
    try {
      await supabase
        .from('songs')
        .update({ generated_lyrics: editedLyrics.trim() })
        .eq('id', songId)

      setGeneratedLyrics(editedLyrics.trim())
      setIsEditingLyrics(false)
      alert('Lyrics saved successfully!')
    } catch (error) {
      console.error('Error saving lyrics:', error)
      alert('Failed to save lyrics. Please try again.')
    } finally {
      setIsSavingLyrics(false)
    }
  }

  const startMusicProgressBar = () => {
    setMusicProgress(0)
    setShowCompletionZoom(false)
    
    // Start progress bar that fills over 60 seconds
    const interval = setInterval(() => {
      setMusicProgress(prev => {
        const increment = 100 / (60 * 10) // 60 seconds, update every 100ms
        return Math.min(prev + increment, 95) // Stop at 95% until completion
      })
    }, 100)
    
    setMusicProgressInterval(interval)
  }

  const completeMusicProgressBar = () => {
    if (musicProgressInterval) {
      clearInterval(musicProgressInterval)
      setMusicProgressInterval(null)
    }
    
    // Zoom to 100% completion
    setMusicProgress(100)
    setShowCompletionZoom(true)
    
    // Remove zoom effect after animation
    setTimeout(() => {
      setShowCompletionZoom(false)
    }, 1000)
  }

  const generateMusic = async () => {
    console.log('=== GENERATE MUSIC CLICKED ===')
    console.log('generatedLyrics:', !!generatedLyrics)
    console.log('songData:', !!songData)
    
    if (!generatedLyrics || !songData) {
      setError('No lyrics available for music generation')
      return
    }

    setMusicStatus({
      status: 'generating',
      message: 'Generating music from lyrics...'
    })
    
    // Start the 1-minute progress bar
    startMusicProgressBar()

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

      // Add quality-focused terms to improve audio fidelity
      stylePrompt += ', high quality, studio production, clear vocals, professional mixing'

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
      console.log('=== MUSIC GENERATION API RESPONSE ===')
      console.log('result:', result)
      console.log('result.taskId:', result.taskId)
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
      console.log('Starting music status polling for task:', result.taskId)
      pollMusicStatus(result.taskId)

    } catch (error) {
      console.error('Music generation error:', error)
      
      // Clear progress bar on error
      if (musicProgressInterval) {
        clearInterval(musicProgressInterval)
        setMusicProgressInterval(null)
      }
      setMusicProgress(0)
      
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
      console.log('Music status poll result:', result)
      console.log('Result status:', result.status)
      console.log('Result audioUrl:', result.audioUrl)
      
      if (result.status === 'succeeded' && result.audioUrl) {
        // Complete the progress bar with zoom animation
        completeMusicProgressBar()
        
        setMusicStatus({
          status: 'completed',
          taskId: taskId,
          audioUrl: result.audioUrl,
          backupAudioUrl: result.backupAudioUrl,
          audioVariations: result.audioVariations,
          backupVariations: result.backupVariations,
          message: 'Music generated successfully!'
        })

        // Update song in database with audio URL, backup URL, and all variations
        const updateData: any = {
          status: 'completed',
          audio_url: result.audioUrl,
          mureka_data: {
            taskId: result.taskId,
            model: result.model,
            audioVariations: result.audioVariations,
            backupVariations: result.backupVariations,
            finishedAt: result.finishedAt
          },
          completed_at: new Date().toISOString()
        }
        
        // Add backup URL if available
        if (result.backupAudioUrl) {
          updateData.backup_audio_url = result.backupAudioUrl
        }

        console.log('Updating song in database...')
        console.log('Song ID:', songId)
        console.log('Update data:', updateData)
        
        try {
          const { data: updatedSong, error: updateError } = await supabase
            .from('songs')
            .update(updateData)
            .eq('id', songId)
            .select()
          
          console.log('Update response - data:', updatedSong)
          console.log('Update response - error:', updateError)
          
          if (updateError) {
            console.error('Error updating song with audio:', updateError)
            console.error('Update error details:', JSON.stringify(updateError, null, 2))
          } else {
            console.log('Successfully updated song with audio URL')
            console.log('Updated song data:', updatedSong)
          }
        } catch (e) {
          console.error('Exception during database update:', e)
        }

      } else if (result.status === 'failed') {
        // Clear progress bar on failure
        if (musicProgressInterval) {
          clearInterval(musicProgressInterval)
          setMusicProgressInterval(null)
        }
        setMusicProgress(0)
        
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
      
      // Clear progress bar on error
      if (musicProgressInterval) {
        clearInterval(musicProgressInterval)
        setMusicProgressInterval(null)
      }
      setMusicProgress(0)
      
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Your Generated Lyrics</h3>
                {!isEditingLyrics && (
                  <button
                    onClick={() => {
                      setIsEditingLyrics(true)
                      setEditedLyrics(generatedLyrics)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Edit Lyrics
                  </button>
                )}
              </div>
              
              {isEditingLyrics ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <textarea
                      value={editedLyrics}
                      onChange={(e) => setEditedLyrics(e.target.value)}
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none font-serif leading-relaxed text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Edit your lyrics here..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={saveLyricsEdits}
                      disabled={isSavingLyrics}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                      {isSavingLyrics ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingLyrics(false)
                        setEditedLyrics(generatedLyrics)
                      }}
                      disabled={isSavingLyrics}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <pre className="text-gray-900 whitespace-pre-wrap font-serif leading-relaxed">
                    {generatedLyrics}
                  </pre>
                </div>
              )}
              
              {generationStatus.status === 'completed' && !isEditingLyrics && (
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
                
                {/* Music Generation Progress Bar */}
                {musicStatus.status === 'generating' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Generating your music...</span>
                      <span>{Math.round(musicProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200 ease-out ${
                          showCompletionZoom ? 'animate-pulse scale-105' : ''
                        }`}
                        style={{ 
                          width: `${musicProgress}%`,
                          transform: showCompletionZoom ? 'scale(1.05)' : 'scale(1)',
                          transition: showCompletionZoom ? 'all 0.5s ease-out' : 'width 0.2s ease-out'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      This usually takes about 1 minute
                    </div>
                  </div>
                )}
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
                      {musicStatus.audioVariations.map((variation, index) => {
                        // Find corresponding backup variation
                        const backupVariation = musicStatus.backupVariations?.find(bv => bv.index === index)
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Version {index + 1}</h5>
                            <AudioWithFallback
                              primaryUrl={variation.url}
                              backupUrl={backupVariation?.backupUrl}
                              className="w-full mb-3"
                            />
                            <div className="flex space-x-3">
                              <DownloadButtonWithFallback
                                primaryUrl={variation.url}
                                backupUrl={backupVariation?.backupUrl}
                                filename={`${(songData?.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-version-${index + 1}.mp3`}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                label="Download MP3"
                              />
                              <DownloadButtonWithFallback
                                primaryUrl={variation.flacUrl}
                                backupUrl={backupVariation?.backupUrl}
                                filename={`${(songData?.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-version-${index + 1}.flac`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                label="Download FLAC (High Quality)"
                              />
                              <span className="text-sm text-gray-500 py-2">
                                Duration: {Math.floor(variation.duration / 1000 / 60)}:{String(Math.floor((variation.duration / 1000) % 60)).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <>
                      <AudioWithFallback
                        primaryUrl={musicStatus.audioUrl!}
                        backupUrl={musicStatus.backupAudioUrl}
                        className="w-full"
                      />
                      <div className="mt-4 flex space-x-4">
                        <DownloadButtonWithFallback
                          primaryUrl={musicStatus.audioUrl!}
                          backupUrl={musicStatus.backupAudioUrl}
                          filename={`${(songData?.title || 'generated-song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.mp3`}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          label="Download Song"
                        />
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

export default function GeneratingSongPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GeneratingSongPage />
    </Suspense>
  )
}