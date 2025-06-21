'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
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
  RefreshCw
} from 'lucide-react'

interface FormData {
  // Step 1: Basic Info
  subjectName: string
  relationship: string
  
  // Step 2: Song Type
  songType: 'love' | 'friendship' | 'funny' | 'dedication' | 'celebration' | 'birthday' | 'mothers_day' | 'fathers_day' | 'anniversary' | ''
  
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
  { id: 'anniversary', label: 'Anniversary Song', icon: Gift, description: 'Celebrate your time together' }
]

const genres = [
  'Pop', 'Rock', 'Country', 'Hip-Hop', 'R&B', 'Folk', 'Indie Rock', 'Alternative', 
  'Blues', 'Jazz', 'Electronic', 'Dance', 'Techno', 'Reggae', 'Punk', 'Metal',
  'Classical', 'Acoustic', 'Singer-Songwriter', 'Soft Rock', 'Latin', 'Rap'
]

const instruments = [
  'Guitar', 'Electric Guitar', 'Acoustic Guitar', 'Steel Guitar', 'Piano', 'Drums', 'Bass', 'Violin', 'Saxophone', 'Trumpet', 
  'Flute', 'Harmonica', 'Banjo', 'Ukulele', 'Keyboard', 'Synthesizer',
  'Cello', 'Clarinet', 'Accordion', 'Mandolin', 'Harp', 'Organ'
]

export default function EditSongPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [songId, setSongId] = useState<string | null>(null)
  const [originalSong, setOriginalSong] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({
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
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      
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

  const addItem = (field: keyof FormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
    }
  }

  const removeItem = (field: keyof FormData, index: number) => {
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
        return formData.subjectName.trim() && formData.relationship.trim()
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading song editor...</p>
        </div>
      </div>
    )
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
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Header Info */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Song</h1>
              <p className="text-sm text-gray-600">
                Editing: {originalSong?.title} • This will cost 1 credit to regenerate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-600">Step {currentStep} of {getTotalSteps()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
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
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your song</h2>
              
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Enter their name"
                  />
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                    What's your relationship with them?
                  </label>
                  <input
                    id="relationship"
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., girlfriend, best friend, sister, mom"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Song Type */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What type of song would you like?</h2>
              
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
                          formData.songType === type.id ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                        <h3 className={`text-lg font-semibold ${
                          formData.songType === type.id ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {type.label}
                        </h3>
                      </div>
                      <p className={`text-sm ${
                        formData.songType === type.id ? 'text-purple-700' : 'text-gray-600'
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
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How would you like to handle the lyrics?</h2>
              
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
                      formData.lyricsChoice === 'ai' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <h3 className={`text-xl font-semibold ${
                      formData.lyricsChoice === 'ai' ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      Regenerate lyrics with AI
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'ai' ? 'text-purple-700' : 'text-gray-600'
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
                      formData.lyricsChoice === 'own' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <h3 className={`text-xl font-semibold ${
                      formData.lyricsChoice === 'own' ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      Keep/edit current lyrics
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'own' ? 'text-purple-700' : 'text-gray-600'
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Edit your lyrics here..."
                    rows={10}
                  />
                </div>
              )}
            </div>
          )}

          {/* For brevity, I'll add the rest of the steps in the next edit... */}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            {currentStep < getTotalSteps() ? (
              <button
                onClick={() => {
                  // Skip steps based on lyrics choice
                  if (currentStep === 3 && formData.lyricsChoice === 'own') {
                    setCurrentStep(getTotalSteps()) // Go directly to style for own lyrics
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