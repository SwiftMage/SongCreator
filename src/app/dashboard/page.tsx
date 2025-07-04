'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { SimpleErrorBoundary } from '@/components/ErrorBoundary'
import type { Profile, Song } from '@/types'
import type { User } from '@supabase/supabase-js'
import { 
  Music, 
  Plus, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Clock,
  Play,
  Square,
  Edit,
  RefreshCw,
  FileText,
  X,
  Trash2
} from 'lucide-react'
import { playAudioWithFallback, getBestAudioUrl } from '@/lib/audio-player'
import { useSecureAPI } from '@/lib/use-csrf'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'
import VersionDownloadButton from '@/components/VersionDownloadButton'

// Song interface moved to /src/types/index.ts

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showLyricsModal, setShowLyricsModal] = useState(false)
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { secureRequest } = useSecureAPI()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth')
        return
      }
      
      setUser(user)
      await fetchUserData(user!.id)
    }

    checkAuth()
  }, [router, supabase])


  // Debug CSS animations
  useEffect(() => {
    const timer = setTimeout(() => {
      const iconElement = document.querySelector('.logo-icon')
      console.log('=== CSS ANIMATION DEBUG ===')
      console.log('Logo icon element:', iconElement)
      if (iconElement) {
        const computedStyles = window.getComputedStyle(iconElement)
        console.log('Animation property:', computedStyles.animation)
        console.log('Animation name:', computedStyles.animationName)
        console.log('Animation duration:', computedStyles.animationDuration)
        console.log('All computed styles:', computedStyles)
      } else {
        console.log('ERROR: .logo-icon element not found!')
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        setCurrentAudio(null)
        setPlayingSongId(null)
      }
    }
  }, [currentAudio])

  const fetchUserData = async (userId: string) => {
    setIsLoading(true)
    
    // Fetch user's songs
    const { data: songsData, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (songsError) {
      console.error('Error fetching songs:', songsError)
    } else if (songsData) {
      console.log('Fetched songs:', songsData)
      console.log('Songs with completed status but no audio_url:')
      songsData.forEach(song => {
        if (song.status === 'completed' && !song.audio_url) {
          console.log(`- Song ID: ${song.id}, Title: ${song.title}, Status: ${song.status}, Audio URL: ${song.audio_url}`)
        }
      })
      setSongs(songsData)
    }
    
    // Fetch user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Profile should be created automatically by the database trigger
      // If it doesn't exist, redirect user to re-authenticate
      if (profileError.code === 'PGRST116') {
        console.warn('Profile not found - user needs to re-authenticate to complete profile setup')
        // Sign out the user and redirect to auth page with message
        await supabase.auth.signOut()
        router.push('/auth?message=profile_setup_required')
        return
      }
    } else if (profileData) {
      setProfile(profileData)
    }
    
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewLyrics = (song: Song) => {
    setSelectedSong(song)
    setShowLyricsModal(true)
  }

  const handlePlayStop = async (song: Song) => {
    // If this song is currently playing, stop it
    if (playingSongId === song.id && currentAudio) {
      currentAudio.pause()
      setPlayingSongId(null)
      setCurrentAudio(null)
      return
    }

    // If another song is playing, stop it first
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }

    // Start playing this song
    try {
      const bestUrl = await getBestAudioUrl(song.audio_url, song.backup_audio_url)
      if (!bestUrl) {
        throw new Error('No audio URL available')
      }

      const audio = new Audio(bestUrl)
      
      // Create event handler functions for proper cleanup
      const handleAudioEnd = () => {
        setPlayingSongId(null)
        setCurrentAudio(null)
      }

      const handleAudioError = () => {
        console.error('Error playing audio')
        setPlayingSongId(null)
        setCurrentAudio(null)
        alert('Unable to play audio. The file may be temporarily unavailable.')
      }
      
      // Cleanup previous audio instance if exists
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
        currentAudio.removeEventListener('ended', handleAudioEnd)
        currentAudio.removeEventListener('error', handleAudioError)
      }

      // Set up event listeners
      audio.addEventListener('ended', handleAudioEnd)
      audio.addEventListener('error', handleAudioError)

      // Start playing
      await audio.play()
      setPlayingSongId(song.id)
      setCurrentAudio(audio)
      
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingSongId(null)
      setCurrentAudio(null)
      alert('Unable to play audio. The file may be temporarily unavailable.')
    }
  }

  const deleteSong = async (songId: string, songTitle: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    try {
      console.log('=== DELETING SONG ===')
      console.log('Song ID:', songId)
      console.log('User ID:', user!.id)
      
      // Use secure API route to delete with CSRF protection
      const response = await secureRequest('/api/delete-song', {
        method: 'POST',
        body: JSON.stringify({ 
          songId, 
          userId: user!.id 
        })
      })
      
      const result = await response.json()
      console.log('Delete result:', result)
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete song')
      }
      
      // Refresh the songs list
      setSongs(songs.filter(song => song.id !== songId))
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="songmint-icon-only">
            <div className="logo-icon">
              <div className="music-note">♪</div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const remainingCredits = profile?.credits_remaining ?? 0
  
  // Debug logging
  console.log('Profile data:', profile)
  console.log('Remaining credits:', remainingCredits)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link 
                  href="/pricing"
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer min-h-[44px] px-2 rounded-lg"
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span className="font-medium text-sm sm:text-base">{profile?.credits_remaining || 0} Credits</span>
                </Link>
                
                {/* Subscription Status */}
                {profile?.subscription_status && profile.subscription_status !== 'free' && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/customer-portal', { method: 'POST' });
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        console.error('Error opening customer portal:', error);
                      }
                    }}
                    className="flex items-center space-x-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors min-h-[32px]"
                  >
                    <Settings className="h-3 w-3" />
                    <span className="capitalize hidden sm:inline">{profile.subscription_status}</span>
                    <span className="capitalize sm:hidden">{profile.subscription_status.charAt(0).toUpperCase()}</span>
                  </button>
                )}
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <DarkModeToggle />
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <Link 
                href="/dashboard/account"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center space-x-1 sm:space-x-2 transition-colors min-h-[44px] px-2 rounded-lg text-sm sm:text-base"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center space-x-1 sm:space-x-2 transition-colors min-h-[44px] px-2 rounded-lg text-sm sm:text-base"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome & Credits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.user_metadata?.full_name || 'Song Creator'}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Create beautiful AI-generated songs for any occasion
              </p>
            </div>
            
            <div className="text-center flex-shrink-0">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mb-1">Song Credits</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-300">
                  {remainingCredits}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-1">remaining</p>
                {/* Simple test buttons for localhost only */}
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                  <>
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/add-test-credits', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user!.id })
                        })
                        const data = await response.json()
                        alert(data.message || data.error)
                        if (data.success) window.location.reload()
                      }}
                      className="mt-2 w-full text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      Add Test Credits
                    </button>
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/remove-test-credits', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user!.id })
                        })
                        const data = await response.json()
                        alert(data.message || data.error)
                        if (data.success) window.location.reload()
                      }}
                      className="mt-1 w-full text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Remove All Credits
                    </button>
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/debug-profile')
                        const data = await response.json()
                        console.log('Debug Profile Data:', data)
                        alert(`Debug data logged to console. Check browser dev tools.`)
                      }}
                      className="mt-1 w-full text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Debug Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {remainingCredits > 0 ? (
              <Link
                href="/create"
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 sm:py-4 sm:px-8 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors min-h-[48px] touch-manipulation"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Create New Song</span>
              </Link>
            ) : (
              <div
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 sm:py-4 sm:px-8 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed min-h-[48px]"
                title="You need credits to create a new song"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Create New Song</span>
              </div>
            )}
            
            <Link
              href="/pricing"
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 sm:py-4 sm:px-8 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors min-h-[48px] touch-manipulation"
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">Buy More Credits</span>
            </Link>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Your Songs</h2>
          
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <div className="songmint-icon-only">
                <div className="logo-icon">
                  <div className="music-note">♪</div>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&apos;t created any songs yet</p>
              {remainingCredits > 0 ? (
                <Link
                  href="/create"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Song</span>
                </Link>
              ) : (
                <div className="text-center">
                  <div
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed mb-4"
                    title="You need credits to create a song"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Your First Song</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You need credits to create songs. 
                    <Link href="/pricing" className="text-purple-600 hover:underline">
                      Get credits here
                    </Link>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <SimpleErrorBoundary fallback="Unable to load songs. Please refresh the page.">
              <div className="space-y-4">
                {songs.map((song) => (
                <div key={song.id} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Desktop layout - horizontal */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {song.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center space-x-1">
                          <div className="songmint-icon-only">
                            <div className="logo-icon">
                              <div className="music-note">♪</div>
                            </div>
                          </div>
                          <span>{song.questionnaire_data?.genres?.[0] || 'No genre'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(song.created_at)}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          song.status === 'completed' ? 'bg-green-100 text-green-800' :
                          song.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          song.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {song.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {song.generated_lyrics && (
                        <button
                          onClick={() => viewLyrics(song)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="View lyrics"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                      )}
                      
                      {song.status === 'completed' && (song.audio_url || song.backup_audio_url) && (
                        <>
                          <button 
                            onClick={() => handlePlayStop(song)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title={playingSongId === song.id ? "Stop song" : "Play song"}
                          >
                            {playingSongId === song.id ? (
                              <Square className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                          <VersionDownloadButton song={song} />
                        </>
                      )}
                      
                      {song.status === 'completed' && !song.audio_url && (
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('songs')
                                .update({ status: 'processing' })
                                .eq('id', song.id)
                              
                              if (error) throw error
                              
                              // Refresh the songs list
                              await fetchUserData(user!.id)
                              alert('Song status reset to processing. You can now generate music for this song.')
                            } catch (error) {
                              console.error('Error resetting song status:', error)
                              alert('Failed to reset song status')
                            }
                          }}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Generate music for this song"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      )}
                      
                      <Link
                        href={`/create/edit?songId=${song.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Edit and regenerate song"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      
                      <button
                        onClick={() => deleteSong(song.id, song.title)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete song"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile layout - vertical */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {song.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            song.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            song.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            song.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {song.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(song.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <div className="songmint-icon-only">
                            <div className="logo-icon">
                              <div className="music-note">♪</div>
                            </div>
                          </div>
                          <span className="truncate">{song.questionnaire_data?.genres?.[0] || 'No genre'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">{formatDate(song.created_at)}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {song.generated_lyrics && (
                          <button
                            onClick={() => viewLyrics(song)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="View lyrics"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                        )}
                        
                        {song.status === 'completed' && (song.audio_url || song.backup_audio_url) && (
                          <>
                            <button 
                              onClick={() => handlePlayStop(song)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title={playingSongId === song.id ? "Stop song" : "Play song"}
                            >
                              {playingSongId === song.id ? (
                                <Square className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5" />
                              )}
                            </button>
                            <VersionDownloadButton song={song} />
                          </>
                        )}
                        
                        {song.status === 'completed' && !song.audio_url && (
                          <button
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('songs')
                                  .update({ status: 'processing' })
                                  .eq('id', song.id)
                                
                                if (error) throw error
                                
                                // Refresh the songs list
                                await fetchUserData(user!.id)
                                alert('Song status reset to processing. You can now generate music for this song.')
                              } catch (error) {
                                console.error('Error resetting song status:', error)
                                alert('Failed to reset song status')
                              }
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Generate music for this song"
                          >
                            <RefreshCw className="h-5 w-5" />
                          </button>
                        )}
                        
                        <Link
                          href={`/create/edit?songId=${song.id}`}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Edit and regenerate song"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        
                        <button
                          onClick={() => deleteSong(song.id, song.title)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </SimpleErrorBoundary>
          )}
        </div>
      </main>

      {/* Lyrics Modal */}
      {showLyricsModal && selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col mx-4 sm:mx-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{selectedSong.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Created on {formatDate(selectedSong.created_at)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLyricsModal(false)
                  setSelectedSong(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {selectedSong.generated_lyrics ? (
                <div className="space-y-4">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedSong.generated_lyrics}
                  </div>
                  
                  {/* Song Details */}
                  {selectedSong.questionnaire_data && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Song Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">About:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedSong.questionnaire_data.subjectName} ({selectedSong.questionnaire_data.subjectRelationship})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 text-gray-900 capitalize">
                            {selectedSong.questionnaire_data.songType?.replace('_', ' ')}
                          </span>
                        </div>
                        {selectedSong.questionnaire_data.genres?.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Genres:</span>
                            <span className="ml-2 text-gray-900">
                              {selectedSong.questionnaire_data.genres.join(', ')}
                            </span>
                          </div>
                        )}
                        {selectedSong.questionnaire_data.singer && (
                          <div>
                            <span className="text-gray-600">Singer:</span>
                            <span className="ml-2 text-gray-900 capitalize">
                              {selectedSong.questionnaire_data.singer} voice
                            </span>
                          </div>
                        )}
                        {selectedSong.questionnaire_data.energy && (
                          <div>
                            <span className="text-gray-600">Energy:</span>
                            <span className="ml-2 text-gray-900 capitalize">
                              {selectedSong.questionnaire_data.energy}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No lyrics generated yet</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLyricsModal(false)
                  setSelectedSong(null)
                }}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedSong.generated_lyrics && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSong.generated_lyrics!)
                    alert('Lyrics copied to clipboard!')
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Copy Lyrics
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}