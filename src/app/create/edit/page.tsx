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
  RefreshCw
} from 'lucide-react'

interface FormData {
  // Step 1: Basic Info
  subjectName: string
  relationship: string
  
  // Step 2: Song Type
  songType: 'love' | 'friendship' | 'funny' | 'dedication' | 'celebration' | 'birthday' | 'mothers_day' | 'fathers_day' | 'anniversary' | ''
  
  // Step 3: Detailed Info
  positiveAttributes: string[]
  insideJokes: string[]
  specialPlaces: string[]
  specialMoments: string[]
  favoriteMemories: string[]
  
  // Step 3b: Special Occasion Info (optional)
  occasionDetails: string
  
  // Step 4: Song Style
  genres: string[]
  instruments: string[]
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
  'Classical', 'Acoustic', 'Singer-Songwriter', 'Soft Rock'
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
    positiveAttributes: [],
    insideJokes: [],
    specialPlaces: [],
    specialMoments: [],
    favoriteMemories: [],
    occasionDetails: '',
    genres: [],
    instruments: [],
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
        positiveAttributes: questionnaireData.positiveAttributes || [],
        insideJokes: questionnaireData.insideJokes || [],
        specialPlaces: questionnaireData.specialPlaces || [],
        specialMoments: questionnaireData.specialMoments || [],
        favoriteMemories: questionnaireData.favoriteMemories || [],
        occasionDetails: questionnaireData.occasionDetails || '',
        genres: questionnaireData.genres || [],
        instruments: questionnaireData.instruments || [],
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
    if (data.genres.length > 0 || data.instruments.length > 0 || data.singer || data.energy || data.otherStyle) {
      prompt += ' with the following style: '
      
      if (data.genres.length > 0) {
        prompt += `Genre: ${data.genres.join(', ')}. `
      }
      
      if (data.instruments.length > 0) {
        prompt += `Instruments: ${data.instruments.join(', ')}. `
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
    
    if (data.favoriteMemories.length > 0) {
      prompt += `FAVORITE MEMORIES:\n${data.favoriteMemories.map(memory => `- ${memory}`).join('\n')}\n\n`
    }
    
    prompt += `Please create meaningful, heartfelt lyrics that incorporate these details naturally and authentically capture the relationship and emotions described.`
    
    return prompt
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

      const aiPrompt = generateAIPrompt(formData)
      
      // Update song with new data and reset status
      const { error: updateError } = await supabase
        .from('songs')
        .update({
          title: `${formData.songType.charAt(0).toUpperCase() + formData.songType.slice(1)} Song for ${formData.subjectName}`,
          status: 'pending',
          questionnaire_data: {
            ...formData,
            aiPrompt: aiPrompt
          },
          generated_lyrics: null, // Clear old lyrics
          audio_url: null, // Clear old audio
          completed_at: null
        })
        .eq('id', songId)

      if (updateError) throw updateError

      // Deduct credit
      await supabase
        .from('profiles')
        .update({
          credits_remaining: profile.credits_remaining - 1
        })
        .eq('id', user.id)

      console.log('Updated song with new data and AI prompt:', aiPrompt)
      
      // Redirect to generation page
      router.push(`/create/generating?songId=${songId}`)
    } catch (error) {
      console.error('Error updating song:', error)
      alert('Failed to update song. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.subjectName.trim() && formData.relationship.trim()
      case 2:
        return formData.songType !== ''
      case 3:
        return true // Allow proceeding even with empty arrays
      case 4:
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
                <span className="text-sm font-medium text-gray-600">Step {currentStep} of 4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
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

          {/* Step 3: Detailed Info */}
          {currentStep === 3 && (
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

                {/* Favorite Memories */}
                <DetailSection
                  title="Favorite Memories"
                  subtitle="What moments do you cherish most?"
                  icon={Sparkles}
                  items={formData.favoriteMemories}
                  onAdd={(value) => addItem('favoriteMemories', value)}
                  onRemove={(index) => removeItem('favoriteMemories', index)}
                  placeholder="e.g., dancing in the kitchen"
                />

                {/* Occasion Details */}
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
                      formData.songType === 'anniversary' ? "e.g., 5 wonderful years together" :
                      formData.songType === 'mothers_day' ? "e.g., First Mother's Day as a grandmother" :
                      formData.songType === 'fathers_day' ? "e.g., Recently became a new dad" :
                      formData.songType === 'celebration' ? "e.g., Graduation, promotion, achievement" :
                      "e.g., Her favorite color is blue, she always hums when she's happy..."
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Song Style */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Choose your song style
              </h2>
              
              <div className="space-y-8">
                {/* Genre Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Genre</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => toggleStyleItem('genres', genre)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.genres.includes(genre)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruments Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Instruments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {instruments.map((instrument) => (
                      <button
                        key={instrument}
                        onClick={() => toggleStyleItem('instruments', instrument)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.instruments.includes(instrument)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {instrument}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Singer Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Singer</h3>
                  <div className="flex gap-6">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, singer: 'male' }))}
                      className={`px-8 py-4 rounded-lg font-medium transition-colors ${
                        formData.singer === 'male'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Male Voice
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, singer: 'female' }))}
                      className={`px-8 py-4 rounded-lg font-medium transition-colors ${
                        formData.singer === 'female'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Female Voice
                    </button>
                  </div>
                </div>

                {/* Energy Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Energy Level</h3>
                  <div className="flex gap-6">
                    {['low', 'medium', 'high'].map((energy) => (
                      <button
                        key={energy}
                        onClick={() => setFormData(prev => ({ ...prev, energy: energy as any }))}
                        className={`px-8 py-4 rounded-lg font-medium transition-colors capitalize ${
                          formData.energy === energy
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {energy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other Style Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Other Style Notes</h3>
                  <textarea
                    value={formData.otherStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherStyle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Any specific style preferences, mood, or additional details..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
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

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
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