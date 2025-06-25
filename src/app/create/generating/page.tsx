'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Music, ArrowLeft, Check, Loader2, Volume2, Download, Share2, RefreshCw, FileText, Settings, RotateCcw, ShoppingCart, AlertCircle } from 'lucide-react'
import { getBestAudioUrl } from '@/lib/audio-player'
import Logo from '@/components/Logo'

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
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Music generation state
  const [musicStatus, setMusicStatus] = useState<MusicGenerationStatus>({
    status: 'idle',
    message: 'Ready to generate music'
  })
  const [musicApiRequest, setMusicApiRequest] = useState('')
  const [musicApiResponse, setMusicApiResponse] = useState('')
  const [songData, setSongData] = useState<any>(null)
  const [hasGeneratedMusic, setHasGeneratedMusic] = useState(false)
  
  // Debug mode state
  const [debugMode, setDebugMode] = useState(false)
  const [customModel, setCustomModel] = useState('')
  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [isCheckingTasks, setIsCheckingTasks] = useState(false)
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Music progress bar state
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicProgressInterval, setMusicProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [showCompletionZoom, setShowCompletionZoom] = useState(false)
  const [pollTimeoutId, setPollTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [pollStartTime, setPollStartTime] = useState<number | null>(null)
  
  // Issue reporting state
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueDescription, setIssueDescription] = useState('')
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  
  // Social sharing modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareText, setShareText] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  
  // Error details state
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [errorDetails, setErrorDetails] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Use refs to persist intervals across re-renders
  const musicProgressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      setIsClient(true)
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth')
        return
      }
      
      setUser(user)
      
      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else if (profileData) {
        setProfile(profileData)
      }
      
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
    }
    
    initializePage()
  }, [searchParams, router, supabase])

  // Cleanup music progress interval and polling on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting - clearing intervals')
      if (musicProgressIntervalRef.current) {
        clearInterval(musicProgressIntervalRef.current)
        musicProgressIntervalRef.current = null
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [])
  
  // Debug: Track music progress interval changes
  useEffect(() => {
    console.log('Music progress interval changed:', musicProgressInterval ? 'SET' : 'CLEARED')
  }, [musicProgressInterval])
  
  // Function to test Mureka connection
  const testMurekaConnection = async () => {
    console.log('=== TEST CONNECTION CLICKED ===')
    setIsTestingConnection(true)
    try {
      console.log('Making request to /api/test-mureka-connection')
      const response = await fetch('/api/test-mureka-connection')
      console.log('Response status:', response.status)
      if (response.ok) {
        const result = await response.json()
        console.log('Connection test result:', result)
        setConnectionTest(result)
      } else {
        console.error('Failed to test connection, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setConnectionTest({
          connected: false,
          statusCode: response.status,
          error: errorText,
          apiKeyConfigured: false
        })
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionTest({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeyConfigured: false
      })
    }
    setIsTestingConnection(false)
    console.log('=== TEST CONNECTION FINISHED ===')
  }

  // Function to check for active Mureka tasks
  const checkActiveTasks = async () => {
    console.log('=== CHECK ACTIVE TASKS CLICKED ===')
    setIsCheckingTasks(true)
    try {
      console.log('Making request to /api/list-mureka-tasks')
      const response = await fetch('/api/list-mureka-tasks')
      console.log('Response status:', response.status)
      if (response.ok) {
        const result = await response.json()
        console.log('Active tasks result:', result)
        setActiveTasks(result.activeTasks || [])
      } else {
        console.error('Failed to check active tasks, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        alert(`Error: Failed to check active tasks (status: ${response.status}). Check console for details.`)
      }
    } catch (error) {
      console.error('Error checking active tasks:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`)
    }
    setIsCheckingTasks(false)
    console.log('=== CHECK ACTIVE TASKS FINISHED ===')
  }

  // Function to cancel music generation
  const cancelMusicGeneration = () => {
    console.log('Cancelling music generation - clearing progress bar')
    // Clear polling timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
      setPollTimeoutId(null)
    }
    
    // Clear progress interval
    if (musicProgressIntervalRef.current) {
      clearInterval(musicProgressIntervalRef.current)
      musicProgressIntervalRef.current = null
      setMusicProgressInterval(null)
    }
    
    // Reset states
    setMusicProgress(0)
    setPollStartTime(null)
    setMusicStatus({
      status: 'idle',
      message: 'Generation cancelled'
    })
    
    // Also check for any remaining active tasks
    checkActiveTasks()
  }

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
    // Clear any existing interval first
    if (musicProgressIntervalRef.current) {
      console.log('Clearing existing progress interval')
      clearInterval(musicProgressIntervalRef.current)
      musicProgressIntervalRef.current = null
    }
    
    // Reset progress state
    setMusicProgress(0)
    setShowCompletionZoom(false)
    
    console.log('Starting music progress bar - progress reset to 0')
    
    // Start progress bar that fills over 60 seconds
    const interval = setInterval(() => {
      setMusicProgress(prev => {
        const increment = 100 / (60 * 10) // 60 seconds, update every 100ms
        const newProgress = Math.min(prev + increment, 95) // Stop at 95% until completion
        if (newProgress % 5 < 0.2) { // Log every 5% to avoid spam
          console.log(`Progress bar update: ${prev.toFixed(1)}% -> ${newProgress.toFixed(1)}%`)
        }
        return newProgress
      })
    }, 100)
    
    console.log('Progress bar interval created:', interval)
    musicProgressIntervalRef.current = interval
    setMusicProgressInterval(interval) // Keep state for UI reactivity
  }

  const completeMusicProgressBar = () => {
    console.log('Completing music progress bar')
    if (musicProgressIntervalRef.current) {
      console.log('Clearing progress interval for completion')
      clearInterval(musicProgressIntervalRef.current)
      musicProgressIntervalRef.current = null
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

  const generateMusicTest = async () => {
    console.log('=== TEST GENERATE MUSIC CLICKED ===')
    console.log('Debug Mode:', debugMode)
    console.log('Custom Model:', customModel)
    
    if (!generatedLyrics || !songData) {
      setError('No lyrics available for music generation')
      return
    }

    setMusicStatus({
      status: 'generating',
      message: 'Generating test music...'
    })
    
    // Start the 1-minute progress bar
    startMusicProgressBar()

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Complete the progress bar with zoom animation
      completeMusicProgressBar()
      
      // Use a simple HTML5 audio data URL with a minimal WAV file
      // This is a minimal 1-second silence WAV file for testing
      const dummyAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYe'
      const dummyBackupUrl = dummyAudioUrl // Same for backup in demo
      
      setMusicStatus({
        status: 'completed',
        taskId: 'test-task-123',
        audioUrl: dummyAudioUrl,
        backupAudioUrl: dummyBackupUrl,
        audioVariations: [
          {
            index: 0,
            url: dummyAudioUrl,
            flacUrl: dummyBackupUrl,
            duration: 30000, // 30 seconds
            lyricsWithTimings: null
          },
          {
            index: 1,
            url: dummyBackupUrl,
            flacUrl: dummyAudioUrl,
            duration: 25000, // 25 seconds
            lyricsWithTimings: null
          }
        ],
        backupVariations: [
          {
            index: 0,
            backupUrl: dummyBackupUrl,
            originalUrl: dummyAudioUrl
          },
          {
            index: 1,
            backupUrl: dummyAudioUrl,
            originalUrl: dummyBackupUrl
          }
        ],
        message: 'Test music generated successfully!'
      })
      
      // Mark that music has been generated
      setHasGeneratedMusic(true)

      // Update song in database with dummy data
      const updateData = {
        status: 'completed',
        audio_url: dummyAudioUrl,
        backup_audio_url: dummyBackupUrl,
        mureka_data: {
          taskId: 'test-task-123',
          model: debugMode && customModel ? customModel : 'test-model',
          audioVariations: [
            {
              index: 0,
              url: dummyAudioUrl,
              flacUrl: dummyBackupUrl,
              duration: 30000
            },
            {
              index: 1,
              url: dummyBackupUrl,
              flacUrl: dummyAudioUrl,
              duration: 25000
            }
          ],
          finishedAt: new Date().toISOString()
        },
        completed_at: new Date().toISOString()
      }
      
      console.log('Updating song in database with test data...')
      
      try {
        const { data: updatedSong, error: updateError } = await supabase
          .from('songs')
          .update(updateData)
          .eq('id', songId)
          .select()
        
        if (updateError) {
          console.error('Error updating song with test audio:', updateError)
        } else {
          console.log('Successfully updated song with test audio URL')
        }
      } catch (e) {
        console.error('Exception during test database update:', e)
      }

    } catch (error) {
      console.error('Test music generation error:', error)
      
      // Clear progress bar on error
      if (musicProgressIntervalRef.current) {
        clearInterval(musicProgressIntervalRef.current)
        musicProgressIntervalRef.current = null
        setMusicProgressInterval(null)
      }
      setMusicProgress(0)
      
      setMusicStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate test music'
      })
    }
  }

  const submitIssueReport = async () => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue you encountered')
      return
    }

    setIsSubmittingIssue(true)
    
    try {
      const songUrl = `${window.location.origin}/create/generating?songId=${songId}`
      
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          songUrl,
          issueDescription: issueDescription.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send report')
      }

      alert('Thank you for your report! We will review it and contact you via email if we need more information.')
      setShowIssueModal(false)
      setIssueDescription('')
      
    } catch (error) {
      console.error('Error submitting issue report:', error)
      alert('Failed to send the report. Please try again or email us directly at appspire@icloud.com')
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  const generateMusic = async () => {
    console.log('=== GENERATE MUSIC CLICKED ===')
    console.log('generatedLyrics:', !!generatedLyrics)
    console.log('songData:', !!songData)
    
    if (!generatedLyrics || !songData) {
      setError('No lyrics available for music generation')
      return
    }

    // Check for active tasks before starting
    await checkActiveTasks()
    const stuckTasks = activeTasks.filter(task => task.status === 'preparing')
    if (stuckTasks.length > 0) {
      const proceed = confirm(
        `⚠️ Found ${stuckTasks.length} task(s) stuck in "preparing" status. This may cause rate limit errors.\n\n` +
        `Do you want to proceed anyway? If you get a rate limit error, please wait 5-10 minutes before trying again.`
      )
      if (!proceed) {
        return
      }
    }

    // Clear any existing polling state before starting
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
      setPollTimeoutId(null)
    }
    setPollStartTime(null) // Reset poll start time

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

      const musicRequest = {
        lyrics: generatedLyrics,
        songId: songId,
        style: stylePrompt,
        ...(debugMode && customModel.trim() ? { model: customModel.trim() } : {})
      }
      
      // Log what we're sending for debugging
      console.log('=== MUSIC REQUEST DEBUG ===')
      console.log('Debug Mode:', debugMode)
      console.log('Custom Model:', customModel)
      console.log('Final Request:', musicRequest)

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
      const startTime = Date.now()
      setPollStartTime(startTime)
      console.log('Poll start time set to:', new Date(startTime).toISOString())
      pollMusicStatus(result.taskId)

    } catch (error) {
      console.error('Music generation error:', error)
      
      // Clear progress bar on error
      console.log('Clearing progress bar due to music generation error')
      if (musicProgressIntervalRef.current) {
        clearInterval(musicProgressIntervalRef.current)
        musicProgressIntervalRef.current = null
        setMusicProgressInterval(null)
      }
      setMusicProgress(0)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate music'
      setMusicStatus({
        status: 'error',
        message: errorMessage
      })
      
      // Store error details for expandable view
      setErrorDetails({
        type: 'Music Generation Error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      })
    }
  }

  const pollMusicStatus = async (taskId: string) => {
    try {
      // Check if polling has been running for more than 5 minutes (300,000ms)
      if (pollStartTime && Date.now() - pollStartTime > 300000) {
        const elapsed = Math.round((Date.now() - pollStartTime) / 1000)
        console.log(`Polling timeout reached (${elapsed} seconds), cancelling request`)
        cancelMusicGeneration()
        const timeoutMessage = 'Music generation timed out. Please try again.'
        setMusicStatus({
          status: 'error',
          message: timeoutMessage
        })
        
        // Store timeout error details
        setErrorDetails({
          type: 'Generation Timeout',
          message: timeoutMessage,
          timestamp: new Date().toISOString(),
          details: {
            taskId: taskId,
            elapsedSeconds: elapsed,
            maxTimeout: 300,
            reason: 'Polling exceeded 5 minute limit'
          }
        })
        return
      }

      // Log current polling status
      if (pollStartTime) {
        const elapsed = Math.round((Date.now() - pollStartTime) / 1000)
        console.log(`Polling music status for task ${taskId} (${elapsed}s elapsed)`)
      }

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
        // Clear timeout since we're successful
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current)
          pollTimeoutRef.current = null
          setPollTimeoutId(null)
        }
        
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
        
        // Mark that music has been generated
        setHasGeneratedMusic(true)

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
        console.log('Music generation failed, clearing progress bar')
        // Clear progress bar on failure
        if (musicProgressIntervalRef.current) {
          clearInterval(musicProgressIntervalRef.current)
          musicProgressIntervalRef.current = null
          setMusicProgressInterval(null)
        }
        setMusicProgress(0)
        
        // Clear timeout
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current)
          pollTimeoutRef.current = null
          setPollTimeoutId(null)
        }
        
        const failedMessage = 'Music generation failed'
        setMusicStatus({
          status: 'error',
          message: failedMessage
        })
        
        // Store failed status error details
        setErrorDetails({
          type: 'Generation Failed',
          message: failedMessage,
          timestamp: new Date().toISOString(),
          details: {
            taskId: taskId,
            status: result.status,
            response: sanitizeErrorDetails(result)
          }
        })
      } else {
        // Still processing, poll again in 5 seconds
        const timeoutId = setTimeout(() => pollMusicStatus(taskId), 5000)
        pollTimeoutRef.current = timeoutId
        setPollTimeoutId(timeoutId)
      }

    } catch (error) {
      console.error('Error polling music status:', error)
      
      // Clear progress bar on error
      console.log('Clearing progress bar due to polling error')
      if (musicProgressIntervalRef.current) {
        clearInterval(musicProgressIntervalRef.current)
        musicProgressIntervalRef.current = null
        setMusicProgressInterval(null)
      }
      setMusicProgress(0)
      
      const pollingErrorMessage = 'Failed to check music generation status'
      setMusicStatus({
        status: 'error',
        message: pollingErrorMessage
      })
      
      // Store polling error details
      setErrorDetails({
        type: 'Polling Error',
        message: pollingErrorMessage,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        details: {
          taskId: taskId,
          context: 'Error occurred while checking music generation status'
        }
      })
    }
  }

  // Function to sanitize error details by removing sensitive information
  const sanitizeErrorDetails = (details: any) => {
    if (!details) return details
    
    const sanitized = JSON.parse(JSON.stringify(details)) // Deep clone
    
    // Function to recursively sanitize object
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove URLs
        obj = obj.replace(/https?:\/\/[^\s]+/g, '[URL_REDACTED]')
        // Remove API keys (common patterns)
        obj = obj.replace(/(?:key|token|secret|password)[=:]\s*[A-Za-z0-9+/=]{10,}/gi, '[API_KEY_REDACTED]')
        // Remove bearer tokens
        obj = obj.replace(/Bearer\s+[A-Za-z0-9+/=]{10,}/gi, 'Bearer [TOKEN_REDACTED]')
        return obj
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      }
      
      if (obj && typeof obj === 'object') {
        const sanitizedObj: any = {}
        for (const [key, value] of Object.entries(obj)) {
          // Skip sensitive keys entirely
          if (/(?:key|token|secret|password|authorization)/i.test(key)) {
            sanitizedObj[key] = '[REDACTED]'
          } else {
            sanitizedObj[key] = sanitizeObject(value)
          }
        }
        return sanitizedObj
      }
      
      return obj
    }
    
    return sanitizeObject(sanitized)
  }

  // Social sharing functions
  const openShareModal = (platform: string) => {
    const baseText = `🎶 I just made a custom song using Song Mint — and it SLAPS.
Written with my stories, my vibe, my people.
Check it out 🔥👇

👉 ${window.location.origin}
🧠 Powered by AI. 🎤 Made by me.

#SongMint #CustomSong #AIgenerated #PersonalAnthem #OriginalMusic #BuiltWithAI #SongwriterVibes`
    
    setShareText(baseText)
    setShareUrl(platform === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}` : 
                platform === 'twitter' ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(baseText)}` : 
                'https://www.instagram.com/')
    setShowShareModal(true)
  }

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      alert('Share text copied to clipboard!')
    } catch (err) {
      alert('Failed to copy text. Please copy it manually.')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/pricing"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{profile?.credits_remaining || 0} Credits</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white flex items-center space-x-2 transition-colors"
                disabled={generationStatus.status === 'generating'}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {generationStatus.status === 'completed' ? 'Your Song is Ready!' : 'Generating Your Song'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {generationStatus.status === 'completed' 
                ? 'Your personalized song has been created successfully!' 
                : 'Please wait while we create your personalized song...'}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-4 mb-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{generationStatus.message}</h3>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
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
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-8">
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
          {debugMode && requestString && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Debug: AI Request</h3>
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg p-4">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {requestString}
                </pre>
              </div>
            </div>
          )}

          {/* Debug Toggle */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-8">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              {debugMode ? '🔧 Hide Debug Controls' : '🔧 Show Debug Controls'}
            </button>
          </div>

          {/* Debug Section - Only show when debugMode is true */}
          {debugMode && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-yellow-800 mb-4">🔧 Debug & Diagnostics</h3>
                <div className="space-y-3">
                  <button
                    onClick={checkActiveTasks}
                    disabled={isCheckingTasks}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isCheckingTasks ? '🔄 Checking Active Tasks...' : '🔍 Check Active Tasks'}
                  </button>
                  <button
                    onClick={testMurekaConnection}
                    disabled={isTestingConnection}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isTestingConnection ? '🔄 Testing Connection...' : '🔌 Test Connection'}
                  </button>
                  <button
                    onClick={cancelMusicGeneration}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    🛑 Stop All Requests
                  </button>
                </div>
              </div>

              {/* Debug: Custom Model Input */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-blue-800 mb-4">🎛️ Advanced Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Model (optional)
                    </label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g., mureka-v3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default model
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Debug Results - Only show when debugMode is true */}
          {debugMode && (
            <>
              {/* Active Tasks Results */}
              {isClient && activeTasks.length > 0 && (
                <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-bold text-yellow-800 mb-4">Active Tasks Found</h3>
                  <div className="space-y-3">
                    {activeTasks.map((task, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Task ID:</strong> {task.taskId}</div>
                          <div><strong>Status:</strong> {task.status}</div>
                          <div><strong>Model:</strong> {task.model}</div>
                          <div><strong>Created:</strong> {new Date(task.murekaCreatedAt).toLocaleString()}</div>
                        </div>
                        {task.status === 'preparing' && (
                          <div className="text-red-600 font-medium mt-2">⚠️ This task appears stuck</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Test Results */}
              {isClient && connectionTest && (
                <div className={`rounded-lg p-6 mb-8 ${connectionTest.connected ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${connectionTest.connected ? 'text-green-800' : 'text-red-800'}`}>
                    Connection Test Results
                  </h3>
                  <div className="space-y-2 text-black">
                    <div><strong>Status:</strong> {connectionTest.connected ? '✅ Connected' : '❌ Failed'}</div>
                    <div><strong>Response Code:</strong> {connectionTest.statusCode}</div>
                    <div><strong>API Key:</strong> {connectionTest.apiKeyConfigured ? 'Configured' : 'Missing'}</div>
                    {connectionTest.error && (
                      <div><strong>Error:</strong> {connectionTest.error}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Generated Lyrics */}
          {generatedLyrics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Generated Lyrics</h3>
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
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <textarea
                      value={editedLyrics}
                      onChange={(e) => setEditedLyrics(e.target.value)}
                      className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-serif leading-relaxed text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
                  <pre className="text-gray-900 dark:text-white whitespace-pre-wrap font-serif leading-relaxed">
                    {generatedLyrics}
                  </pre>
                </div>
              )}
              
              {generationStatus.status === 'completed' && !isEditingLyrics && (
                <div className="mt-6 flex space-x-4 flex-wrap">
                  <button
                    onClick={() => {
                      if (hasGeneratedMusic) {
                        if (confirm('This will cost 1 credit to regenerate the music. Continue?')) {
                          generateMusic()
                        }
                      } else {
                        generateMusic()
                      }
                    }}
                    disabled={musicStatus.status === 'generating'}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    <Volume2 className="h-5 w-5 inline mr-2" />
                    {musicStatus.status === 'generating' ? 'Generating Music...' : hasGeneratedMusic ? 'Regenerate Music (1 credit)' : 'Generate Music'}
                  </button>
                  <button
                    onClick={() => {
                      if (hasGeneratedMusic) {
                        if (confirm('This will cost 1 credit to regenerate the test music. Continue?')) {
                          generateMusicTest()
                        }
                      } else {
                        generateMusicTest()
                      }
                    }}
                    disabled={musicStatus.status === 'generating'}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    <Volume2 className="h-5 w-5 inline mr-2" />
                    {musicStatus.status === 'generating' ? 'Generating Test...' : hasGeneratedMusic ? 'Test Regenerate (1 credit)' : 'Test Generate (Demo)'}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Music Generation</h3>
              
              {/* Music Status */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  {musicStatus.status === 'generating' && <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />}
                  {musicStatus.status === 'completed' && <Check className="h-6 w-6 text-green-600" />}
                  {musicStatus.status === 'error' && <div className="h-6 w-6 rounded-full bg-red-600" />}
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{musicStatus.message}</span>
                </div>
                
                {/* Music Generation Progress Bar */}
                {musicStatus.status === 'generating' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Generating your music...</span>
                      <span>{Math.round(musicProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
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
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Your Generated Song{musicStatus.audioVariations && musicStatus.audioVariations.length > 1 ? 's' : ''}
                  </h4>
                  
                  {musicStatus.audioVariations && musicStatus.audioVariations.length > 1 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Mureka generated {musicStatus.audioVariations.length} variations of your song. Listen to each one and download your favorite!
                      </p>
                      {musicStatus.audioVariations.map((variation, index) => {
                        // Find corresponding backup variation
                        const backupVariation = musicStatus.backupVariations?.find(bv => bv.index === index)
                        
                        return (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Version {index + 1}</h5>
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
              {debugMode && musicApiRequest && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Debug: Mureka API Request</h4>
                  <div className="bg-gray-100 border rounded-lg p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {musicApiRequest}
                    </pre>
                  </div>
                </div>
              )}

              {/* Debug: Music API Response */}
              {debugMode && musicApiResponse && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Debug: Mureka API Response</h4>
                  <div className="bg-gray-100 border rounded-lg p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {musicApiResponse}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Details Section - Shows when there's an error with details */}
          {musicStatus.status === 'error' && errorDetails && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-red-800 mb-2">Music Generation Error</h4>
                  <p className="text-red-700 mb-4">{musicStatus.message}</p>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-800">Error Details</span>
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <span>{showErrorDetails ? 'Hide' : 'Show'} Details</span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    {showErrorDetails && (
                      <div className="mt-3">
                        <div className="text-xs text-red-600 mb-2">
                          Error Type: {errorDetails.type} | Time: {new Date(errorDetails.timestamp).toLocaleString()}
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            {JSON.stringify(sanitizeErrorDetails(errorDetails), null, 2)}
                          </pre>
                        </div>
                        <div className="mt-2 text-xs text-red-600">
                          * Sensitive information (URLs, API keys) has been redacted for security
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => {
                        setErrorDetails(null)
                        setShowErrorDetails(false)
                        generateMusic()
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Try Again</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(sanitizeErrorDetails(errorDetails), null, 2))
                        alert('Error details copied to clipboard!')
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Love Your Song Section - Shows after music is completed */}
          {musicStatus.status === 'completed' && musicStatus.audioUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">💖 Love your song?</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Download Options */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Download className="h-6 w-6 text-green-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Download Your Song</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Get your song in high quality to keep forever</p>
                  
                  {musicStatus.audioVariations && musicStatus.audioVariations.length > 1 ? (
                    <div className="space-y-2">
                      {musicStatus.audioVariations.map((variation, index) => {
                        const backupVariation = musicStatus.backupVariations?.find(bv => bv.index === index)
                        return (
                          <div key={index} className="flex space-x-2">
                            <DownloadButtonWithFallback
                              primaryUrl={variation.url}
                              backupUrl={backupVariation?.backupUrl}
                              filename={`${(songData?.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-version-${index + 1}.mp3`}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                              label={`Download Version ${index + 1} (MP3)`}
                            />
                            <DownloadButtonWithFallback
                              primaryUrl={variation.flacUrl}
                              backupUrl={backupVariation?.backupUrl}
                              filename={`${(songData?.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-version-${index + 1}.flac`}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                              label={`FLAC ${index + 1}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <DownloadButtonWithFallback
                        primaryUrl={musicStatus.audioUrl!}
                        backupUrl={musicStatus.backupAudioUrl}
                        filename={`${(songData?.title || 'song').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.mp3`}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        label="Download MP3"
                      />
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Download FLAC
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Social Sharing Options */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Share2 className="h-6 w-6 text-blue-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Share Your Creation</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Let the world hear your amazing song!</p>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => openShareModal('facebook')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <img src="/images/Facebook_Logo_Primary.png" alt="Facebook" className="w-5 h-5" />
                      <span>Share on Facebook</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        const text = encodeURIComponent(`🎶 I just made a custom song using Song Mint — and it SLAPS.
Written with my stories, my vibe, my people.
Check it out 🔥👇

👉 ${window.location.origin}
🧠 Powered by AI. 🎤 Made by me.

#SongMint #CustomSong #AIgenerated #PersonalAnthem #OriginalMusic #BuiltWithAI #SongwriterVibes`)
                        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
                      }}
                      className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>Share on X (Twitter)</span>
                    </button>
                    
                    <button 
                      onClick={() => openShareModal('instagram')}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Share on Instagram</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Check out my personalized song!',
                            text: '🎵 I just created an amazing personalized song with Song Mint!',
                            url: window.location.origin
                          })
                        } else {
                          // Fallback - copy to clipboard
                          navigator.clipboard.writeText(`🎵 I just created an amazing personalized song with Song Mint! Check it out: ${window.location.origin}`)
                          alert('Link copied to clipboard!')
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>More options...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Not Loving Your Song Section - Shows after music is completed */}
          {musicStatus.status === 'completed' && musicStatus.audioUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">🤔 Not loving the song?</h3>
              
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
                  No worries! You can make changes to get the perfect song. Each option costs <strong>1 credit</strong>.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Regenerate Song */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center shadow-sm">
                    <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Regenerate Song</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate a new version with the same settings</p>
                    <button 
                      onClick={() => {
                        if (confirm('This will cost 1 credit to regenerate the song with the same settings. Continue?')) {
                          generateMusic()
                        }
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Regenerate (1 credit)
                    </button>
                  </div>
                  
                  {/* Change Lyrics */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center shadow-sm">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Change Lyrics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how to handle the lyrics for your song</p>
                    <button 
                      onClick={() => {
                        if (confirm('This will cost 1 credit to change the lyrics. You will be taken to the lyrics selection page. Continue?')) {
                          // Navigate to edit page step 3 - "How would you like to handle the lyrics?"
                          const url = new URL(`${window.location.origin}/create/edit`)
                          url.searchParams.set('songId', songId!)
                          url.searchParams.set('step', '3')
                          router.push(url.toString())
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Change Lyrics (1 credit)
                    </button>
                  </div>
                  
                  {/* Change Description */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 text-center shadow-sm">
                    <Settings className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Change Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Modify the song details and attributes</p>
                    <button 
                      onClick={() => {
                        if (confirm('This will cost 1 credit to change the song description. You will be taken to the details page. Continue?')) {
                          // Navigate to create page with step 4 (details) and songId for editing
                          router.push(`/create/edit?songId=${songId}&step=4`)
                        }
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Change Description (1 credit)
                    </button>
                  </div>
                </div>
                
                {/* Start Over Option */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <RotateCcw className="h-8 w-8 text-gray-600 dark:text-gray-400 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Start Over</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create a completely new song from scratch</p>
                    <button 
                      onClick={() => {
                        if (confirm('This will cost 1 credit to create a new song. You will be taken to the beginning of the song creation process. Continue?')) {
                          router.push('/create')
                        }
                      }}
                      className="px-6 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Start Over (1 credit)
                    </button>
                  </div>
                </div>
                
                {/* Report Issue Option */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Something went wrong?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Report an issue with your song generation</p>
                    <button 
                      onClick={() => setShowIssueModal(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Return to Dashboard Section - Shows after music is completed */}
          {musicStatus.status === 'completed' && musicStatus.audioUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎵 All done?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your song is ready! You can always come back to listen, download, or make changes later.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <div className="songmint-icon-only">
                      <div className="logo-icon">
                        <div className="music-note">♪</div>
                      </div>
                    </div>
                    <span>View All My Songs</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/create')}
                    className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>✨</span>
                    <span>Create Another Song</span>
                  </button>
                </div>
              </div>
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

      {/* Social Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Your Song</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share text:
              </label>
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none text-sm text-gray-900 dark:text-white"
                placeholder="Edit your share text..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={copyShareText}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Text</span>
              </button>
              
              <button
                onClick={() => {
                  window.open(shareUrl, '_blank')
                  setShowShareModal(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open & Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Report Modal */}
      {showIssueModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report an Issue</h3>
              <button
                onClick={() => {
                  setShowIssueModal(false)
                  setIssueDescription('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please describe what went wrong with your song generation. We'll review your report and contact you via email.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What went wrong?
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none text-sm text-gray-900 dark:text-white"
                placeholder="e.g., The song doesn't match my description, audio quality issues, wrong genre, etc."
                disabled={isSubmittingIssue}
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">
                Your email and song details will be automatically included in the report.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={submitIssueReport}
                disabled={isSubmittingIssue || !issueDescription.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingIssue ? 'Sending...' : 'Send Report'}
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false)
                  setIssueDescription('')
                }}
                disabled={isSubmittingIssue}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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