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
      checkout_carts: {
        Row: {
          created_at: string
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_error_events: {
        Row: {
          component_stack: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          source: string
          stack: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          source: string
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          source?: string
          stack?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_step_counts: {
        Row: {
          created_at: string
          id: string
          local_date: string
          provider_status: string
          recorded_at: string
          source: string
          steps: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          provider_status?: string
          recorded_at?: string
          source: string
          steps?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          local_date?: string
          provider_status?: string
          recorded_at?: string
          source?: string
          steps?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edge_rate_limits: {
        Row: {
          bucket: string
          created_at: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          bucket: string
          created_at?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          bucket?: string
          created_at?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      integration_failures: {
        Row: {
          created_at: string
          error_message: string
          external_event_id: string | null
          external_transaction_id: string | null
          id: string
          metadata: Json | null
          operation: string
          resolved_at: string | null
          severity: string
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          external_event_id?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          resolved_at?: string | null
          severity?: string
          source: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          external_event_id?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
          delivery_status: string | null
          error_message: string | null
          id: string
          message_type: string
          queue_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          message_type: string
          queue_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          message_type?: string
          queue_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "smart_notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          age: number | null
          created_at: string | null
          daily_consumption_amount: number | null
          daily_consumption_cost: number | null
          full_name: string | null
          id: string
          language_selection: string | null
          mental_toll: boolean | null
          past_attempts: string | null
          physical_toll: string | null
          primary_goal: string | null
          root_cause: string | null
          target_selection: string | null
          triggers: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          daily_consumption_amount?: number | null
          daily_consumption_cost?: number | null
          full_name?: string | null
          id?: string
          language_selection?: string | null
          mental_toll?: boolean | null
          past_attempts?: string | null
          physical_toll?: string | null
          primary_goal?: string | null
          root_cause?: string | null
          target_selection?: string | null
          triggers?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          daily_consumption_amount?: number | null
          daily_consumption_cost?: number | null
          full_name?: string | null
          id?: string
          language_selection?: string | null
          mental_toll?: boolean | null
          past_attempts?: string | null
          physical_toll?: string | null
          primary_goal?: string | null
          root_cause?: string | null
          target_selection?: string | null
          triggers?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outbound_email_deliveries: {
        Row: {
          created_at: string
          dedupe_key: string
          email_type: string
          id: string
          last_error: string | null
          metadata: Json | null
          program_slug: string | null
          provider: string | null
          provider_event_id: string | null
          provider_transaction_id: string | null
          recipient_email: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          email_type: string
          id?: string
          last_error?: string | null
          metadata?: Json | null
          program_slug?: string | null
          provider?: string | null
          provider_event_id?: string | null
          provider_transaction_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          email_type?: string
          id?: string
          last_error?: string | null
          metadata?: Json | null
          program_slug?: string | null
          provider?: string | null
          provider_event_id?: string | null
          provider_transaction_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consecutive_absent_days: number
          created_at: string | null
          display_name: string | null
          email: string | null
          expo_push_token: string | null
          free_tier_activated_at: string | null
          id: string
          notifications_enabled: boolean
          onboarding_complete: boolean | null
          onboarding_completed_at: string | null
          primary_concern: string | null
          push_opt_in: boolean
          questionnaire_answers: Json | null
          recommended_program: string | null
          revenuecat_app_user_id: string | null
          sleep_time: string
          timezone: string
          updated_at: string | null
          wake_time: string
        }
        Insert: {
          avatar_url?: string | null
          consecutive_absent_days?: number
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          expo_push_token?: string | null
          free_tier_activated_at?: string | null
          id: string
          notifications_enabled?: boolean
          onboarding_complete?: boolean | null
          onboarding_completed_at?: string | null
          primary_concern?: string | null
          push_opt_in?: boolean
          questionnaire_answers?: Json | null
          recommended_program?: string | null
          revenuecat_app_user_id?: string | null
          sleep_time?: string
          timezone?: string
          updated_at?: string | null
          wake_time?: string
        }
        Update: {
          avatar_url?: string | null
          consecutive_absent_days?: number
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          expo_push_token?: string | null
          free_tier_activated_at?: string | null
          id?: string
          notifications_enabled?: boolean
          onboarding_complete?: boolean | null
          onboarding_completed_at?: string | null
          primary_concern?: string | null
          push_opt_in?: boolean
          questionnaire_answers?: Json | null
          recommended_program?: string | null
          revenuecat_app_user_id?: string | null
          sleep_time?: string
          timezone?: string
          updated_at?: string | null
          wake_time?: string
        }
        Relationships: []
      }
      program_access: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          completion_state: string
          created_at: string
          current_day: number | null
          id: string
          owned_program: string | null
          paused_at: string | null
          priority_rank: number | null
          program_state: string
          purchase_state: string
          revenuecat_product_id: string | null
          scheduled_start_date: string | null
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          completion_state?: string
          created_at?: string
          current_day?: number | null
          id?: string
          owned_program?: string | null
          paused_at?: string | null
          priority_rank?: number | null
          program_state?: string
          purchase_state?: string
          revenuecat_product_id?: string | null
          scheduled_start_date?: string | null
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          completion_state?: string
          created_at?: string
          current_day?: number | null
          id?: string
          owned_program?: string | null
          paused_at?: string | null
          priority_rank?: number | null
          program_state?: string
          purchase_state?: string
          revenuecat_product_id?: string | null
          scheduled_start_date?: string | null
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_swap_events: {
        Row: {
          created_at: string
          from_program: string
          id: string
          metadata: Json
          new_queue: Json
          previous_active_day: number | null
          previous_queue: Json
          reason: string
          to_program: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_program: string
          id?: string
          metadata?: Json
          new_queue?: Json
          previous_active_day?: number | null
          previous_queue?: Json
          reason: string
          to_program: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_program?: string
          id?: string
          metadata?: Json
          new_queue?: Json
          previous_active_day?: number | null
          previous_queue?: Json
          reason?: string
          to_program?: string
          user_id?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          cards: Json | null
          created_at: string | null
          day_number: number
          day_title: string | null
          estimated_minutes: number | null
          id: string
          program_id: string
          program_slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cards?: Json | null
          created_at?: string | null
          day_number: number
          day_title?: string | null
          estimated_minutes?: number | null
          id?: string
          program_id: string
          program_slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cards?: Json | null
          created_at?: string | null
          day_number?: number
          day_title?: string | null
          estimated_minutes?: number | null
          id?: string
          program_id?: string
          program_slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_progress: {
        Row: {
          completed_at: string
          completed_days: number[] | null
          content_completed: boolean | null
          created_at: string
          current_day: number | null
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
          completed_days?: number[] | null
          content_completed?: boolean | null
          created_at?: string
          current_day?: number | null
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
          completed_days?: number[] | null
          content_completed?: boolean | null
          created_at?: string
          current_day?: number | null
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
      program_progressions: {
        Row: {
          created_at: string
          day_goal: string
          day_number: number
          day_title: string
          id: string
          overrides: Json | null
          phase: string | null
          program_slug: string
          updated_at: string
          variables: Json
        }
        Insert: {
          created_at?: string
          day_goal?: string
          day_number: number
          day_title: string
          id?: string
          overrides?: Json | null
          phase?: string | null
          program_slug: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          created_at?: string
          day_goal?: string
          day_number?: number
          day_title?: string
          id?: string
          overrides?: Json | null
          phase?: string | null
          program_slug?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "program_progressions_program_slug_fkey"
            columns: ["program_slug"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["slug"]
          },
        ]
      }
      program_reflections: {
        Row: {
          card_index: number
          card_type: string
          created_at: string
          day_number: number
          id: string
          program_slug: string
          prompt: string
          reflection: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_index: number
          card_type?: string
          created_at?: string
          day_number: number
          id?: string
          program_slug: string
          prompt: string
          reflection: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_index?: number
          card_type?: string
          created_at?: string
          day_number?: number
          id?: string
          program_slug?: string
          prompt?: string
          reflection?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_templates: {
        Row: {
          created_at: string
          id: string
          program_slug: string
          template_slots: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_slug: string
          template_slots?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          program_slug?: string
          template_slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_templates_program_slug_fkey"
            columns: ["program_slug"]
            isOneToOne: true
            referencedRelation: "programs"
            referencedColumns: ["slug"]
          },
        ]
      }
      programs: {
        Row: {
          category: string | null
          content_mode: string
          created_at: string | null
          description: string | null
          display_order: number | null
          has_audio: boolean | null
          id: string
          is_active: boolean | null
          slug: string | null
          time_slots_enabled: boolean
          title: string
          total_days: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content_mode?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_audio?: boolean | null
          id?: string
          is_active?: boolean | null
          slug?: string | null
          time_slots_enabled?: boolean
          title: string
          total_days?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content_mode?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          has_audio?: boolean | null
          id?: string
          is_active?: boolean | null
          slug?: string | null
          time_slots_enabled?: boolean
          title?: string
          total_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questionnaire_runs: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          journey_key: string
          primary_concern_label: string | null
          questionnaire_answers: Json
          questionnaire_version: string
          recommended_program: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          journey_key: string
          primary_concern_label?: string | null
          questionnaire_answers: Json
          questionnaire_version: string
          recommended_program: string
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          journey_key?: string
          primary_concern_label?: string | null
          questionnaire_answers?: Json
          questionnaire_version?: string
          recommended_program?: string
          source?: string
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
      sales_checkout_sessions: {
        Row: {
          amount_inr: number
          created_at: string
          email: string
          items: Json
          paid_at: string | null
          paid_transaction_id: string | null
          status: string
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_inr: number
          created_at?: string
          email: string
          items?: Json
          paid_at?: string | null
          paid_transaction_id?: string | null
          status?: string
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_inr?: number
          created_at?: string
          email?: string
          items?: Json
          paid_at?: string | null
          paid_transaction_id?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_checkout_sessions_paid_transaction_id_fkey"
            columns: ["paid_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_notification_queue: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          scheduled_for: string
          status: string | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          scheduled_for: string
          status?: string | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          scheduled_for?: string
          status?: string | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      testimonials: {
        Row: {
          age: number | null
          city: string | null
          consent_status: string
          created_at: string
          display_name: string
          id: string
          internal_notes: string | null
          is_active: boolean
          is_featured_homepage: boolean
          program_slug: string | null
          quote: string
          sort_order: number
          source_type: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          city?: string | null
          consent_status?: string
          created_at?: string
          display_name: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_featured_homepage?: boolean
          program_slug?: string | null
          quote: string
          sort_order?: number
          source_type?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          city?: string | null
          consent_status?: string
          created_at?: string
          display_name?: string
          id?: string
          internal_notes?: string | null
          is_active?: boolean
          is_featured_homepage?: boolean
          program_slug?: string | null
          quote?: string
          sort_order?: number
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fulfillment_status: string
          id: string
          items: Json
          metadata: Json | null
          payment_status: string
          provider: string
          provider_order_id: string
          provider_payment_id: string | null
          provider_signature: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fulfillment_status?: string
          id?: string
          items?: Json
          metadata?: Json | null
          payment_status?: string
          provider?: string
          provider_order_id: string
          provider_payment_id?: string | null
          provider_signature?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fulfillment_status?: string
          id?: string
          items?: Json
          metadata?: Json | null
          payment_status?: string
          provider?: string
          provider_order_id?: string
          provider_payment_id?: string | null
          provider_signature?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_day_states: {
        Row: {
          card_details: Json
          cards_completed: number
          cards_opened: number
          cards_total: number
          completion_percentage: number
          created_at: string
          day_number: number
          day_state: string
          finalized_at: string | null
          id: string
          program_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_details?: Json
          cards_completed?: number
          cards_opened?: number
          cards_total?: number
          completion_percentage?: number
          created_at?: string
          day_number: number
          day_state: string
          finalized_at?: string | null
          id?: string
          program_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_details?: Json
          cards_completed?: number
          cards_opened?: number
          cards_total?: number
          completion_percentage?: number
          created_at?: string
          day_number?: number
          day_state?: string
          finalized_at?: string | null
          id?: string
          program_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_day_states_program_slug_fkey"
            columns: ["program_slug"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_events: {
        Row: {
          card_id: string | null
          created_at: string
          day_number: number | null
          event_data: Json
          event_type: string
          id: string
          occurred_at: string
          program_slug: string | null
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          day_number?: number | null
          event_data?: Json
          event_type: string
          id?: string
          occurred_at?: string
          program_slug?: string | null
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          day_number?: number | null
          event_data?: Json
          event_type?: string
          id?: string
          occurred_at?: string
          program_slug?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_program_slug_fkey"
            columns: ["program_slug"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_program_preferences: {
        Row: {
          active_program: string
          created_at: string
          queue_reviewed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_program: string
          created_at?: string
          queue_reviewed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_program?: string
          created_at?: string
          queue_reviewed_at?: string | null
          updated_at?: string
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
      acknowledge_program_queue_review: {
        Args: { p_active_program?: string | null }
        Returns: {
          active_program: string
          queue_reviewed_at: string
          updated_at: string
        }[]
      }
      consume_rate_limit: {
        Args: {
          p_bucket: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      derive_program_state: {
        Args: {
          p_completion_state: string
          p_owned_program: string
          p_paused_at: string
          p_purchase_state: string
          p_scheduled_start_date: string
        }
        Returns: string
      }
      configure_program_start: {
        Args: {
          p_program_id: string
          p_scheduled_start_date: string
        }
        Returns: {
          owned_program: string
          program_state: string
          scheduled_start_date: string
          started_at: string
          updated_at: string
        }[]
      }
      reorder_owned_program_queue: {
        Args: { p_program_ids: string[] }
        Returns: {
          owned_program: string
          priority_rank: number
          program_state: string
          updated_at: string
        }[]
      }
      normalize_owned_program_priority_queue: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      record_owned_program_purchase: {
        Args: { p_program_id: string }
        Returns: {
          completion_state: string
          owned_program: string
          priority_rank: number | null
          program_state: string
          purchase_state: string
          updated_at: string
        }[]
      }
      complete_program_lifecycle: {
        Args: {
          p_completed_at?: string
          p_program_id: string
        }
        Returns: {
          completed_at: string
          completion_state: string
          current_day: number
          owned_program: string
          program_state: string
          purchase_state: string
          updated_at: string
        }[]
      }
      pause_program_manually: {
        Args: {
          p_current_day: number
          p_paused_at?: string
          p_program_id: string
        }
        Returns: {
          current_day: number
          owned_program: string
          paused_at: string
          program_state: string
          updated_at: string
        }[]
      }
      pause_program_for_absence: {
        Args: {
          p_current_day: number
          p_paused_at?: string
          p_program_id: string
        }
        Returns: {
          current_day: number
          owned_program: string
          paused_at: string
          program_state: string
          updated_at: string
        }[]
      }
      resume_program_from_pause: {
        Args: {
          p_program_id: string
          p_scheduled_start_date?: string | null
          p_started_at: string
        }
        Returns: {
          current_day: number
          owned_program: string
          paused_at: string
          program_state: string
          started_at: string
          updated_at: string
        }[]
      }
      swap_active_program: {
        Args: {
          p_reason: string
          p_scheduled_start_date?: string | null
          p_target_program: string
        }
        Returns: {
          active_program: string
          active_program_state: string
          cooldown_until: string
          previous_program: string
          previous_program_state: string
          updated_at: string
        }[]
      }
      select_active_program: {
        Args: { p_program_id: string }
        Returns: {
          active_program: string
          updated_at: string
        }[]
      }
      sync_program_progress:
        | {
            Args: {
              p_archived_at?: string
              p_completed_at?: string
              p_completed_days?: number[]
              p_current_day: number
              p_program_id: string
            }
            Returns: {
              archived_at: string
              completed_at: string
              completed_days: number[]
              current_day: number
            }[]
          }
        | {
            Args: {
              p_archived_at?: string
              p_completed_at?: string
              p_completed_days?: number[]
              p_current_day: number
              p_partial_days?: number[]
              p_program_id: string
            }
            Returns: {
              archived_at: string
              completed_at: string
              completed_days: number[]
              current_day: number
            }[]
          }
      sync_program_progress_v2: {
        Args: {
          p_archived_at?: string
          p_completed_at?: string
          p_completed_days?: number[]
          p_current_day: number
          p_partial_days?: number[]
          p_program_id: string
        }
        Returns: {
          archived_at: string
          completed_at: string
          completed_days: number[]
          current_day: number
        }[]
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
