'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'
import { 
  Music, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  X, 
  Heart, 
  Users, 
  Smile, 
  Award,
  MapPin,
  Calendar,
  Sparkles,
  Gift,
  Cake,
  Wand2,
  FileText,
  RefreshCw,
  ShoppingCart,
  Diamond,
  GraduationCap
} from 'lucide-react'

interface SongFormData {
  // Step 1: Basic Info
  subjectName: string
  relationship: string
  
  // Step 2: Song Type
  songType: 'love' | 'friendship' | 'funny' | 'dedication' | 'celebration' | 'birthday' | 'mothers_day' | 'fathers_day' | 'anniversary' | 'wedding' | 'graduation' | 'custom' | ''
  
  // Step 3: Lyrics Choice
  lyricsChoice: 'ai' | 'own' | ''
  ownLyrics: string
  
  // Step 4: Detailed Info (for AI lyrics only)
  positiveAttributes: string[]
  insideJokes: string[]
  specialPlaces: string[]
  specialMoments: string[]
  uniqueCharacteristics: string[]
  otherPeople: string[]
  
  // Step 4b: Special Occasion Info (optional)
  occasionDetails: string
  
  // Anniversary-specific fields
  isWeddingAnniversary: boolean
  anniversaryYears: string
  anniversaryType: string
  whereMet: string
  proposalDetails: string
  weddingDetails: string
  
  // Step 5: Song Style
  genres: string[]
  instruments: string[]
  customGenres: string[]
  customInstruments: string[]
  singer: 'male' | 'female' | ''
  energy: 'low' | 'medium' | 'high' | ''
  otherStyle: string
}

const songTypes = [
  { id: 'love', label: 'Love Song', icon: Heart, description: 'Express your romantic feelings' },
  { id: 'friendship', label: 'Friendship Song', icon: Users, description: 'Celebrate your friendship' },
  { id: 'funny', label: 'Funny Song', icon: Smile, description: 'Create something fun and lighthearted' },
  { id: 'dedication', label: 'Dedication Song', icon: Award, description: 'Honor someone special' },
  { id: 'celebration', label: 'Special Celebration', icon: Sparkles, description: 'Celebrate a special occasion or milestone' },
  { id: 'birthday', label: 'Birthday Song', icon: Cake, description: 'Make their birthday extra special' },
  { id: 'mothers_day', label: "Mother's Day Song", icon: Heart, description: 'Show mom how much she means to you' },
  { id: 'fathers_day', label: "Father's Day Song", icon: Award, description: 'Honor dad with a personalized song' },
  { id: 'anniversary', label: 'Anniversary Song', icon: Gift, description: 'Celebrate your time together' },
  { id: 'wedding', label: 'Wedding Song', icon: Diamond, description: 'Create the perfect song for your special day' },
  { id: 'graduation', label: 'Graduation Song', icon: GraduationCap, description: 'Celebrate academic achievement and new beginnings' },
  { id: 'custom', label: 'Custom Song', icon: Music, description: 'Create a personalized song without a specific theme' }
]

const genres = [
  'Pop', 'Rock', 'Country', 'Hip-Hop', 'R&B', 'Folk', 'Indie Rock', 'Alternative', 
  'Blues', 'Jazz', 'Indie Folk', 'Dance', 'Techno', 'Reggae', 'Punk', 'Metal',
  'Classical', 'Acoustic', 'Singer-Songwriter', 'Soft Rock', 'Latin', 'Rap', "80's Rock", "90's Rock"
]

const instruments = [
  'Guitar', 'Electric Guitar', 'Acoustic Guitar', 'Steel Guitar', 'Piano', 'Drums', 'Bass', 'Violin', 'Saxophone', 'Trumpet', 
  'Flute', 'Harmonica', 'Banjo', 'Ukulele', 'Keyboard', 'Synthesizer',
  'Cello', 'Clarinet', 'Accordion', 'Mandolin', 'Harp', 'Organ'
]

function EditSongPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [songId, setSongId] = useState<string | null>(null)
  const [originalSong, setOriginalSong] = useState<any>(null)
  const [formData, setFormData] = useState<SongFormData>({
    subjectName: '',
    relationship: '',
    songType: '',
    lyricsChoice: '',
    ownLyrics: '',
    positiveAttributes: [],
    insideJokes: [],
    specialPlaces: [],
    specialMoments: [],
    uniqueCharacteristics: [],
    otherPeople: [],
    occasionDetails: '',
    isWeddingAnniversary: false,
    anniversaryYears: '',
    anniversaryType: '',
    whereMet: '',
    proposalDetails: '',
    weddingDetails: '',
    genres: [],
    instruments: [],
    customGenres: [],
    customInstruments: [],
    singer: '',
    energy: '',
    otherStyle: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndLoadSong = async () => {
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
        await loadSongData(songIdParam, user.id)
      } else {
        router.push('/dashboard')
      }
    }

    checkAuthAndLoadSong()
  }, [router, searchParams, supabase])

  // Handle step parameter from URL
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10)
      if (stepNumber >= 1 && stepNumber <= 5) {
        setCurrentStep(stepNumber)
      }
    }
  }, [searchParams])

  const loadSongData = async (songId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.error('Error loading song:', error)
        router.push('/dashboard')
        return
      }

      setOriginalSong(data)
      
      // Populate form with existing data
      const questionnaireData = data.questionnaire_data
      setFormData({
        subjectName: questionnaireData.subjectName || '',
        relationship: questionnaireData.relationship || '',
        songType: questionnaireData.songType || '',
        lyricsChoice: questionnaireData.lyricsChoice || 'ai',
        ownLyrics: data.generated_lyrics || questionnaireData.ownLyrics || '',
        positiveAttributes: questionnaireData.positiveAttributes || [],
        insideJokes: questionnaireData.insideJokes || [],
        specialPlaces: questionnaireData.specialPlaces || [],
        specialMoments: questionnaireData.specialMoments || [],
        uniqueCharacteristics: questionnaireData.uniqueCharacteristics || [],
        otherPeople: questionnaireData.otherPeople || [],
        occasionDetails: questionnaireData.occasionDetails || '',
        isWeddingAnniversary: questionnaireData.isWeddingAnniversary || false,
        anniversaryYears: questionnaireData.anniversaryYears || '',
        anniversaryType: questionnaireData.anniversaryType || '',
        whereMet: questionnaireData.whereMet || '',
        proposalDetails: questionnaireData.proposalDetails || '',
        weddingDetails: questionnaireData.weddingDetails || '',
        genres: questionnaireData.genres || [],
        instruments: questionnaireData.instruments || [],
        customGenres: questionnaireData.customGenres || [],
        customInstruments: questionnaireData.customInstruments || [],
        singer: questionnaireData.singer || '',
        energy: questionnaireData.energy || '',
        otherStyle: questionnaireData.otherStyle || ''
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error loading song data:', error)
      router.push('/dashboard')
    }
  }

  const getOccasionTitle = (songType: string) => {
    switch (songType) {
      case 'birthday':
      case 'anniversary':
      case 'mothers_day':
      case 'fathers_day':
      case 'celebration':
        return "Special Occasion Details"
      default:
        return "Additional Details"
    }
  }

  const getOccasionPrompt = (songType: string) => {
    switch (songType) {
      case 'birthday':
        return "How old are they turning? (optional)"
      case 'anniversary':
        return "How many years have you been together? (optional)"
      case 'mothers_day':
        return "Any special details about this Mother's Day? (optional)"
      case 'fathers_day':
        return "Any special details about this Father's Day? (optional)"
      case 'celebration':
        return "Any additional details about this celebration? (optional)"
      default:
        return "Anything else you'd like to include in the song? (optional)"
    }
  }

  const addItem = (field: keyof SongFormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
    }
  }

  const removeItem = (field: keyof SongFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  const toggleStyleItem = (field: 'genres' | 'instruments', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  const addCustomItem = (field: 'customGenres' | 'customInstruments', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeCustomItem = (field: 'customGenres' | 'customInstruments', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const getTotalSteps = () => {
    return formData.lyricsChoice === 'own' ? 4 : 5
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.subjectName.trim()
      case 2:
        return formData.songType !== ''
      case 3:
        if (formData.lyricsChoice === 'own') {
          return formData.ownLyrics.trim().length > 0
        }
        return formData.lyricsChoice !== ''
      case 4:
        if (formData.lyricsChoice === 'own') {
          return true // Style step for own lyrics
        }
        return true // Allow proceeding even with empty arrays for AI lyrics
      case 5:
        return true // Allow proceeding even with no style selected
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!songId || !user) return
    
    setIsSubmitting(true)
    
    try {
      // Check if user has credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', user.id)
        .single()

      if (!profile || profile.credits_remaining < 1) {
        alert('You need at least 1 credit to regenerate a song. Please purchase more credits.')
        setIsSubmitting(false)
        return
      }

      let songData: any = {
        title: `${formData.songType.charAt(0).toUpperCase() + formData.songType.slice(1)} Song for ${formData.subjectName}`,
        status: 'pending',
        questionnaire_data: formData,
        generated_lyrics: null,
        audio_url: null,
        completed_at: null
      }

      // If user provided their own lyrics, store them directly
      if (formData.lyricsChoice === 'own') {
        songData.generated_lyrics = formData.ownLyrics
      } else {
        // For AI lyrics, we'll regenerate them
        songData.generated_lyrics = null
      }
      
      // Update song with new data
      const { error: updateError } = await supabase
        .from('songs')
        .update(songData)
        .eq('id', songId)

      if (updateError) throw updateError

      // Deduct credit
      await supabase
        .from('profiles')
        .update({
          credits_remaining: profile.credits_remaining - 1
        })
        .eq('id', user.id)

      console.log('Updated song for regeneration')
      
      // Redirect to generation page
      router.push(`/create/generating?songId=${songId}`)
    } catch (error) {
      console.error('Error updating song:', error)
      alert('Failed to update song. Please try again.')
    } finally {
      setIsSubmitting(false)
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
          <p className="text-gray-600 dark:text-gray-400">Loading song editor...</p>
        </div>
      </div>
    )
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
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{profile?.credits_remaining || 0} Credits</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <DarkModeToggle />
              <div className="h-6 w-px bg-gray-300" />
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Header Info */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Song</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Editing: {originalSong?.title} • This will cost 1 credit to regenerate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Step {currentStep} of {getTotalSteps()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / getTotalSteps()) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tell us about your song</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-2">
                    Who is this song about?
                  </label>
                  <input
                    id="subjectName"
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Enter their name"
                  />
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                    What&apos;s your relationship with them? <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="relationship"
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="e.g., girlfriend, best friend, sister, mom"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Song Type */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What type of song would you like?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {songTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, songType: type.id as any }))}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        formData.songType === type.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <IconComponent className={`h-6 w-6 ${
                          formData.songType === type.id ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                        <h3 className={`text-lg font-semibold ${
                          formData.songType === type.id ? 'text-purple-900' : 'text-gray-900 dark:text-white'
                        }`}>
                          {type.label}
                        </h3>
                      </div>
                      <p className={`text-sm ${
                        formData.songType === type.id ? 'text-purple-700' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {type.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Lyrics Choice */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How would you like to handle the lyrics?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, lyricsChoice: 'ai' }))}
                  className={`p-8 rounded-lg border-2 transition-all text-left ${
                    formData.lyricsChoice === 'ai'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <Wand2 className={`h-8 w-8 ${
                      formData.lyricsChoice === 'ai' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className={`text-xl font-semibold ${
                      formData.lyricsChoice === 'ai' ? 'text-purple-900' : 'text-gray-900 dark:text-white'
                    }`}>
                      Regenerate lyrics with AI
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'ai' ? 'text-purple-700' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Update the song details and let AI create new personalized lyrics for you.
                  </p>
                </button>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, lyricsChoice: 'own' }))}
                  className={`p-8 rounded-lg border-2 transition-all text-left ${
                    formData.lyricsChoice === 'own'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <FileText className={`h-8 w-8 ${
                      formData.lyricsChoice === 'own' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className={`text-xl font-semibold ${
                      formData.lyricsChoice === 'own' ? 'text-purple-900' : 'text-gray-900 dark:text-white'
                    }`}>
                      Keep/edit current lyrics
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'own' ? 'text-purple-700' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Use the existing lyrics or edit them manually before regenerating the music.
                  </p>
                </button>
              </div>

              {/* Own Lyrics Input */}
              {formData.lyricsChoice === 'own' && (
                <div className="mt-8 animate-fade-in">
                  <label htmlFor="ownLyrics" className="block text-sm font-medium text-gray-700 mb-2">
                    Edit your lyrics
                  </label>
                  <textarea
                    id="ownLyrics"
                    value={formData.ownLyrics}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownLyrics: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Edit your lyrics here..."
                    rows={10}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Detailed Info (for AI lyrics only) */}
          {currentStep === 4 && formData.lyricsChoice === 'ai' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Tell us more about {formData.subjectName}
                </h2>
                
                {/* Positive Attributes */}
                <DetailSection
                  title="Positive Attributes"
                  subtitle="What do you love about them?"
                  icon={Heart}
                  items={formData.positiveAttributes}
                  onAdd={(value) => addItem('positiveAttributes', value)}
                  onRemove={(index) => removeItem('positiveAttributes', index)}
                  placeholder="e.g., kind, funny, supportive"
                />

                {/* Inside Jokes */}
                <DetailSection
                  title="Inside Jokes & References"
                  subtitle="Any jokes or references only you two would understand?"
                  icon={Smile}
                  items={formData.insideJokes}
                  onAdd={(value) => addItem('insideJokes', value)}
                  onRemove={(index) => removeItem('insideJokes', index)}
                  placeholder="e.g., that time at the coffee shop"
                />

                {/* Special Places */}
                <DetailSection
                  title="Special Places"
                  subtitle="Places that are meaningful to both of you"
                  icon={MapPin}
                  items={formData.specialPlaces}
                  onAdd={(value) => addItem('specialPlaces', value)}
                  onRemove={(index) => removeItem('specialPlaces', index)}
                  placeholder="e.g., the park where we met"
                />

                {/* Special Moments */}
                <DetailSection
                  title="Special Moments"
                  subtitle="Memorable experiences you've shared"
                  icon={Calendar}
                  items={formData.specialMoments}
                  onAdd={(value) => addItem('specialMoments', value)}
                  onRemove={(index) => removeItem('specialMoments', index)}
                  placeholder="e.g., our first vacation together"
                />

                {/* Unique Characteristics */}
                <DetailSection
                  title="Unique Characteristics"
                  subtitle="What makes them one-of-a-kind?"
                  icon={Sparkles}
                  items={formData.uniqueCharacteristics}
                  onAdd={(value) => addItem('uniqueCharacteristics', value)}
                  onRemove={(index) => removeItem('uniqueCharacteristics', index)}
                  placeholder="e.g., amazing cook, terrible at directions, always optimistic"
                />

                {/* Other People to Include */}
                <DetailSection
                  title="Other People to Include"
                  subtitle="Family members, children, or friends you want to mention"
                  icon={Users}
                  items={formData.otherPeople}
                  onAdd={(value) => addItem('otherPeople', value)}
                  onRemove={(index) => removeItem('otherPeople', index)}
                  placeholder="e.g., our kids Sarah and Mike, mom, best friend Jake"
                />

                {/* Anniversary-Specific Fields */}
                {formData.songType === 'anniversary' && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anniversary Details</h3>
                    </div>

                    {/* Anniversary Years */}
                    <div className="mb-4">
                      <label htmlFor="anniversaryYears" className="block text-sm font-medium text-gray-700 mb-2">
                        How many years are you celebrating? (optional)
                      </label>
                      <input
                        id="anniversaryYears"
                        type="text"
                        value={formData.anniversaryYears}
                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryYears: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="e.g., 10, Twenty-five, Our first"
                      />
                    </div>

                    {/* Anniversary Type */}
                    <div className="mb-4">
                      <label htmlFor="anniversaryType" className="block text-sm font-medium text-gray-700 mb-2">
                        What type of anniversary is this? (optional)
                      </label>
                      <select
                        id="anniversaryType"
                        value={formData.anniversaryType}
                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                      >
                        <option value="">Select anniversary type (optional)</option>
                        <option value="wedding">Wedding Anniversary</option>
                        <option value="dating">Dating Anniversary</option>
                        <option value="engagement">Engagement Anniversary</option>
                        <option value="first_met">First Met Anniversary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Where they met */}
                    <div className="mb-4">
                      <label htmlFor="whereMet" className="block text-sm font-medium text-gray-700 mb-2">
                        Where did you first meet? (optional)
                      </label>
                      <textarea
                        id="whereMet"
                        value={formData.whereMet}
                        onChange={(e) => setFormData(prev => ({ ...prev, whereMet: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="e.g., We met at a coffee shop downtown during college..."
                        rows={2}
                      />
                    </div>

                    {/* Wedding-Specific Fields */}
                    {formData.anniversaryType === 'wedding' && (
                      <div className="space-y-4 bg-purple-50 p-4 rounded-lg animate-fade-in">
                        <h4 className="font-medium text-purple-900 mb-3">Wedding Anniversary Details</h4>
                        
                        {/* Proposal details */}
                        <div>
                          <label htmlFor="proposalDetails" className="block text-sm font-medium text-gray-700 mb-2">
                            Where and how did the proposal happen? (optional)
                          </label>
                          <textarea
                            id="proposalDetails"
                            value={formData.proposalDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, proposalDetails: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="e.g., He proposed on the beach at sunset with a ring hidden in a picnic basket..."
                            rows={2}
                          />
                        </div>

                        {/* Wedding details */}
                        <div>
                          <label htmlFor="weddingDetails" className="block text-sm font-medium text-gray-700 mb-2">
                            Where was the wedding held and any special wedding day details? (optional)
                          </label>
                          <textarea
                            id="weddingDetails"
                            value={formData.weddingDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, weddingDetails: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="e.g., We got married in a beautiful garden ceremony, it rained but we danced anyway..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* General Occasion Details */}
                {formData.songType !== 'anniversary' && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getOccasionTitle(formData.songType)}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{getOccasionPrompt(formData.songType)}</p>
                    
                    <textarea
                      value={formData.occasionDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, occasionDetails: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder={
                        formData.songType === 'birthday' ? "e.g., Turning 25, loves surprises" :
                        formData.songType === 'mothers_day' ? "e.g., First Mother's Day as a grandmother" :
                        formData.songType === 'fathers_day' ? "e.g., Recently became a new dad" :
                        formData.songType === 'celebration' ? "e.g., Graduation, promotion, achievement" :
                        "e.g., Her favorite color is blue, she always hums when she's happy..."
                      }
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Song Style Step (for both own lyrics and AI lyrics) */}
          {((currentStep === 4 && formData.lyricsChoice === 'own') || currentStep === 5) && (
            <SongStyleSection 
              formData={formData}
              setFormData={setFormData}
              genres={genres}
              instruments={instruments}
              toggleStyleItem={toggleStyleItem}
              addCustomItem={addCustomItem}
              removeCustomItem={removeCustomItem}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            {currentStep < getTotalSteps() ? (
              <button
                onClick={() => {
                  // Skip steps based on lyrics choice
                  if (currentStep === 3 && formData.lyricsChoice === 'own') {
                    setCurrentStep(4) // Go directly to style for own lyrics
                  } else if (currentStep === 3 && formData.lyricsChoice === 'ai') {
                    setCurrentStep(4) // Go to detailed info for AI lyrics
                  } else {
                    setCurrentStep(prev => prev + 1)
                  }
                }}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="flex items-center space-x-2 px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span>{isSubmitting ? 'Regenerating...' : 'Regenerate Song (1 Credit)'}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface DetailSectionProps {
  title: string
  subtitle: string
  icon: any
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
}

function DetailSection({ title, subtitle, icon: IconComponent, items, onAdd, onRemove, placeholder }: DetailSectionProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center space-x-2 mb-2">
        <IconComponent className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>
      
      {/* Add new item */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
          placeholder={placeholder}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg group hover:shadow-sm transition-shadow"
            >
              <span className="text-gray-900 dark:text-white flex-1">{item}</span>
              <button
                onClick={() => onRemove(index)}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface CustomStyleSectionProps {
  title: string
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
}

interface SongStyleSectionProps {
  formData: SongFormData
  setFormData: React.Dispatch<React.SetStateAction<SongFormData>>
  genres: string[]
  instruments: string[]
  toggleStyleItem: (field: 'genres' | 'instruments', item: string) => void
  addCustomItem: (field: 'customGenres' | 'customInstruments', value: string) => void
  removeCustomItem: (field: 'customGenres' | 'customInstruments', index: number) => void
}

function CustomStyleSection({ title, items, onAdd, onRemove, placeholder }: CustomStyleSectionProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      
      {/* Add new item */}
      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
          placeholder={placeholder}
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm group"
            >
              <span>{item}</span>
              <button
                onClick={() => onRemove(index)}
                className="ml-1 text-purple-600 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SongStyleSection({ 
  formData, 
  setFormData, 
  genres, 
  instruments, 
  toggleStyleItem, 
  addCustomItem, 
  removeCustomItem 
}: SongStyleSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Choose your song style
      </h2>
      
      <div className="space-y-6">
        {/* Genre Selection Group */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Genre</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleStyleItem('genres', genre)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.genres.includes(genre)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          
          {/* Custom Genres */}
          <CustomStyleSection
            title="Other Genres"
            items={formData.customGenres}
            onAdd={(value) => addCustomItem('customGenres', value)}
            onRemove={(index) => removeCustomItem('customGenres', index)}
            placeholder="Add custom genre..."
          />
        </div>

        {/* Instruments Selection Group */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instruments</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {instruments.map((instrument) => (
              <button
                key={instrument}
                onClick={() => toggleStyleItem('instruments', instrument)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.instruments.includes(instrument)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                }`}
              >
                {instrument}
              </button>
            ))}
          </div>
          
          {/* Custom Instruments */}
          <CustomStyleSection
            title="Other Instruments"
            items={formData.customInstruments}
            onAdd={(value) => addCustomItem('customInstruments', value)}
            onRemove={(index) => removeCustomItem('customInstruments', index)}
            placeholder="Add custom instrument..."
          />
        </div>

        {/* Voice & Energy Group */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-700">
          {/* Singer Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Singer</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  singer: prev.singer === 'male' ? '' : 'male' 
                }))}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.singer === 'male'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                }`}
              >
                Male Voice
              </button>
              <button
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  singer: prev.singer === 'female' ? '' : 'female' 
                }))}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.singer === 'female'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                }`}
              >
                Female Voice
              </button>
            </div>
          </div>

          {/* Energy Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Energy Level</h3>
            <div className="flex gap-4">
              {['low', 'medium', 'high'].map((energy) => (
                <button
                  key={energy}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    energy: prev.energy === energy ? '' : energy as any 
                  }))}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors capitalize ${
                    formData.energy === energy
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {energy}
                </button>
              ))}
            </div>
          </div>

          {/* Other Style Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Style Notes</h3>
            <textarea
              value={formData.otherStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, otherStyle: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 bg-white"
              placeholder="Any specific style preferences, mood, or additional details..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditSongPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditSongPage />
    </Suspense>
  )
}