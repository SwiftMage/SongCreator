'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  FileText
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

export default function CreateSongPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    // Handle browser back button
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if user has made progress
      const hasProgress = currentStep > 1 || 
        formData.subjectName || 
        formData.relationship || 
        formData.songType ||
        formData.positiveAttributes.length > 0 ||
        formData.insideJokes.length > 0 ||
        formData.specialPlaces.length > 0 ||
        formData.specialMoments.length > 0 ||
        formData.uniqueCharacteristics.length > 0 ||
        formData.otherPeople.length > 0 ||
        formData.occasionDetails ||
        formData.anniversaryYears ||
        formData.anniversaryType ||
        formData.whereMet ||
        formData.proposalDetails ||
        formData.weddingDetails ||
        formData.genres.length > 0 ||
        formData.instruments.length > 0 ||
        formData.customGenres.length > 0 ||
        formData.customInstruments.length > 0

      if (hasProgress) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      const hasProgress = currentStep > 1 || 
        formData.subjectName || 
        formData.relationship || 
        formData.songType ||
        formData.positiveAttributes.length > 0 ||
        formData.insideJokes.length > 0 ||
        formData.specialPlaces.length > 0 ||
        formData.specialMoments.length > 0 ||
        formData.uniqueCharacteristics.length > 0 ||
        formData.otherPeople.length > 0 ||
        formData.occasionDetails ||
        formData.anniversaryYears ||
        formData.anniversaryType ||
        formData.whereMet ||
        formData.proposalDetails ||
        formData.weddingDetails ||
        formData.genres.length > 0 ||
        formData.instruments.length > 0 ||
        formData.customGenres.length > 0 ||
        formData.customInstruments.length > 0

      if (hasProgress) {
        const confirmLeave = window.confirm(
          'Are you sure you want to leave? Your song creation progress will be lost. Use the on-screen navigation buttons to go back without losing your work.'
        )
        
        if (!confirmLeave) {
          // Push state again to prevent navigation
          window.history.pushState(null, '', window.location.href)
        } else {
          // User confirmed, let them navigate away
          router.push('/dashboard')
        }
      }
    }

    // Add initial state
    window.history.pushState(null, '', window.location.href)
    
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentStep, formData, router])

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

  const generateAIPrompt = (data: FormData) => {
    let prompt = `Please generate lyrics for a ${data.songType} song`
    
    // Add song style details
    if (data.genres.length > 0 || data.customGenres.length > 0 || data.instruments.length > 0 || data.customInstruments.length > 0 || data.singer || data.energy || data.otherStyle) {
      prompt += ' with the following style: '
      
      if (data.genres.length > 0 || data.customGenres.length > 0) {
        const allGenres = [...data.genres, ...data.customGenres]
        prompt += `Genre: ${allGenres.join(', ')}. `
      }
      
      if (data.instruments.length > 0 || data.customInstruments.length > 0) {
        const allInstruments = [...data.instruments, ...data.customInstruments]
        prompt += `Instruments: ${allInstruments.join(', ')}. `
      }
      
      if (data.singer) {
        prompt += `Singer: ${data.singer} voice. `
      }
      
      if (data.energy) {
        prompt += `Energy level: ${data.energy}. `
      }
      
      if (data.otherStyle) {
        prompt += `Additional style notes: ${data.otherStyle}. `
      }
    }
    
    prompt += `\n\nThis song is about ${data.subjectName}, who is the songwriter's ${data.relationship}.\n\n`
    
    if (data.occasionDetails.trim()) {
      prompt += `OCCASION DETAILS:\n${data.occasionDetails}\n\n`
    }
    
    // Anniversary-specific details
    if (data.songType === 'anniversary') {
      if (data.isWeddingAnniversary) {
        prompt += `ANNIVERSARY DETAILS:\n`
        if (data.anniversaryYears) {
          prompt += `- ${data.anniversaryYears} year anniversary\n`
        }
        if (data.anniversaryType) {
          prompt += `- Type: ${data.anniversaryType}\n`
        }
        if (data.whereMet) {
          prompt += `- Where they met: ${data.whereMet}\n`
        }
        if (data.proposalDetails) {
          prompt += `- Proposal details: ${data.proposalDetails}\n`
        }
        if (data.weddingDetails) {
          prompt += `- Wedding details: ${data.weddingDetails}\n`
        }
        prompt += `\n`
      } else if (data.anniversaryYears || data.anniversaryType) {
        prompt += `ANNIVERSARY DETAILS:\n`
        if (data.anniversaryYears) {
          prompt += `- ${data.anniversaryYears} year anniversary\n`
        }
        if (data.anniversaryType) {
          prompt += `- Type: ${data.anniversaryType}\n`
        }
        prompt += `\n`
      }
    }
    
    if (data.positiveAttributes.length > 0) {
      prompt += `POSITIVE ATTRIBUTES:\n${data.positiveAttributes.map(attr => `- ${attr}`).join('\n')}\n\n`
    }
    
    if (data.insideJokes.length > 0) {
      prompt += `INSIDE JOKES & REFERENCES:\n${data.insideJokes.map(joke => `- ${joke}`).join('\n')}\n\n`
    }
    
    if (data.specialPlaces.length > 0) {
      prompt += `SPECIAL PLACES:\n${data.specialPlaces.map(place => `- ${place}`).join('\n')}\n\n`
    }
    
    if (data.specialMoments.length > 0) {
      prompt += `SPECIAL MOMENTS:\n${data.specialMoments.map(moment => `- ${moment}`).join('\n')}\n\n`
    }
    
    if (data.uniqueCharacteristics.length > 0) {
      prompt += `UNIQUE CHARACTERISTICS:\n${data.uniqueCharacteristics.map(characteristic => `- ${characteristic}`).join('\n')}\n\n`
    }
    
    if (data.otherPeople.length > 0) {
      prompt += `OTHER PEOPLE TO INCLUDE:\n${data.otherPeople.map(person => `- ${person}`).join('\n')}\n\n`
    }
    
    prompt += `Please create meaningful, heartfelt lyrics that incorporate these details naturally and authentically capture the relationship and emotions described.`
    
    return prompt
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // First check if user has credits
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.credits_remaining < 1) {
        alert('You need credits to create a song. Please purchase more credits.')
        router.push('/pricing')
        return
      }

      let songData: any = {
        user_id: user.id,
        title: `${formData.songType.charAt(0).toUpperCase() + formData.songType.slice(1)} Song for ${formData.subjectName}`,
        status: 'pending', // Always start as pending until music is generated
        questionnaire_data: formData
      }

      // If user provided their own lyrics, store them directly
      if (formData.lyricsChoice === 'own') {
        songData.generated_lyrics = formData.ownLyrics
      } else {
        // For AI lyrics, generate the prompt
        const aiPrompt = generateAIPrompt(formData)
        songData.questionnaire_data.aiPrompt = aiPrompt
        console.log('Generated AI Prompt:', aiPrompt)
      }
      
      const { data, error } = await supabase
        .from('songs')
        .insert(songData)
        .select()
        .single()

      if (error) throw error

      // Deduct credit
      await supabase
        .from('profiles')
        .update({
          credits_remaining: profileData.credits_remaining - 1
        })
        .eq('id', user.id)

      console.log('Created song with ID:', data.id)
      
      // Redirect based on lyrics choice
      if (formData.lyricsChoice === 'own') {
        // For user lyrics, go directly to music generation
        router.push(`/create/generating?songId=${data.id}`)
      } else {
        // For AI lyrics, go through the normal generation process
        router.push(`/create/generating?songId=${data.id}`)
      }
    } catch (error) {
      console.error('Error creating song:', error)
      alert('An error occurred while creating your song. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading song creator...</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How would you like to create your lyrics?</h2>
              
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
                      Help me create lyrics
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'ai' ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    I'll help you create personalized lyrics by asking about your relationship, memories, and what makes them special. Our AI will craft heartfelt lyrics just for you.
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
                      I have my own lyrics
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    formData.lyricsChoice === 'own' ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    I've already written lyrics and want to turn them into a professional song. Just provide your lyrics and we'll create the music for you.
                  </p>
                </button>
              </div>

              {/* Own Lyrics Input */}
              {formData.lyricsChoice === 'own' && (
                <div className="mt-8 animate-fade-in">
                  <label htmlFor="ownLyrics" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your lyrics
                  </label>
                  <textarea
                    id="ownLyrics"
                    value={formData.ownLyrics}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownLyrics: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Paste or type your lyrics here..."
                    rows={10}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Tip: Include verse/chorus structure if you have one. We'll work with whatever format you provide!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Detailed Info (only for AI lyrics) */}
          {currentStep === 4 && formData.lyricsChoice === 'ai' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                      <h3 className="text-lg font-semibold text-gray-900">Anniversary Details</h3>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="e.g., 10, Twenty-five, Our first"
                      />
                    </div>

                    {/* Anniversary Type */}
                    <div className="mb-4">
                      <label htmlFor="anniversaryType" className="block text-sm font-medium text-gray-700 mb-2">
                        What type of anniversary is this? (optional)
                      </label>
                      <input
                        id="anniversaryType"
                        type="text"
                        value={formData.anniversaryType}
                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="e.g., Wedding anniversary, Dating anniversary, First date anniversary"
                      />
                    </div>

                    {/* Wedding Anniversary Toggle */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Is this a wedding anniversary?</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isWeddingAnniversary: !prev.isWeddingAnniversary }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.isWeddingAnniversary ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.isWeddingAnniversary ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-600">
                          {formData.isWeddingAnniversary ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {/* Wedding-Specific Fields */}
                    {formData.isWeddingAnniversary && (
                      <div className="space-y-4 bg-purple-50 p-4 rounded-lg animate-fade-in">
                        <h4 className="font-medium text-purple-900 mb-3">Wedding Anniversary Details</h4>
                        
                        {/* Where they met */}
                        <div>
                          <label htmlFor="whereMet" className="block text-sm font-medium text-gray-700 mb-2">
                            Where did you first meet? (optional)
                          </label>
                          <textarea
                            id="whereMet"
                            value={formData.whereMet}
                            onChange={(e) => setFormData(prev => ({ ...prev, whereMet: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., We met at a coffee shop downtown during college..."
                            rows={2}
                          />
                        </div>

                        {/* Proposal details */}
                        <div>
                          <label htmlFor="proposalDetails" className="block text-sm font-medium text-gray-700 mb-2">
                            Where and how did the proposal happen? (optional)
                          </label>
                          <textarea
                            id="proposalDetails"
                            value={formData.proposalDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, proposalDetails: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                      <h3 className="text-lg font-semibold text-gray-900">{getOccasionTitle(formData.songType)}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{getOccasionPrompt(formData.songType)}</p>
                    
                    <textarea
                      value={formData.occasionDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, occasionDetails: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                className="flex items-center space-x-2 px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Music className="h-5 w-5" />
                <span>{isSubmitting ? 'Creating...' : 'Create Song'}</span>
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
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{subtitle}</p>
      
      {/* Add new item */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
              <span className="text-gray-900 flex-1">{item}</span>
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
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
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
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
    <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Choose your song style
      </h2>
      
      <div className="space-y-6">
        {/* Genre Selection Group */}
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Genre</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleStyleItem('genres', genre)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.genres.includes(genre)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
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
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instruments</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {instruments.map((instrument) => (
              <button
                key={instrument}
                onClick={() => toggleStyleItem('instruments', instrument)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.instruments.includes(instrument)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
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
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
          {/* Singer Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Singer</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, singer: 'male' }))}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.singer === 'male'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Male Voice
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, singer: 'female' }))}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  formData.singer === 'female'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Female Voice
              </button>
            </div>
          </div>

          {/* Energy Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Level</h3>
            <div className="flex gap-4">
              {['low', 'medium', 'high'].map((energy) => (
                <button
                  key={energy}
                  onClick={() => setFormData(prev => ({ ...prev, energy: energy as any }))}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors capitalize ${
                    formData.energy === energy
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {energy}
                </button>
              ))}
            </div>
          </div>

          {/* Other Style Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Style Notes</h3>
            <textarea
              value={formData.otherStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, otherStyle: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Any specific style preferences, mood, or additional details..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
}