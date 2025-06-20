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
  Edit,
  RefreshCw
} from 'lucide-react'

interface Song {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionnaire_data: any
  generated_lyrics?: string
  audio_url?: string
  created_at: string
  completed_at?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      await fetchUserData(user.id)
    }

    checkAuth()
  }, [router, supabase])

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
      day: 'numeric'
    })
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
              <p className="text-gray-500 mb-4">You haven't created any songs yet</p>
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
                  <div className="flex items-center justify-between">
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
                      <Link
                        href={`/create/edit?songId=${song.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Edit and regenerate song"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      
                      {song.status === 'completed' && song.audio_url && (
                        <>
                          <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors">
                            <Play className="h-5 w-5" />
                          </button>
                          <a
                            href={song.audio_url}
                            download={`${song.title}.mp3`}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}