'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  Music, 
  Plus, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Clock,
  Download,
  Play,
  Square,
  Edit,
  RefreshCw,
  FileText,
  X,
  Trash2
} from 'lucide-react'
import { playAudioWithFallback, getBestAudioUrl } from '@/lib/audio-player'

interface Song {
  id: string
  title: string
  song_title?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionnaire_data: any
  generated_lyrics?: string
  audio_url?: string
  backup_audio_url?: string
  created_at: string
  completed_at?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [showLyricsModal, setShowLyricsModal] = useState(false)
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth')
        return
      }
      
      setUser(user)
      await fetchUserData(user.id)
    }

    checkAuth()
  }, [router, supabase])

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
      // Create profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: user?.user_metadata?.full_name || null,
            subscription_status: 'free',
            credits_remaining: 1
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          setProfile(newProfile)
        }
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
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setPlayingSongId(null)
        setCurrentAudio(null)
      })

      audio.addEventListener('error', () => {
        console.error('Error playing audio')
        setPlayingSongId(null)
        setCurrentAudio(null)
        alert('Unable to play audio. The file may be temporarily unavailable.')
      })

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
      console.log('User ID:', user.id)
      
      // Use API route to delete with admin privileges
      const response = await fetch('/api/delete-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          songId, 
          userId: user.id 
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const remainingCredits = profile?.credits_remaining ?? 0
  
  // Debug logging
  console.log('Profile data:', profile)
  console.log('Remaining credits:', remainingCredits)

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
            
            <nav className="flex items-center space-x-4">
              <Link 
                href="/dashboard/account"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Credits Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.user_metadata?.full_name || 'Music Creator'}!
              </h1>
              <p className="text-gray-600">
                Create beautiful AI-generated songs for any occasion
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Song Credits</p>
                <p className="text-3xl font-bold text-purple-900">
                  {remainingCredits}
                </p>
                <p className="text-sm text-purple-600 mt-1">remaining</p>
                {/* Temporary button for testing - always show for now */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/add-test-credits', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId: user.id })
                      })
                      const data = await response.json()
                      if (data.success) {
                        alert(data.message)
                        window.location.reload()
                      } else {
                        alert(data.error || 'Failed to add test credits')
                      }
                    } catch (error) {
                      console.error('Error adding credits:', error)
                      alert('Failed to add test credits')
                    }
                  }}
                  className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  Add Test Credits
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/create"
              className={`flex-1 flex items-center justify-center space-x-2 px-8 py-4 rounded-lg font-semibold transition-colors ${
                remainingCredits > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>Create New Song</span>
            </Link>
            
            <Link
              href="/pricing"
              className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Buy More Credits</span>
            </Link>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Songs</h2>
          
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven&apos;t created any songs yet</p>
              <Link
                href="/create"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Song</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => (
                <div key={song.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Desktop layout - horizontal */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {song.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Music className="h-4 w-4" />
                          <span>{song.questionnaire_data?.genre || 'Unknown'}</span>
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
                          <button
                            onClick={async () => {
                              console.log('=== DASHBOARD DOWNLOAD BUTTON CLICKED ===')
                              try {
                                console.log('=== DOWNLOAD DEBUG ===')
                                console.log('Raw song object:', song)
                                console.log('song.title:', song.title)
                                console.log('song.song_title:', song.song_title)
                                console.log('typeof song.title:', typeof song.title)
                                
                                const bestUrl = await getBestAudioUrl(song.audio_url, song.backup_audio_url)
                                if (bestUrl) {
                                  // Use the original title and clean it for filename
                                  const cleanTitle = song.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
                                  const filename = `${cleanTitle}.mp3`
                                  console.log('Clean title:', cleanTitle)
                                  console.log('Final filename:', filename)
                                  
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
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Download song"
                          >
                            <Download className="h-5 w-5" />
                          </button>
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
                              await fetchUserData(user.id)
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {song.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Music className="h-4 w-4" />
                          <span className="truncate">{song.questionnaire_data?.genre || 'Unknown'}</span>
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
                            <button
                              onClick={async () => {
                                console.log('=== DASHBOARD DOWNLOAD BUTTON CLICKED ===')
                                try {
                                  console.log('=== DOWNLOAD DEBUG ===')
                                  console.log('Raw song object:', song)
                                  console.log('song.title:', song.title)
                                  console.log('song.song_title:', song.song_title)
                                  console.log('typeof song.title:', typeof song.title)
                                  
                                  const bestUrl = await getBestAudioUrl(song.audio_url, song.backup_audio_url)
                                  if (bestUrl) {
                                    // Use the original title and clean it for filename
                                    const cleanTitle = song.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
                                    const filename = `${cleanTitle}.mp3`
                                    console.log('Clean title:', cleanTitle)
                                    console.log('Final filename:', filename)
                                    
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
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Download song"
                            >
                              <Download className="h-5 w-5" />
                            </button>
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
                                await fetchUserData(user.id)
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
          )}
        </div>
      </main>

      {/* Lyrics Modal */}
      {showLyricsModal && selectedSong && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSong.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
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
                            {selectedSong.questionnaire_data.subjectName} ({selectedSong.questionnaire_data.relationship})
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
                              {[...selectedSong.questionnaire_data.genres, ...(selectedSong.questionnaire_data.customGenres || [])].join(', ')}
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