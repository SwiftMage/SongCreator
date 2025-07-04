'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'
import { createCheckoutSession } from '@/lib/stripe'
import { getOccasionPreset, hasOccasionPreset } from '@/config/occasionPresets'
import type { Profile, SongData } from '@/types'
import type { User } from '@supabase/supabase-js'
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
  ShoppingCart,
  Diamond,
  GraduationCap,
  CreditCard,
  Loader2,
  RotateCcw,
  Info
} from 'lucide-react'

interface CreateSongFormData {
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

export default function CreateSongPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<'single' | 'bundle3' | null>(null)
  const [showPresetNotification, setShowPresetNotification] = useState(false)
  const [isNotificationFading, setIsNotificationFading] = useState(false)
  const [appliedPresetFor, setAppliedPresetFor] = useState<string | null>(null)
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState<CreateSongFormData>({
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

  // State to track uncommitted text in input fields
  const [uncommittedInputs, setUncommittedInputs] = useState({
    positiveAttributes: '',
    insideJokes: '',
    specialPlaces: '',
    specialMoments: '',
    uniqueCharacteristics: '',
    otherPeople: ''
  })

  const router = useRouter()
  const supabase = createClient()

  // Auto-save timer ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // Load uncommitted inputs from localStorage on mount
  useEffect(() => {
    const savedUncommittedInputs = localStorage.getItem('songcreate_uncommitted_inputs')
    if (savedUncommittedInputs) {
      try {
        const parsed = JSON.parse(savedUncommittedInputs)
        setUncommittedInputs(parsed)
      } catch (error) {
        console.error('Error parsing saved uncommitted inputs:', error)
      }
    }
  }, [])

  // Save uncommitted inputs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('songcreate_uncommitted_inputs', JSON.stringify(uncommittedInputs))
  }, [uncommittedInputs])


  useEffect(() => {
    const checkAuth = async () => {
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
        .eq('id', user!.id)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else if (profileData) {
        setProfile(profileData)
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    // Add initial state only once
    window.history.pushState(null, '', window.location.href)
  }, [])

  useEffect(() => {
    // Handle browser back button
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Auto-save any uncommitted text before checking progress
      const hasUncommittedText = Object.values(uncommittedInputs).some(value => value.trim())
      if (hasUncommittedText) {
        autoSaveUncommittedText()
      }

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
        formData.customInstruments.length > 0 ||
        formData.otherStyle

      if (hasProgress) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handlePopState = () => {
      // Auto-save any uncommitted text before checking progress
      const hasUncommittedText = Object.values(uncommittedInputs).some(value => value.trim())
      if (hasUncommittedText) {
        autoSaveUncommittedText()
      }

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
        formData.customInstruments.length > 0 ||
        formData.otherStyle

      if (hasProgress) {
        const confirmLeave = window.confirm(
          'Are you sure you want to leave? Your song creation progress has been saved and will be included in your song. Use the on-screen navigation buttons to go back without losing your work.'
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
    
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentStep, formData, router, uncommittedInputs])

  // Cleanup notification timeout when component unmounts
  useEffect(() => {
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout)
      }
    }
  }, [notificationTimeout])

  // Restore form data and current step after successful payment
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('songFormData')
    const savedCurrentStep = sessionStorage.getItem('songCurrentStep')
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData)
        setFormData(parsedData)
        
        // Restore the step user was on when they ran out of credits
        if (savedCurrentStep) {
          setCurrentStep(parseInt(savedCurrentStep))
        }
        
        // Don't remove from sessionStorage yet - wait until song creation succeeds
      } catch (error) {
        console.error('Error restoring form data:', error)
      }
    }
  }, [])

  const handleBuyCredits = async (type: 'single' | 'bundle3') => {
    try {
      setIsCheckoutLoading(type)
      // Save form data and current step before redirecting
      sessionStorage.setItem('songFormData', JSON.stringify(formData))
      sessionStorage.setItem('songCurrentStep', currentStep.toString())
      await createCheckoutSession(type)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setIsCheckoutLoading(null)
    }
  }

  // Function to auto-save uncommitted text to form data
  const autoSaveUncommittedText = () => {
    setFormData(prev => {
      const updated = { ...prev }
      
      // Auto-add any uncommitted text to respective arrays
      if (uncommittedInputs.positiveAttributes.trim()) {
        updated.positiveAttributes = [...prev.positiveAttributes, uncommittedInputs.positiveAttributes.trim()]
      }
      if (uncommittedInputs.insideJokes.trim()) {
        updated.insideJokes = [...prev.insideJokes, uncommittedInputs.insideJokes.trim()]
      }
      if (uncommittedInputs.specialPlaces.trim()) {
        updated.specialPlaces = [...prev.specialPlaces, uncommittedInputs.specialPlaces.trim()]
      }
      if (uncommittedInputs.specialMoments.trim()) {
        updated.specialMoments = [...prev.specialMoments, uncommittedInputs.specialMoments.trim()]
      }
      if (uncommittedInputs.uniqueCharacteristics.trim()) {
        updated.uniqueCharacteristics = [...prev.uniqueCharacteristics, uncommittedInputs.uniqueCharacteristics.trim()]
      }
      if (uncommittedInputs.otherPeople.trim()) {
        updated.otherPeople = [...prev.otherPeople, uncommittedInputs.otherPeople.trim()]
      }
      
      return updated
    })
    
    // Clear uncommitted inputs after saving
    setUncommittedInputs({
      positiveAttributes: '',
      insideJokes: '',
      specialPlaces: '',
      specialMoments: '',
      uniqueCharacteristics: '',
      otherPeople: ''
    })
    
    // Clear localStorage after saving
    localStorage.removeItem('songcreate_uncommitted_inputs')
  }

  // Periodic auto-save: move uncommitted text to committed lists every 30 seconds
  useEffect(() => {
    const startAutoSave = () => {
      autoSaveTimer.current = setInterval(() => {
        const hasUncommittedText = Object.values(uncommittedInputs).some(value => value.trim())
        if (hasUncommittedText) {
          console.log('Auto-saving uncommitted text...')
          autoSaveUncommittedText()
        }
      }, 30000) // 30 seconds
    }

    const stopAutoSave = () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current)
        autoSaveTimer.current = null
      }
    }

    // Start auto-save when component mounts
    startAutoSave()

    // Stop auto-save when component unmounts
    return stopAutoSave
  }, [uncommittedInputs, autoSaveUncommittedText])

  const addItem = (field: keyof CreateSongFormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }))
    }
  }

  const removeItem = (field: keyof CreateSongFormData, index: number) => {
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

  const dismissNotification = () => {
    // Prevent multiple dismissals
    if (isNotificationFading || !showPresetNotification) return
    
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
      setNotificationTimeout(null)
    }
    
    setIsNotificationFading(true)
    
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setShowPresetNotification(false)
      setIsNotificationFading(false)
      setAppliedPresetFor(null)
    }, 550) // Slightly longer than animation duration (500ms + buffer)
  }

  const applyOccasionPreset = (songType: string) => {
    const preset = getOccasionPreset(songType)
    if (preset && hasOccasionPreset(songType)) {
      // Clear any existing timeout
      if (notificationTimeout) {
        clearTimeout(notificationTimeout)
        setNotificationTimeout(null)
      }
      
      setFormData(prev => ({
        ...prev,
        genres: preset.genres,
        instruments: preset.instruments,
        singer: preset.singer,
        energy: preset.energy,
        customGenres: [], // Clear custom selections when applying preset
        customInstruments: preset.customInstruments || []
      }))
      setAppliedPresetFor(songType)
      setShowPresetNotification(true)
      setIsNotificationFading(false)
      
      // Hide notification after 7 seconds (longer for better UX)
      const timeout = setTimeout(() => dismissNotification(), 7000)
      setNotificationTimeout(timeout)
    }
  }

  const resetToRecommended = () => {
    if (formData.songType && hasOccasionPreset(formData.songType)) {
      applyOccasionPreset(formData.songType)
    }
  }

  const clearAllSelections = () => {
    setFormData(prev => ({
      ...prev,
      genres: [],
      instruments: [],
      customGenres: [],
      customInstruments: [],
      singer: '',
      energy: '',
      otherStyle: ''
    }))
    setAppliedPresetFor(null)
    if (showPresetNotification) {
      dismissNotification()
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

  const generateAIPrompt = (data: CreateSongFormData, uncommittedData?: typeof uncommittedInputs) => {
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
    
    prompt += `\n\nThis song is about ${data.subjectName}`
    if (data.relationship.trim()) {
      prompt += `, who is the songwriter's ${data.relationship}`
    }
    prompt += `.\n\n`
    
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
    
    // Combine committed items with uncommitted text for each category
    const combineItems = (existing: string[], uncommittedKey: keyof typeof uncommittedInputs) => {
      const items = [...existing]
      if (uncommittedData && uncommittedData[uncommittedKey].trim()) {
        items.push(uncommittedData[uncommittedKey].trim())
      }
      return items
    }

    const positiveAttributes = combineItems(data.positiveAttributes, 'positiveAttributes')
    if (positiveAttributes.length > 0) {
      prompt += `POSITIVE ATTRIBUTES:\n${positiveAttributes.map(attr => `- ${attr}`).join('\n')}\n\n`
    }
    
    const insideJokes = combineItems(data.insideJokes, 'insideJokes')
    if (insideJokes.length > 0) {
      prompt += `INSIDE JOKES & REFERENCES:\n${insideJokes.map(joke => `- ${joke}`).join('\n')}\n\n`
    }
    
    const specialPlaces = combineItems(data.specialPlaces, 'specialPlaces')
    if (specialPlaces.length > 0) {
      prompt += `SPECIAL PLACES:\n${specialPlaces.map(place => `- ${place}`).join('\n')}\n\n`
    }
    
    const specialMoments = combineItems(data.specialMoments, 'specialMoments')
    if (specialMoments.length > 0) {
      prompt += `SPECIAL MOMENTS:\n${specialMoments.map(moment => `- ${moment}`).join('\n')}\n\n`
    }
    
    const uniqueCharacteristics = combineItems(data.uniqueCharacteristics, 'uniqueCharacteristics')
    if (uniqueCharacteristics.length > 0) {
      prompt += `UNIQUE CHARACTERISTICS:\n${uniqueCharacteristics.map(characteristic => `- ${characteristic}`).join('\n')}\n\n`
    }
    
    const otherPeople = combineItems(data.otherPeople, 'otherPeople')
    if (otherPeople.length > 0) {
      prompt += `OTHER PEOPLE TO INCLUDE:\n${otherPeople.map(person => `- ${person}`).join('\n')}\n\n`
    }
    
    prompt += `Please create meaningful, heartfelt lyrics that incorporate these details naturally and authentically capture the relationship and emotions described.`
    
    return prompt
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Auto-save any uncommitted text before submitting
    autoSaveUncommittedText()
    
    try {
      // First check if user has credits
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', user!.id)
        .single()

      if (!profileData || profileData.credits_remaining < 1) {
        const result = confirm('You need credits to create a song. Would you like to purchase credits now?')
        if (result) {
          // Save form data and current step to session storage before redirecting
          sessionStorage.setItem('songFormData', JSON.stringify(formData))
          sessionStorage.setItem('songCurrentStep', currentStep.toString())
          // Redirect to pricing page to let user choose package
          router.push('/pricing')
        }
        return
      }

      // Convert CreateSongFormData to SongFormData format
      let convertedFormData: any = {
        songType: formData.songType,
        subjectName: formData.subjectName,
        subjectRelationship: formData.relationship,
        occasionName: formData.occasionDetails,
        lyricsChoice: formData.lyricsChoice === 'ai' ? 'ai-generated' as const : 
                     formData.lyricsChoice === 'own' ? 'my-own' as const : 'partial-help' as const,
        customLyrics: formData.ownLyrics,
        genres: formData.genres,
        instruments: formData.instruments,
        energy: formData.energy,
        singer: formData.singer,
        customInstruments: formData.customInstruments,
        specificDetails: [
          ...formData.positiveAttributes,
          ...formData.insideJokes,
          ...formData.specialPlaces,
          ...formData.specialMoments,
          ...formData.uniqueCharacteristics,
          ...formData.otherPeople
        ].filter(item => item.trim() !== '')
      }

      // If using AI lyrics, generate and include the prompt
      if (formData.lyricsChoice === 'ai') {
        const aiPrompt = generateAIPrompt(formData, uncommittedInputs)
        console.log('Generated AI Prompt:', aiPrompt)
        convertedFormData.aiPrompt = aiPrompt
      }

      const songData: SongData = {
        user_id: user!.id,
        title: `${formData.songType.charAt(0).toUpperCase() + formData.songType.slice(1)} Song for ${formData.subjectName}`,
        status: 'pending', // Always start as pending until music is generated
        questionnaire_data: convertedFormData
      }

      // If user provided their own lyrics, store them directly
      if (formData.lyricsChoice === 'own') {
        songData.generated_lyrics = formData.ownLyrics
      }
      
      const { data, error } = await supabase
        .from('songs')
        .insert(songData)
        .select()
        .single()

      if (error) throw error

      // Deduct credit using secure API endpoint
      const creditResponse = await fetch('/api/deduct-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user!.id,
          songId: data.id,
          reason: 'Song creation'
        })
      })

      if (!creditResponse.ok) {
        throw new Error('Failed to deduct credit')
      }

      console.log('Created song with ID:', data.id)
      
      // Redirect based on lyrics choice
      // Clear saved form data and step since song creation succeeded
      sessionStorage.removeItem('songFormData')
      sessionStorage.removeItem('songCurrentStep')
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="songmint-icon-only">
            <div className="logo-icon">
              <div className="music-note">♪</div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading Song Mint...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {profile?.credits_remaining === 0 ? (
                <button
                  onClick={() => handleBuyCredits('single')}
                  disabled={isCheckoutLoading === 'single'}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-2 rounded-lg text-sm sm:text-base"
                >
                  {isCheckoutLoading === 'single' ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-purple-600" />
                      <span className="font-medium hidden sm:inline">Processing...</span>
                      <span className="font-medium sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      <span className="font-medium hidden sm:inline">Buy Credits</span>
                      <span className="font-medium sm:hidden">Buy</span>
                    </>
                  )}
                </button>
              ) : (
                <Link 
                  href="/pricing"
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer min-h-[44px] px-2 rounded-lg text-sm sm:text-base"
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span className="font-medium">{profile?.credits_remaining || 0} Credits</span>
                </Link>
              )}
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <DarkModeToggle />
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-1 sm:space-x-2 transition-colors min-h-[44px] px-2 rounded-lg text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Step {currentStep} of {getTotalSteps()}</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">{Math.round((currentStep / getTotalSteps()) * 100)}%</span>
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

      {/* Auto-save Status Indicator */}
      {Object.values(uncommittedInputs).some(value => value.trim()) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="container mx-auto px-4 py-2">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200 text-sm">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span>You have unsaved text that will be auto-saved in {Math.ceil((30000 - (Date.now() % 30000)) / 1000)} seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 pb-40">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Tell us about your song</h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who is this song about?
                  </label>
                  <input
                    id="subjectName"
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 min-h-[48px] text-base"
                    placeholder="Enter their name"
                  />
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What&apos;s your relationship with them? <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="relationship"
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400 min-h-[48px] text-base"
                    placeholder="e.g., girlfriend, best friend, sister, mom"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Song Type */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">What type of song would you like?</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {songTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, songType: type.id as any }))
                        // Apply preset only if moving to the style step or if user is already past song type selection
                        if (currentStep >= 4 || (currentStep === 2 && formData.songType !== type.id)) {
                          applyOccasionPreset(type.id)
                        }
                      }}
                      className={`p-4 sm:p-6 rounded-lg border-2 transition-all text-left touch-manipulation min-h-[80px] ${
                        formData.songType === type.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-25 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                        <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
                          formData.songType === type.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                        <h3 className={`text-base sm:text-lg font-semibold line-clamp-2 ${
                          formData.songType === type.id ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-white'
                        }`}>
                          {type.label}
                        </h3>
                      </div>
                      <p className={`text-xs sm:text-sm line-clamp-3 ${
                        formData.songType === type.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">How would you like to create your lyrics?</h2>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, lyricsChoice: 'ai' }))}
                  className={`p-4 sm:p-6 lg:p-8 rounded-lg border-2 transition-all text-left touch-manipulation min-h-[120px] ${
                    formData.lyricsChoice === 'ai'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-25 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <Wand2 className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ${
                      formData.lyricsChoice === 'ai' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${
                      formData.lyricsChoice === 'ai' ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      Help me create lyrics
                    </h3>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    formData.lyricsChoice === 'ai' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    I&apos;ll help you create personalized lyrics by asking about your relationship, memories, and what makes them special. Our AI will craft heartfelt lyrics just for you.
                  </p>
                </button>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, lyricsChoice: 'own' }))}
                  className={`p-4 sm:p-6 lg:p-8 rounded-lg border-2 transition-all text-left touch-manipulation min-h-[120px] ${
                    formData.lyricsChoice === 'own'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-25 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <FileText className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ${
                      formData.lyricsChoice === 'own' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${
                      formData.lyricsChoice === 'own' ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      I have my own lyrics
                    </h3>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    formData.lyricsChoice === 'own' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    I&apos;ve already written lyrics and want to turn them into a professional song. Just provide your lyrics and we&apos;ll create the music for you.
                  </p>
                </button>
              </div>

              {/* Own Lyrics Input */}
              {formData.lyricsChoice === 'own' && (
                <div className="mt-8 animate-fade-in">
                  <label htmlFor="ownLyrics" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter your lyrics
                  </label>
                  <textarea
                    id="ownLyrics"
                    value={formData.ownLyrics}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownLyrics: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
                    placeholder="Paste or type your lyrics here..."
                    rows={10}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Tip: Include verse/chorus structure if you have one. We&apos;ll work with whatever format you provide!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Detailed Info (only for AI lyrics) */}
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
                  inputValue={uncommittedInputs.positiveAttributes}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, positiveAttributes: value }))}
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
                  inputValue={uncommittedInputs.insideJokes}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, insideJokes: value }))}
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
                  inputValue={uncommittedInputs.specialPlaces}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, specialPlaces: value }))}
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
                  inputValue={uncommittedInputs.specialMoments}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, specialMoments: value }))}
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
                  inputValue={uncommittedInputs.uniqueCharacteristics}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, uniqueCharacteristics: value }))}
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
                  inputValue={uncommittedInputs.otherPeople}
                  onInputChange={(value) => setUncommittedInputs(prev => ({ ...prev, otherPeople: value }))}
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
                      <label htmlFor="anniversaryYears" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        How many years are you celebrating? (optional)
                      </label>
                      <input
                        id="anniversaryYears"
                        type="text"
                        value={formData.anniversaryYears}
                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryYears: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
                        placeholder="e.g., 10, Twenty-five, Our first"
                      />
                    </div>

                    {/* Anniversary Type */}
                    <div className="mb-4">
                      <label htmlFor="anniversaryType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        What type of anniversary is this? (optional)
                      </label>
                      <input
                        id="anniversaryType"
                        type="text"
                        value={formData.anniversaryType}
                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
                        placeholder="e.g., Wedding anniversary, Dating anniversary, First date anniversary"
                      />
                    </div>

                    {/* Wedding Anniversary Toggle */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Is this a wedding anniversary?</span>
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
                          <label htmlFor="whereMet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Where did you first meet? (optional)
                          </label>
                          <textarea
                            id="whereMet"
                            value={formData.whereMet}
                            onChange={(e) => setFormData(prev => ({ ...prev, whereMet: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
                            placeholder="e.g., We met at a coffee shop downtown during college..."
                            rows={2}
                          />
                        </div>

                        {/* Proposal details */}
                        <div>
                          <label htmlFor="proposalDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Where and how did the proposal happen? (optional)
                          </label>
                          <textarea
                            id="proposalDetails"
                            value={formData.proposalDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, proposalDetails: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
                            placeholder="e.g., He proposed on the beach at sunset with a ring hidden in a picnic basket..."
                            rows={2}
                          />
                        </div>

                        {/* Wedding details */}
                        <div>
                          <label htmlFor="weddingDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Where was the wedding held and any special wedding day details? (optional)
                          </label>
                          <textarea
                            id="weddingDetails"
                            value={formData.weddingDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, weddingDetails: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
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
                    <p className="text-gray-600 mb-4">{getOccasionPrompt(formData.songType)}</p>
                    
                    <textarea
                      value={formData.occasionDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, occasionDetails: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 dark:placeholder-gray-400"
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
            <div data-song-style-section>
              {/* Preset notification */}
              {(showPresetNotification || isNotificationFading) && hasOccasionPreset(formData.songType) && (
                <div className={`mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 flex items-start space-x-3 ${
                  isNotificationFading ? 'animate-fade-out' : 'animate-fade-in'
                }`}>
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 dark:text-blue-100">
                      We've preselected some settings that work great for {songTypes.find(t => t.id === formData.songType)?.label || 'this type of song'}. 
                      Feel free to customize them or use the "Reset to Recommended" button to restore our suggestions.
                    </p>
                  </div>
                  <button
                    onClick={dismissNotification}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <SongStyleSection 
                formData={formData}
                setFormData={setFormData}
                genres={genres}
                instruments={instruments}
                toggleStyleItem={toggleStyleItem}
                addCustomItem={addCustomItem}
                removeCustomItem={removeCustomItem}
                resetToRecommended={resetToRecommended}
                clearAllSelections={clearAllSelections}
                hasOccasionPreset={hasOccasionPreset}
              />
              
              {/* Hidden buttons for the component to trigger */}
              <button data-reset-button className="hidden" onClick={resetToRecommended} />
              <button data-clear-button className="hidden" onClick={clearAllSelections} />
            </div>
          )}

        </div>
      </main>

      {/* Sticky Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 py-4 sm:py-5">
              <button
                onClick={() => {
                  // Auto-save any uncommitted text before going back
                  autoSaveUncommittedText()
                  setCurrentStep(prev => Math.max(1, prev - 1))
                }}
                disabled={currentStep === 1}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] text-sm sm:text-base touch-manipulation order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back</span>
              </button>

              {currentStep < getTotalSteps() ? (
                <button
                  onClick={() => {
                    // Auto-save any uncommitted text before moving to next step
                    autoSaveUncommittedText()
                    
                    let nextStep = currentStep + 1
                    
                    // Skip steps based on lyrics choice
                    if (currentStep === 3 && formData.lyricsChoice === 'own') {
                      nextStep = 4 // Go directly to style for own lyrics
                    } else if (currentStep === 3 && formData.lyricsChoice === 'ai') {
                      nextStep = 4 // Go to detailed info for AI lyrics
                    }
                    
                    setCurrentStep(nextStep)
                    
                    // Apply presets when reaching style step for the first time
                    const isReachingStyleStep = (nextStep === 4 && formData.lyricsChoice === 'own') || nextStep === 5
                    if (isReachingStyleStep && formData.songType && appliedPresetFor !== formData.songType) {
                      applyOccasionPreset(formData.songType)
                    }
                  }}
                  disabled={!canProceed()}
                  className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] text-sm sm:text-base touch-manipulation order-1 sm:order-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (process.env.NODE_ENV === 'production') {
                      setShowConfirmation(true)
                    } else {
                      handleSubmit()
                    }
                  }}
                  disabled={isSubmitting || !canProceed()}
                  className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg min-h-[48px] text-sm sm:text-base touch-manipulation order-1 sm:order-2"
                >
                  <div className="songmint-icon-only">
                    <div className="logo-icon">
                      <div className="music-note">♪</div>
                    </div>
                  </div>
                  <span className="hidden sm:inline">{isSubmitting ? 'Creating...' : 'Generate Song (1 credit)'}</span>
                  <span className="sm:hidden">{isSubmitting ? 'Creating...' : 'Generate (1 credit)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Safe area padding for mobile devices */}
        <div className="pb-safe" />
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Confirm Song Creation
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              This will use 1 credit to generate your personalized song. Are you sure you want to continue?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[48px] text-sm sm:text-base touch-manipulation order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false)
                  handleSubmit()
                }}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors min-h-[48px] text-sm sm:text-base touch-manipulation order-1 sm:order-2"
              >
                Create Song
              </button>
            </div>
          </div>
        </div>
      )}
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
  inputValue: string
  onInputChange: (value: string) => void
}

function DetailSection({ title, subtitle, icon: IconComponent, items, onAdd, onRemove, placeholder, inputValue, onInputChange }: DetailSectionProps) {
  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue)
      onInputChange('') // Clear the input through parent
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0 pb-6">
      <div className="flex items-center space-x-2 mb-2">
        <IconComponent className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {inputValue.trim() && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-xs">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span>Unsaved text</span>
          </div>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{subtitle}</p>
      
      {/* Add new item */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
        <div className="space-y-2 !mb-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-purple-50 dark:!bg-gray-700 border border-purple-200 dark:!border-gray-600 rounded-lg group hover:shadow-sm transition-shadow"
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
  formData: CreateSongFormData
  setFormData: React.Dispatch<React.SetStateAction<CreateSongFormData>>
  genres: string[]
  instruments: string[]
  toggleStyleItem: (field: 'genres' | 'instruments', item: string) => void
  addCustomItem: (field: 'customGenres' | 'customInstruments', value: string) => void
  removeCustomItem: (field: 'customGenres' | 'customInstruments', index: number) => void
  resetToRecommended?: () => void
  clearAllSelections?: () => void
  hasOccasionPreset?: (songType: string) => boolean
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
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      
      {/* Add new item */}
      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
              className="flex items-center space-x-1 px-3 py-1 bg-purple-100 dark:!bg-gray-600 text-purple-800 dark:!text-gray-200 rounded-full text-sm group"
            >
              <span>{item}</span>
              <button
                onClick={() => onRemove(index)}
                className="ml-1 text-purple-600 dark:text-purple-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose your song style
        </h2>
        {hasOccasionPreset(formData.songType) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const parent = document.querySelector('[data-song-style-section]')
                const resetBtn = parent?.querySelector('[data-reset-button]') as HTMLButtonElement
                if (resetBtn) resetBtn.click()
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Recommended</span>
            </button>
            <button
              onClick={() => {
                const parent = document.querySelector('[data-song-style-section]')
                const clearBtn = parent?.querySelector('[data-clear-button]') as HTMLButtonElement
                if (clearBtn) clearBtn.click()
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Genre Selection Group */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Genre</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {genres.map((genre) => {
              const preset = getOccasionPreset(formData.songType)
              const isRecommended = preset && preset.genres.includes(genre)
              
              return (
                <button
                  key={genre}
                  onClick={() => toggleStyleItem('genres', genre)}
                  className={`px-3 py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors relative min-h-[44px] touch-manipulation ${
                    formData.genres.includes(genre)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {genre}
                  {isRecommended && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" title="Recommended for this occasion" />
                  )}
                </button>
              )
            })}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {instruments.map((instrument) => {
              const preset = getOccasionPreset(formData.songType)
              const isRecommended = preset && preset.instruments.includes(instrument)
              
              return (
                <button
                  key={instrument}
                  onClick={() => toggleStyleItem('instruments', instrument)}
                  className={`px-3 py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors relative min-h-[44px] touch-manipulation ${
                    formData.instruments.includes(instrument)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {instrument}
                  {isRecommended && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" title="Recommended for this occasion" />
                  )}
                </button>
              )
            })}
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
              {['low', 'medium', 'high'].map((energy) => {
                const preset = getOccasionPreset(formData.songType)
                const isRecommended = preset && preset.energy === energy
                
                return (
                  <button
                    key={energy}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      energy: prev.energy === energy ? '' : energy as any 
                    }))}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors capitalize relative ${
                      formData.energy === energy
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {energy}
                    {isRecommended && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" title="Recommended for this occasion" />
                    )}
                  </button>
                )
              })}
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