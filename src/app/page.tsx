'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase';
import Logo from '@/components/Logo';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Heart, Gift, Users, LogOut, User, Music, Sparkles, Zap, Shield, ArrowRight, Check, Play, Pause, SkipForward, SkipBack, X, ChevronLeft, ChevronRight } from "lucide-react";

// Mock demo songs data
const demoSongs = [
  {
    id: 1,
    title: "Birthday Surprise",
    artist: "Song Mint AI",
    genre: "Pop",
    occasion: "Birthday",
    audioUrl: "/demo-songs/birthday-surprise.mp3",
    image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300&h=300&fit=crop&crop=center",
    duration: "2:45"
  },
  {
    id: 2,
    title: "Forever Yours",
    artist: "Song Mint AI",
    genre: "Romantic",
    occasion: "Anniversary",
    audioUrl: "/demo-songs/forever-yours.mp3",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop&crop=center",
    duration: "3:12"
  },
  {
    id: 3,
    title: "Friend Like You",
    artist: "Song Mint AI",
    genre: "Folk",
    occasion: "Friendship",
    audioUrl: "/demo-songs/friend-like-you.mp3",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center",
    duration: "2:58"
  },
  {
    id: 4,
    title: "Graduation Day",
    artist: "Song Mint AI",
    genre: "Upbeat",
    occasion: "Celebration",
    audioUrl: "/demo-songs/graduation-day.mp3",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&h=300&fit=crop&crop=center",
    duration: "3:24"
  },
  {
    id: 5,
    title: "Mom's Love",
    artist: "Song Mint AI",
    genre: "Country",
    occasion: "Mother's Day",
    audioUrl: "/demo-songs/moms-love.mp3",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop&crop=center",
    duration: "2:36"
  },
  {
    id: 6,
    title: "Wedding Waltz",
    artist: "Song Mint AI",
    genre: "Classical",
    occasion: "Wedding",
    audioUrl: "/demo-songs/wedding-waltz.mp3",
    image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300&h=300&fit=crop&crop=center",
    duration: "4:15"
  },
  {
    id: 7,
    title: "My Hero Dad",
    artist: "Song Mint AI",
    genre: "Rock",
    occasion: "Father's Day",
    audioUrl: "/demo-songs/my-hero-dad.mp3",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=center",
    duration: "3:08"
  }
]

export default function Home() {
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string }, email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDemoPlayer, setShowDemoPlayer] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    checkAuth()
  }, [supabase])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [])

  // Audio management
  useEffect(() => {
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime)
      const updateDuration = () => setDuration(audio.duration)
      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        // Auto-advance to next song
        if (currentSongIndex < demoSongs.length - 1) {
          setTimeout(() => playNextSong(), 1000)
        }
      }

      audio.addEventListener('timeupdate', updateTime)
      audio.addEventListener('loadedmetadata', updateDuration)
      audio.addEventListener('ended', handleEnded)

      return () => {
        audio.removeEventListener('timeupdate', updateTime)
        audio.removeEventListener('loadedmetadata', updateDuration)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [audio, currentSongIndex])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const openDemoPlayer = () => {
    setShowDemoPlayer(true)
    // Start playing the first song automatically
    setTimeout(() => {
      playAudio(0)
    }, 300) // Small delay for animation
  }

  const closeDemoPlayer = () => {
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    setShowDemoPlayer(false)
  }

  const playAudio = (index: number) => {
    if (audio) {
      audio.pause()
    }

    const newAudio = new Audio(demoSongs[index].audioUrl)
    newAudio.volume = 0.7
    
    newAudio.play().then(() => {
      setAudio(newAudio)
      setCurrentSongIndex(index)
      setIsPlaying(true)
    }).catch(() => {
      // If audio fails to load, just update the UI without actual audio
      setAudio(newAudio)
      setCurrentSongIndex(index)
      setIsPlaying(true)
      console.log('Demo audio not available, showing UI only')
    })
  }

  const togglePlayPause = () => {
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(true) // Visual feedback even if audio fails
      })
    }
  }

  const playNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % demoSongs.length
    playAudio(nextIndex)
  }

  const playPreviousSong = () => {
    const prevIndex = currentSongIndex === 0 ? demoSongs.length - 1 : currentSongIndex - 1
    playAudio(prevIndex)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              {isLoading ? (
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                  <Link 
                    href="/dashboard"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
              </div>
            ) : (
                <>
                  <Link 
                    href="/auth"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth"
                    className="relative px-6 py-2.5 text-white font-medium rounded-lg overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] transition-transform group-hover:scale-110" />
                    <span className="relative">Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-blue-950/20" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00f5ff]/10 to-[#ff006e]/10 dark:from-[#00f5ff]/20 dark:to-[#ff006e]/20 rounded-full mb-8">
              <Sparkles className="h-4 w-4 text-[#ff006e]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Music Creation</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">Create </span>
              <span className="bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] bg-clip-text text-transparent">
                Custom Songs
              </span>
              <span className="text-gray-900 dark:text-white"> with AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Turn your memories into music. Generate personalized songs for birthdays, 
              anniversaries, weddings, and any special moment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/create"
                className="relative px-8 py-4 text-white font-semibold rounded-xl overflow-hidden group transform transition-all hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] transition-transform group-hover:scale-110" />
                <span className="relative flex items-center gap-2">
                  Create Your Song Now <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
              
              <button 
                onClick={openDemoPlayer}
                className="px-8 py-4 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all flex items-center gap-2 group"
              >
                <Play className="h-5 w-5 text-[#ff006e] group-hover:scale-110 transition-transform" />
                Listen to Examples
              </button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>No musical skills required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Ready in minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>100% unique songs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Player - Slide Down */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        showDemoPlayer ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={closeDemoPlayer}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Song Cards Scrollable Row */}
            <div className="mb-6">
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {demoSongs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => playAudio(index)}
                    className={`flex-shrink-0 w-48 p-3 rounded-lg cursor-pointer transition-all ${
                      currentSongIndex === index
                        ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    {/* Song Image */}
                    <div className="relative mb-3">
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {currentSongIndex === index && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePlayPause()
                          }}
                        >
                          {isPlaying ? (
                            <Pause className="h-8 w-8 text-white" />
                          ) : (
                            <Play className="h-8 w-8 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Song Info */}
                    <div className="text-sm">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {song.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 truncate">
                        {song.occasion} • {song.genre}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">
                        {song.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Controls */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                {/* Current Song Info */}
                <div className="flex items-center space-x-3">
                  <img
                    src={demoSongs[currentSongIndex].image}
                    alt={demoSongs[currentSongIndex].title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {demoSongs[currentSongIndex].title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {demoSongs[currentSongIndex].artist}
                    </p>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={playPreviousSong}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-700"
                  >
                    <SkipBack className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="p-3 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] text-white rounded-full hover:scale-105 transition-transform shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNextSong}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-white dark:hover:bg-gray-700"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] h-2 rounded-full transition-all duration-300"
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect for Every Occasion
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create memorable songs that capture the essence of your special moments
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff006e]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff006e] to-[#ff006e]/70 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Romantic Moments</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Anniversaries, proposals, Valentine's Day, or just because you love them.
                </p>
              </div>
            </div>
            
            <div className="group relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00f5ff]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#00f5ff] to-[#00f5ff]/70 rounded-xl flex items-center justify-center mb-6">
                  <Gift className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Special Celebrations</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Birthdays, graduations, promotions, or any milestone worth celebrating.
                </p>
              </div>
            </div>
            
            <div className="group relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8338ec]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#8338ec] to-[#8338ec]/70 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Family & Friends</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Create memories with personalized songs for the people who matter most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create your perfect song in four simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec]" />
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00f5ff] to-[#00f5ff]/70 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Answer Questions</h3>
                <p className="text-gray-600 dark:text-gray-400">Tell us about the recipient and occasion</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff006e] to-[#ff006e]/70 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Choose Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Select genre, mood, and preferences</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#8338ec] to-[#8338ec]/70 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">AI Creates</h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI generates your custom song</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00f5ff] via-[#ff006e] to-[#8338ec] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Download & Share</h3>
                <p className="text-gray-600 dark:text-gray-400">Get your song and share the magic</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your musical needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Single Song */}
            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Single Song</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Perfect for one special moment</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$9</span>
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">.99</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Custom AI-generated song</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">High-quality audio download</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Personalized lyrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Multiple genre options</span>
                </li>
              </ul>
              
              <Link 
                href="/create"
                className="w-full py-4 text-gray-900 dark:text-white font-semibold rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors block text-center"
              >
                Create Song
              </Link>
            </div>
            
            {/* Bundle */}
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 border-2 border-gradient transition-all hover:shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                  BEST VALUE
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">3-Song Bundle</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create multiple memories</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] bg-clip-text text-transparent">$24</span>
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">.99</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">$8.33 per song • Save $5.00</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">3 custom AI-generated songs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">High-quality audio downloads</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Personalized lyrics for each</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Multiple genre options</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[#ff006e] mt-0.5 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white">Save $5.00</span>
                </li>
              </ul>
              
              <Link 
                href="/create?bundle=3"
                className="relative w-full py-4 text-white font-semibold rounded-xl overflow-hidden group block text-center"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#00f5ff] via-[#ff006e] to-[#8338ec] transition-transform group-hover:scale-110" />
                <span className="relative">Get Bundle</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See what our customers are saying about their personalized songs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "The song for my daughter's birthday was absolutely perfect! She cried happy tears when she heard it. 
                The AI captured every detail I mentioned."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Birthday Surprise</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "I proposed with a custom song and it was the most romantic moment ever! 
                The quality was incredible and the lyrics were so personal."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Michael Chen</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Proposal Song</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "Created a song for our 25th anniversary. It beautifully captured our journey together. 
                We play it all the time!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Linda Martinez</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Anniversary Gift</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        .border-gradient {
          background: linear-gradient(to bottom right, white, white) padding-box,
                      linear-gradient(135deg, #00f5ff 0%, #ff006e 50%, #8338ec 100%) border-box;
          border: 2px solid transparent;
        }
        :global(.dark) .border-gradient {
          background: linear-gradient(to bottom right, rgb(31 41 55), rgb(31 41 55)) padding-box,
                      linear-gradient(135deg, #00f5ff 0%, #ff006e 50%, #8338ec 100%) border-box;
          border: 2px solid transparent;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Logo className="mb-4" />
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your memories into beautiful, personalized songs with the power of AI. 
                Create the perfect soundtrack for life's special moments.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Your data is safe and secure</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/create" className="text-gray-400 hover:text-white transition-colors">
                    Create a Song
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/support" className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              © 2025 Song Mint. All rights reserved.
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-[#ff006e] fill-current" />
              <span>by AI enthusiasts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}