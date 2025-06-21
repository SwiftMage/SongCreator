export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          subscription_status: string | null
          credits_remaining: number | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          subscription_status?: string | null
          credits_remaining?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          subscription_status?: string | null
          credits_remaining?: number | null
          created_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          user_id: string
          title: string
          song_title: string | null
          status: string
          questionnaire_data: any
          generated_lyrics: string | null
          audio_url: string | null
          backup_audio_url: string | null
          payment_id: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          song_title?: string | null
          status?: string
          questionnaire_data: any
          generated_lyrics?: string | null
          audio_url?: string | null
          backup_audio_url?: string | null
          payment_id?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          song_title?: string | null
          status?: string
          questionnaire_data?: any
          generated_lyrics?: string | null
          audio_url?: string | null
          backup_audio_url?: string | null
          payment_id?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          song_id: string
          amount: number
          currency: string
          payment_provider_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          amount: number
          currency: string
          payment_provider_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          amount?: number
          currency?: string
          payment_provider_id?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}