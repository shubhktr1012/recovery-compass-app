export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      journal_entries: {
        Row: {
          cravings_level: number | null
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          physical_symptoms: string[] | null
          reflection: string
          trigger_context: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cravings_level?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          physical_symptoms?: string[] | null
          reflection: string
          trigger_context?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cravings_level?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          physical_symptoms?: string[] | null
          reflection?: string
          trigger_context?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          id: string
          message_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_program: string | null
          cigarettes_per_day: number | null
          created_at: string | null
          email: string | null
          expo_push_token: string | null
          id: string
          onboarding_complete: boolean | null
          preferred_push_hour: number
          push_opt_in: boolean
          quiet_hours_end: number
          quiet_hours_start: number
          quit_date: string | null
          revenuecat_app_user_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string
          triggers: string[] | null
          updated_at: string | null
        }
        Insert: {
          active_program?: string | null
          cigarettes_per_day?: number | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          id: string
          onboarding_complete?: boolean | null
          preferred_push_hour?: number
          push_opt_in?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          quit_date?: string | null
          revenuecat_app_user_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string
          triggers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          active_program?: string | null
          cigarettes_per_day?: number | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          id?: string
          onboarding_complete?: boolean | null
          preferred_push_hour?: number
          push_opt_in?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          quit_date?: string | null
          revenuecat_app_user_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string
          triggers?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_progress: {
        Row: {
          completed_at: string
          content_completed: boolean | null
          created_at: string
          day_id: number
          id: string
          program_id: string
          status: string
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          content_completed?: boolean | null
          created_at?: string
          day_id: number
          id?: string
          program_id: string
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          content_completed?: boolean | null
          created_at?: string
          day_id?: number
          id?: string
          program_id?: string
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relapse_logs: {
        Row: {
          context_notes: string | null
          created_at: string
          id: string
          slip_time: string
          user_id: string
        }
        Insert: {
          context_notes?: string | null
          created_at?: string
          id?: string
          slip_time?: string
          user_id: string
        }
        Update: {
          context_notes?: string | null
          created_at?: string
          id?: string
          slip_time?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_checkins: {
        Row: {
          checkin_date: string
          completed_at: string
          id: string
          notes: string | null
          routine_id: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          completed_at?: string
          id?: string
          notes?: string | null
          routine_id: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          completed_at?: string
          id?: string
          notes?: string | null
          routine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_checkins_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "user_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_events: {
        Row: {
          craving_level_after: number | null
          craving_level_before: number | null
          created_at: string
          duration_seconds: number | null
          id: string
          tool_used: string
          user_id: string
        }
        Insert: {
          craving_level_after?: number | null
          craving_level_before?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          tool_used: string
          user_id: string
        }
        Update: {
          craving_level_after?: number | null
          craving_level_before?: number | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          tool_used?: string
          user_id?: string
        }
        Relationships: []
      }
      user_routines: {
        Row: {
          action: string
          created_at: string
          id: string
          status: string | null
          trigger_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          status?: string | null
          trigger_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          status?: string | null
          trigger_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          country_code: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          country_code: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
