export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          table_name: string
          operation: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          table_name: string
          operation: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          table_name?: string
          operation?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      billing_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          credits_added: number
          stripe_invoice_id: string
          stripe_subscription_id: string
          billing_period_start: string
          billing_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          credits_added: number
          stripe_invoice_id: string
          stripe_subscription_id: string
          billing_period_start: string
          billing_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          credits_added?: number
          stripe_invoice_id?: string
          stripe_subscription_id?: string
          billing_period_start?: string
          billing_period_end?: string
          created_at?: string
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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          subscription_status: string
          credits_remaining: number
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          subscription_plan_id: string | null
          billing_cycle_anchor: string | null
          next_billing_date: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          subscription_status?: string
          credits_remaining?: number
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          subscription_plan_id?: string | null
          billing_cycle_anchor?: string | null
          next_billing_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          subscription_status?: string
          credits_remaining?: number
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          subscription_plan_id?: string | null
          billing_cycle_anchor?: string | null
          next_billing_date?: string | null
          created_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string | null
          ip_address: string | null
          endpoint: string
          requests_count: number
          window_start: string
          last_request: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          ip_address?: string | null
          endpoint: string
          requests_count?: number
          window_start?: string
          last_request?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          ip_address?: string | null
          endpoint?: string
          requests_count?: number
          window_start?: string
          last_request?: string
          created_at?: string
        }
      }
      security_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          severity: string
          description: string
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          severity: string
          description: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          severity?: string
          description?: string
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          resolved?: boolean
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
          questionnaire_data: Json
          generated_lyrics: string | null
          audio_url: string | null
          backup_audio_url: string | null
          mureka_task_id: string | null
          mureka_data: Json | null
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
          questionnaire_data: Json
          generated_lyrics?: string | null
          audio_url?: string | null
          backup_audio_url?: string | null
          mureka_task_id?: string | null
          mureka_data?: Json | null
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
          questionnaire_data?: Json
          generated_lyrics?: string | null
          audio_url?: string | null
          backup_audio_url?: string | null
          mureka_task_id?: string | null
          mureka_data?: Json | null
          payment_id?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_credits: {
        Args: {
          target_user_id: string
          credit_change: number
          operation_type: string
          operation_context?: Json
        }
        Returns: Json
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      audit_trigger: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      api_rate_limit_check: {
        Args: {
          user_id: string | null
          ip_addr: string | null
          endpoint_name: string
          max_requests: number
          window_minutes: number
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          severity: string
          description: string
          metadata?: Json
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Returns: string
      }
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      anonymize_user_data: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never