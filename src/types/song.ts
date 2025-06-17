export interface SongQuestionnaireData {
  // Step 1: Song Basics
  title: string
  recipientName: string
  occasion: string
  genre: string
  mood: string
  
  // Step 2: Personal Details
  relationship: string
  specialMemories: string
  importantDates: string
  personalityTraits: string
  favoriteActivities: string
  
  // Step 3: Song Preferences
  songLength: '30s' | '1min' | '2min' | 'full'
  musicalStyle: string
  voiceType: 'male' | 'female' | 'instrumental'
  tempo: 'slow' | 'medium' | 'upbeat'
}

export interface Song {
  id: string
  userId: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionnaireData: SongQuestionnaireData
  generatedLyrics?: string
  audioUrl?: string
  paymentId?: string
  createdAt: string
  completedAt?: string
}

export type SongStatus = 'pending' | 'processing' | 'completed' | 'failed'