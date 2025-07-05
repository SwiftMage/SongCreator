// Core user and authentication types
export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

export interface Profile {
  id: string
  email: string
  credits_remaining: number
  subscription_status?: 'free' | 'lite' | 'plus' | 'max' | 'cancelled'
  stripe_subscription_id?: string
  stripe_customer_id?: string
  subscription_plan_id?: string
  next_billing_date?: string
}

// Song creation form types
export interface SongFormData {
  // Basic info
  songType: string
  subjectName: string
  subjectRelationship: string
  occasionName: string
  
  // Lyrics options
  lyricsChoice: 'ai-generated' | 'my-own' | 'partial-help'
  customLyrics?: string
  partialLyrics?: string
  lyricsHelp?: string
  aiPrompt?: string
  
  // Musical style
  genres: string[]
  instruments: string[]
  energy: string
  singer: string
  customGenre?: string
  customInstruments?: string[]
  
  // Additional details
  specificDetails: string[]
  songTitle?: string
  
  // Internal fields
  step?: number
}

// Song database types
export interface Song {
  id: string
  title: string
  song_title?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionnaire_data: SongFormData
  generated_lyrics?: string
  audio_url?: string
  backup_audio_url?: string
  created_at: string
  completed_at?: string
}

export interface SongData {
  user_id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionnaire_data: SongFormData
  generated_lyrics?: string
}

// API types
export interface MurekaApiPayload {
  lyrics: string
  prompt: string
  model: string
}

export interface AudioVariation {
  index: number
  url: string
  flacUrl?: string
  duration?: number
  lyricsWithTimings?: TimedLyric[]
}

export interface TimedLyric {
  text: string
  start: number
  end: number
}

// Security and audit types
export interface SecurityEventMetadata {
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  userId?: string
  [key: string]: string | number | boolean | undefined
}

export interface SecurityStatus {
  activeThreats: number
  recentEvents: number
  systemHealth: 'good' | 'warning' | 'critical'
}

export interface DataIntegrityResult {
  table: string
  issues: string[]
  severity: 'low' | 'medium' | 'high'
}

// Form validation types
export interface ValidationRule<T = string | number | boolean> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  message?: string
}

export interface FormState {
  [key: string]: string | number | boolean | string[]
}

export interface ValidationErrors {
  [key: string]: string | null
}

// Component prop types
export interface DetailSectionProps {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Billing and subscription types
export interface BillingInfo {
  plan: string
  status: string
  nextBilling?: string
  amount?: number
  currency?: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund'
  description: string
  created_at: string
}