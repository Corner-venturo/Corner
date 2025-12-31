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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _migrations: {
        Row: {
          executed_at: string | null
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          id?: number
          name: string
        }
        Update: {
          executed_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      accounting_accounts: {
        Row: {
          available_credit: number | null
          balance: number
          color: string | null
          created_at: string | null
          credit_limit: number | null
          currency: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_credit?: number | null
          balance?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_credit?: number | null
          balance?: number
          color?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      accounting_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      accounting_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          deleted_at: string | null
          description: string
          entry_date: string
          entry_number: string
          entry_type: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_method: string | null
          recorded_by: string
          subcategory: string | null
          supplier_id: string | null
          tour_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          deleted_at?: string | null
          description: string
          entry_date: string
          entry_number: string
          entry_type: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          recorded_by: string
          subcategory?: string | null
          supplier_id?: string | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          entry_type?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string
          subcategory?: string | null
          supplier_id?: string | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accounting_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["accounting_event_type"]
          group_id: string | null
          id: string
          memo: string | null
          meta: Json | null
          reversal_event_id: string | null
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["accounting_event_status"] | null
          tour_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["accounting_event_type"]
          group_id?: string | null
          id?: string
          memo?: string | null
          meta?: Json | null
          reversal_event_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["accounting_event_status"] | null
          tour_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["accounting_event_type"]
          group_id?: string | null
          id?: string
          memo?: string | null
          meta?: Json | null
          reversal_event_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["accounting_event_status"] | null
          tour_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_events_reversal_event_id_fkey"
            columns: ["reversal_event_id"]
            isOneToOne: false
            referencedRelation: "accounting_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_events_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_events_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          end_date: string
          id: string
          is_closed: boolean | null
          period_name: string
          start_date: string
          workspace_id: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          is_closed?: boolean | null
          period_name: string
          start_date: string
          workspace_id?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_closed?: boolean | null
          period_name?: string
          start_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_subjects: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          level: number | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          level?: number | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_subjects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounting_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_subjects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_transactions: {
        Row: {
          account_id: string
          account_name: string | null
          amount: number
          category_id: string | null
          category_name: string | null
          created_at: string | null
          currency: string
          date: string
          description: string | null
          id: string
          to_account_id: string | null
          to_account_name: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_name?: string | null
          amount: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string | null
          id?: string
          to_account_id?: string | null
          to_account_name?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_name?: string | null
          amount?: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string | null
          id?: string
          to_account_id?: string | null
          to_account_name?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          details: Json | null
          id: string
          is_active: boolean | null
          level: number | null
          parent_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_code: string
          activity_name: string
          activity_type: string
          adult_cost: number | null
          adult_price: number | null
          child_cost: number | null
          child_price: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          inclusions: string[] | null
          infant_cost: number | null
          infant_price: number | null
          is_active: boolean | null
          notes: string | null
          region_id: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_code: string
          activity_name: string
          activity_type: string
          adult_cost?: number | null
          adult_price?: number | null
          child_cost?: number | null
          child_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          inclusions?: string[] | null
          infant_cost?: number | null
          infant_price?: number | null
          is_active?: boolean | null
          notes?: string | null
          region_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_code?: string
          activity_name?: string
          activity_type?: string
          adult_cost?: number | null
          adult_price?: number | null
          child_cost?: number | null
          child_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          inclusions?: string[] | null
          infant_cost?: number | null
          infant_price?: number | null
          is_active?: boolean | null
          notes?: string | null
          region_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advance_items: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          advance_list_id: string
          advance_person: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          name: string
          payment_request_id: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          advance_list_id: string
          advance_person: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          payment_request_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          advance_list_id?: string
          advance_person?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          payment_request_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_items_advance_list_id_fkey"
            columns: ["advance_list_id"]
            isOneToOne: false
            referencedRelation: "advance_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_items_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_images: {
        Row: {
          id: string
          airport_code: string
          image_url: string
          label: string | null
          season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all' | null
          is_default: boolean
          display_order: number
          uploaded_by: string | null
          workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          airport_code: string
          image_url: string
          label?: string | null
          season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all' | null
          is_default?: boolean
          display_order?: number
          uploaded_by?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          airport_code?: string
          image_url?: string
          label?: string | null
          season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all' | null
          is_default?: boolean
          display_order?: number
          uploaded_by?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "airport_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airport_images_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_lists: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          author_id: string
          channel_id: string
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string
          channel_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string
          channel_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_lists_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_name: string
          id: string
          month: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_name: string
          id?: string
          month: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_name?: string
          id?: string
          month?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          api_service: string
          created_at: string
          id: number
          notes: string | null
        }
        Insert: {
          api_service: string
          created_at?: string
          id?: number
          notes?: string | null
        }
        Update: {
          api_service?: string
          created_at?: string
          id?: number
          notes?: string | null
        }
        Relationships: []
      }
      assigned_itineraries: {
        Row: {
          assigned_date: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          itinerary_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_date: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          itinerary_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          itinerary_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      attractions: {
        Row: {
          address: string | null
          category: string | null
          city_id: string | null
          country_id: string
          created_at: string | null
          data_verified: boolean | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          google_maps_url: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          name_en: string | null
          notes: string | null
          opening_hours: Json | null
          phone: string | null
          region_id: string | null
          tags: string[] | null
          thumbnail: string | null
          ticket_price: string | null
          type: string | null
          updated_at: string | null
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city_id?: string | null
          country_id: string
          created_at?: string | null
          data_verified?: boolean | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          google_maps_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          name_en?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          region_id?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          ticket_price?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city_id?: string | null
          country_id?: string
          created_at?: string | null
          data_verified?: boolean | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          google_maps_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_en?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          region_id?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          ticket_price?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attractions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attractions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attractions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attractions_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_definitions: {
        Row: {
          category: string | null
          created_at: string
          description: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirements: Json | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          icon_url?: string | null
          id: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirements?: Json | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirements?: Json | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string | null
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_left_cm: number | null
          arm_right_cm: number | null
          bmi: number | null
          body_fat_percentage: number | null
          calf_left_cm: number | null
          calf_right_cm: number | null
          chest_cm: number | null
          created_at: string
          date: string
          hip_cm: number | null
          id: string
          muscle_mass: number | null
          notes: string | null
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          updated_at: string
          user_id: string
          waist_cm: number | null
          weight: number | null
          workspace_id: string | null
        }
        Insert: {
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          hip_cm?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          weight?: number | null
          workspace_id?: string | null
        }
        Update: {
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          hip_cm?: number | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          weight?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          period: string
          spent: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          period: string
          spent?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          period?: string
          spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletins: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          priority: number | null
          title: string
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: string[] | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end: string
          id: string
          owner_id: string
          recurring: string | null
          recurring_until: string | null
          related_order_id: string | null
          related_tour_id: string | null
          reminder_minutes: number | null
          start: string
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendees?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end: string
          id?: string
          owner_id: string
          recurring?: string | null
          recurring_until?: string | null
          related_order_id?: string | null
          related_tour_id?: string | null
          reminder_minutes?: number | null
          start: string
          title: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendees?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end?: string
          id?: string
          owner_id?: string
          recurring?: string | null
          recurring_until?: string | null
          related_order_id?: string | null
          related_tour_id?: string | null
          reminder_minutes?: number | null
          start?: string
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      casual_trips: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          destination: string | null
          end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          visibility: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_groups: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          created_at: string | null
          id: string
          is_collapsed: boolean | null
          is_system: boolean | null
          name: string
          order: number | null
          system_type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_system?: boolean | null
          name: string
          order?: number | null
          system_type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          id?: string
          is_collapsed?: boolean | null
          is_system?: boolean | null
          name?: string
          order?: number | null
          system_type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          created_at: string | null
          employee_id: string
          id: string
          role: string
          status: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_threads: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          channel_id: string
          created_at: string | null
          created_by: string
          id: string
          is_archived: boolean | null
          last_reply_at: string | null
          name: string
          reply_count: number | null
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          channel_id: string
          created_at?: string | null
          created_by: string
          id?: string
          is_archived?: boolean | null
          last_reply_at?: string | null
          name: string
          reply_count?: number | null
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          channel_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_archived?: boolean | null
          last_reply_at?: string | null
          name?: string
          reply_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_threads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          archived_at: string | null
          channel_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          is_announcement: boolean
          is_archived: boolean | null
          is_company_wide: boolean | null
          is_favorite: boolean | null
          is_pinned: boolean | null
          name: string
          order: number | null
          scope: string | null
          tour_id: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          visibility: Database["public"]["Enums"]["channel_visibility"] | null
          workspace_id: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived_at?: string | null
          channel_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_announcement?: boolean
          is_archived?: boolean | null
          is_company_wide?: boolean | null
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          name: string
          order?: number | null
          scope?: string | null
          tour_id?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["channel_visibility"] | null
          workspace_id: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived_at?: string | null
          channel_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_announcement?: boolean
          is_archived?: boolean | null
          is_company_wide?: boolean | null
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          name?: string
          order?: number | null
          scope?: string | null
          tour_id?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["channel_visibility"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "channel_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system_locked: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          account_type: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_locked?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_locked?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          airport_code: string | null
          background_image_url: string | null
          background_image_url_2: string | null
          country_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_major: boolean | null
          name: string
          name_en: string | null
          parent_city_id: string | null
          primary_image: number | null
          region_id: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          airport_code?: string | null
          background_image_url?: string | null
          background_image_url_2?: string | null
          country_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          is_major?: boolean | null
          name: string
          name_en?: string | null
          parent_city_id?: string | null
          primary_image?: number | null
          region_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          airport_code?: string | null
          background_image_url?: string | null
          background_image_url_2?: string | null
          country_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_major?: boolean | null
          name?: string
          name_en?: string | null
          parent_city_id?: string | null
          primary_image?: number | null
          region_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_parent_city_id_fkey"
            columns: ["parent_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          address: string | null
          annual_travel_budget: number | null
          code: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          email: string | null
          employee_count: number | null
          fax: string | null
          id: string
          industry: string | null
          is_vip: boolean | null
          last_order_date: string | null
          name: string
          name_en: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string | null
          tax_id: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
          vip_level: number | null
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          address?: string | null
          annual_travel_budget?: number | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          employee_count?: number | null
          fax?: string | null
          id?: string
          industry?: string | null
          is_vip?: boolean | null
          last_order_date?: string | null
          name: string
          name_en?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_level?: number | null
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          address?: string | null
          annual_travel_budget?: number | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          employee_count?: number | null
          fax?: string | null
          id?: string
          industry?: string | null
          is_vip?: boolean | null
          last_order_date?: string | null
          name?: string
          name_en?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_level?: number | null
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_announcements: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          expire_date: string | null
          id: string
          is_pinned: boolean | null
          priority: number | null
          publish_date: string | null
          read_by: string[] | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          updated_by: string | null
          visibility: string | null
          visible_to_employees: string[] | null
          visible_to_roles: string[] | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expire_date?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: number | null
          publish_date?: string | null
          read_by?: string[] | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
          visible_to_employees?: string[] | null
          visible_to_roles?: string[] | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expire_date?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: number | null
          publish_date?: string | null
          read_by?: string[] | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
          visible_to_employees?: string[] | null
          visible_to_roles?: string[] | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_announcements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_assets: {
        Row: {
          asset_type: string | null
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          restricted: boolean | null
          updated_at: string | null
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          restricted?: boolean | null
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          restricted?: boolean | null
          updated_at?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: []
      }
      company_contacts: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          line_id: string | null
          mobile: string | null
          name: string
          name_en: string | null
          notes: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          line_id?: string | null
          mobile?: string | null
          name: string
          name_en?: string | null
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          line_id?: string | null
          mobile?: string | null
          name?: string
          name_en?: string | null
          notes?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmations: {
        Row: {
          booking_number: string
          confirmation_number: string | null
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          notes: string | null
          status: string | null
          type: Database["public"]["Enums"]["confirmation_type"]
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          booking_number: string
          confirmation_number?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          notes?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["confirmation_type"]
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          booking_number?: string
          confirmation_number?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          notes?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["confirmation_type"]
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_templates: {
        Row: {
          attraction_id: string | null
          base_distance_km: number | null
          base_hours: number | null
          capacity: number | null
          category: string
          city_id: string
          cost_price: number
          created_at: string | null
          created_by: string | null
          currency: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          extra_km_rate: number | null
          id: string
          is_active: boolean | null
          item_name: string
          item_name_en: string | null
          max_quantity: number | null
          min_quantity: number | null
          notes: string | null
          overtime_rate: number | null
          route_destination: string | null
          route_origin: string | null
          season: string | null
          selling_price: number | null
          supplier_id: string
          trip_type: string | null
          unit: string
          updated_at: string | null
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
          vehicle_type: string | null
        }
        Insert: {
          attraction_id?: string | null
          base_distance_km?: number | null
          base_hours?: number | null
          capacity?: number | null
          category: string
          city_id: string
          cost_price: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          extra_km_rate?: number | null
          id?: string
          is_active?: boolean | null
          item_name: string
          item_name_en?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          overtime_rate?: number | null
          route_destination?: string | null
          route_origin?: string | null
          season?: string | null
          selling_price?: number | null
          supplier_id: string
          trip_type?: string | null
          unit: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vehicle_type?: string | null
        }
        Update: {
          attraction_id?: string | null
          base_distance_km?: number | null
          base_hours?: number | null
          capacity?: number | null
          category?: string
          city_id?: string
          cost_price?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          extra_km_rate?: number | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          item_name_en?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          overtime_rate?: number | null
          route_destination?: string | null
          route_origin?: string | null
          season?: string | null
          selling_price?: number | null
          supplier_id?: string
          trip_type?: string | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_templates_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_templates_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_templates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string | null
          created_at: string | null
          display_order: number | null
          emoji: string | null
          has_regions: boolean | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          has_regions?: boolean | null
          id: string
          is_active?: boolean | null
          name: string
          name_en: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          has_regions?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cover_templates: {
        Row: {
          component_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_execution_logs: {
        Row: {
          error_message: string | null
          executed_at: string | null
          id: string
          job_name: string
          result: Json | null
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          id?: string
          job_name: string
          result?: Json | null
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          id?: string
          job_name?: string
          result?: Json | null
          success?: boolean | null
        }
        Relationships: []
      }
      customer_assigned_itineraries: {
        Row: {
          assigned_date: string
          created_at: string
          customer_id: string
          esim_url: string | null
          id: string
          itinerary_id: string
          notes: string | null
          order_id: string | null
          payment_details: Json | null
          room_allocation: Json | null
          status: string
          updated_at: string
          visa_status: string | null
          workspace_id: string | null
        }
        Insert: {
          assigned_date: string
          created_at?: string
          customer_id: string
          esim_url?: string | null
          id?: string
          itinerary_id: string
          notes?: string | null
          order_id?: string | null
          payment_details?: Json | null
          room_allocation?: Json | null
          status?: string
          updated_at?: string
          visa_status?: string | null
          workspace_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string
          customer_id?: string
          esim_url?: string | null
          id?: string
          itinerary_id?: string
          notes?: string | null
          order_id?: string | null
          payment_details?: Json | null
          room_allocation?: Json | null
          status?: string
          updated_at?: string
          visa_status?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_assigned_itineraries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assigned_itineraries_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assigned_itineraries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assigned_itineraries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_badges: {
        Row: {
          badge_id: string
          customer_id: string
          earned_at: string | null
          id: string
        }
        Insert: {
          badge_id: string
          customer_id: string
          earned_at?: string | null
          id?: string
        }
        Update: {
          badge_id?: string
          customer_id?: string
          earned_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_badges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_travel_cards: {
        Row: {
          created_at: string | null
          customer_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          label_zh: string | null
          sort_order: number | null
          template_id: string | null
          translations: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_zh?: string | null
          sort_order?: number | null
          template_id?: string | null
          translations?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_zh?: string | null
          sort_order?: number | null
          template_id?: string | null
          translations?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_travel_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_travel_cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "travel_card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          alternative_phone: string | null
          avatar_url: string | null
          city: string | null
          code: string
          company: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          dietary_restrictions: string | null
          email: string | null
          emergency_contact: Json | null
          english_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_vip: boolean | null
          last_order_date: string | null
          linked_at: string | null
          linked_method: string | null
          member_type: string
          name: string
          national_id: string | null
          nationality: string | null
          nickname: string | null
          notes: string | null
          passport_expiry_date: string | null
          passport_image_url: string | null
          passport_number: string | null
          passport_romanization: string | null
          phone: string | null
          referred_by: string | null
          sex: string | null
          source: string | null
          tax_id: string | null
          total_orders: number | null
          total_points: number | null
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          vip_level: string | null
          workspace_id: string | null
        }
        Insert: {
          address?: string | null
          alternative_phone?: string | null
          avatar_url?: string | null
          city?: string | null
          code: string
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact?: Json | null
          english_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_vip?: boolean | null
          last_order_date?: string | null
          linked_at?: string | null
          linked_method?: string | null
          member_type?: string
          name: string
          national_id?: string | null
          nationality?: string | null
          nickname?: string | null
          notes?: string | null
          passport_expiry_date?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          passport_romanization?: string | null
          phone?: string | null
          referred_by?: string | null
          sex?: string | null
          source?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          vip_level?: string | null
          workspace_id?: string | null
        }
        Update: {
          address?: string | null
          alternative_phone?: string | null
          avatar_url?: string | null
          city?: string | null
          code?: string
          company?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact?: Json | null
          english_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_vip?: boolean | null
          last_order_date?: string | null
          linked_at?: string | null
          linked_method?: string | null
          member_type?: string
          name?: string
          national_id?: string | null
          nationality?: string | null
          nickname?: string | null
          notes?: string | null
          passport_expiry_date?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          passport_romanization?: string | null
          phone?: string | null
          referred_by?: string | null
          sex?: string | null
          source?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_points?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          vip_level?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_requests: {
        Row: {
          assigned_itinerary_id: string
          created_at: string
          customer_id: string
          handled_at: string | null
          handled_by: string | null
          id: string
          request_text: string
          response_text: string | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          assigned_itinerary_id: string
          created_at?: string
          customer_id: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          request_text: string
          response_text?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          assigned_itinerary_id?: string
          created_at?: string
          customer_id?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          request_text?: string
          response_text?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_requests_assigned_itinerary_id_fkey"
            columns: ["assigned_itinerary_id"]
            isOneToOne: false
            referencedRelation: "customer_assigned_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_requests_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_templates: {
        Row: {
          component_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      disbursement_orders: {
        Row: {
          amount: number
          code: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          disbursement_date: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          notes: string | null
          order_number: string | null
          payment_method: string | null
          payment_request_ids: string[] | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          amount: number
          code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          disbursement_date?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_request_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          disbursement_date?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_request_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      disbursement_requests: {
        Row: {
          created_at: string | null
          disbursement_order_id: string
          id: string
          payment_request_id: string
        }
        Insert: {
          created_at?: string | null
          disbursement_order_id: string
          id?: string
          payment_request_id: string
        }
        Update: {
          created_at?: string | null
          disbursement_order_id?: string
          id?: string
          payment_request_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          attendance: Json | null
          avatar: string | null
          avatar_url: string | null
          chinese_name: string | null
          contracts: Json | null
          created_at: string | null
          display_name: string | null
          email: string | null
          employee_number: string
          english_name: string | null
          hidden_menu_items: string[] | null
          id: string
          is_active: boolean | null
          job_info: Json | null
          last_login_at: string | null
          monthly_salary: number | null
          password_hash: string | null
          permissions: string[] | null
          personal_info: Json | null
          preferred_features: Json | null
          roles: string[] | null
          salary_info: Json | null
          status: string | null
          supabase_user_id: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          attendance?: Json | null
          avatar?: string | null
          avatar_url?: string | null
          chinese_name?: string | null
          contracts?: Json | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          employee_number: string
          english_name?: string | null
          hidden_menu_items?: string[] | null
          id?: string
          is_active?: boolean | null
          job_info?: Json | null
          last_login_at?: string | null
          monthly_salary?: number | null
          password_hash?: string | null
          permissions?: string[] | null
          personal_info?: Json | null
          preferred_features?: Json | null
          roles?: string[] | null
          salary_info?: Json | null
          status?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          attendance?: Json | null
          avatar?: string | null
          avatar_url?: string | null
          chinese_name?: string | null
          contracts?: Json | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          employee_number?: string
          english_name?: string | null
          hidden_menu_items?: string[] | null
          id?: string
          is_active?: boolean | null
          job_info?: Json | null
          last_login_at?: string | null
          monthly_salary?: number | null
          password_hash?: string | null
          permissions?: string[] | null
          personal_info?: Json | null
          preferred_features?: Json | null
          roles?: string[] | null
          salary_info?: Json | null
          status?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_bank_accounts: {
        Row: {
          account_id: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_bank_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      esims: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          esim_number: string
          group_code: string
          id: string
          note: string | null
          order_number: string | null
          price: number | null
          product_id: string | null
          quantity: number
          status: number
          supplier_order_number: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          esim_number: string
          group_code: string
          id?: string
          note?: string | null
          order_number?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number
          status?: number
          supplier_order_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          esim_number?: string
          group_code?: string
          id?: string
          note?: string | null
          order_number?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number
          status?: number
          supplier_order_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esims_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      eyeline_submissions: {
        Row: {
          created_at: string
          id: string
          points_awarded: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_content: Json
          submission_type: string
          target_entity_info: Json
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_content: Json
          submission_type: string
          target_entity_info: Json
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_content?: Json
          submission_type?: string
          target_entity_info?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eyeline_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eyeline_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eyeline_submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      features_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fitness_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number | null
          description: string | null
          exercise_id: number | null
          exercise_name: string | null
          goal_type: string
          id: string
          notes: string | null
          progress_percentage: number | null
          status: string
          target_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          exercise_id?: number | null
          exercise_name?: string | null
          goal_type: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          exercise_id?: number | null
          exercise_name?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fitness_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_status_subscriptions: {
        Row: {
          airline_code: string
          created_at: string | null
          external_provider: string | null
          external_subscription_id: string | null
          flight_date: string
          flight_number: string
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          notify_channel_id: string | null
          notify_employee_ids: string[] | null
          notify_on: string[] | null
          pnr_id: string | null
          segment_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          airline_code: string
          created_at?: string | null
          external_provider?: string | null
          external_subscription_id?: string | null
          flight_date: string
          flight_number: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          notify_channel_id?: string | null
          notify_employee_ids?: string[] | null
          notify_on?: string[] | null
          pnr_id?: string | null
          segment_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          airline_code?: string
          created_at?: string | null
          external_provider?: string | null
          external_subscription_id?: string | null
          flight_date?: string
          flight_number?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          notify_channel_id?: string | null
          notify_employee_ids?: string[] | null
          notify_on?: string[] | null
          pnr_id?: string | null
          segment_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_status_subscriptions_notify_channel_id_fkey"
            columns: ["notify_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_status_subscriptions_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_status_subscriptions_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "pnr_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_status_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_templates: {
        Row: {
          component_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      general_ledger: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          id: string
          month: number
          opening_balance: number | null
          subject_id: string
          total_credit: number | null
          total_debit: number | null
          updated_at: string | null
          workspace_id: string
          year: number
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          month: number
          opening_balance?: number | null
          subject_id: string
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
          workspace_id: string
          year: number
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          id?: string
          month?: number
          opening_balance?: number | null
          subject_id?: string
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "general_ledger_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "accounting_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      heroic_summon_history: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string | null
          employee_id: string
          energy_profile: Json | null
          id: string
          result_description: string | null
          result_id: string | null
          result_type: string | null
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          energy_profile?: Json | null
          id?: string
          result_description?: string | null
          result_id?: string | null
          result_type?: string | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          energy_profile?: Json | null
          id?: string
          result_description?: string | null
          result_id?: string | null
          result_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heroic_summon_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heroic_summon_history_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "heroic_summon_results"
            referencedColumns: ["id"]
          },
        ]
      }
      heroic_summon_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          current_phase: number | null
          current_question: number | null
          employee_id: string
          energy_profile: Json | null
          id: string
          is_completed: boolean | null
          last_updated_at: string | null
          phase_1_completed: boolean | null
          phase_2_completed: boolean | null
          phase_3_completed: boolean | null
          phase_4_completed: boolean | null
          phase_5_completed: boolean | null
          phase_6_completed: boolean | null
          result_description: string | null
          result_type: string | null
          started_at: string | null
          total_answered: number | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: number | null
          current_question?: number | null
          employee_id: string
          energy_profile?: Json | null
          id?: string
          is_completed?: boolean | null
          last_updated_at?: string | null
          phase_1_completed?: boolean | null
          phase_2_completed?: boolean | null
          phase_3_completed?: boolean | null
          phase_4_completed?: boolean | null
          phase_5_completed?: boolean | null
          phase_6_completed?: boolean | null
          result_description?: string | null
          result_type?: string | null
          started_at?: string | null
          total_answered?: number | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: number | null
          current_question?: number | null
          employee_id?: string
          energy_profile?: Json | null
          id?: string
          is_completed?: boolean | null
          last_updated_at?: string | null
          phase_1_completed?: boolean | null
          phase_2_completed?: boolean | null
          phase_3_completed?: boolean | null
          phase_4_completed?: boolean | null
          phase_5_completed?: boolean | null
          phase_6_completed?: boolean | null
          result_description?: string | null
          result_type?: string | null
          started_at?: string | null
          total_answered?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heroic_summon_results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      image_library: {
        Row: {
          attraction_id: string | null
          category: string | null
          city_id: string | null
          country_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          name: string
          public_url: string
          tags: string[] | null
          updated_at: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          attraction_id?: string | null
          category?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name: string
          public_url: string
          tags?: string[] | null
          updated_at?: string
          width?: number | null
          workspace_id: string
        }
        Update: {
          attraction_id?: string | null
          category?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          public_url?: string
          tags?: string[] | null
          updated_at?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_library_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          archived_at: string | null
          author_name: string | null
          cancellation_policy: string[] | null
          city: string | null
          closed_at: string | null
          code: string | null
          country: string | null
          cover_image: string | null
          cover_style: string | null
          cover_template_id: string | null
          created_at: string
          created_by: string | null
          creator_user_id: string | null
          daily_itinerary: Json | null
          daily_template_id: string | null
          departure_date: string | null
          description: string | null
          duration_days: number | null
          erp_itinerary_id: string | null
          faqs: Json | null
          features: Json | null
          features_style: string | null
          flight_style: string | null
          flight_template_id: string | null
          focus_cards: Json | null
          hotel_style: string | null
          hotels: Json | null
          id: string
          is_latest: boolean | null
          is_template: boolean | null
          itinerary_style: string | null
          itinerary_subtitle: string | null
          leader: Json | null
          leader_style: string | null
          meeting_info: Json | null
          notices: string[] | null
          outbound_flight: Json | null
          parent_id: string | null
          price: string | null
          price_note: string | null
          price_tiers: Json | null
          pricing_details: Json | null
          pricing_style: string | null
          return_flight: Json | null
          show_cancellation_policy: boolean | null
          show_faqs: boolean | null
          show_features: boolean | null
          show_hotels: boolean | null
          show_leader_meeting: boolean | null
          show_notices: boolean | null
          show_price_tiers: boolean | null
          show_pricing_details: boolean | null
          status: string | null
          subtitle: string | null
          summary: string | null
          tagline: string | null
          title: string | null
          tour_code: string | null
          tour_id: string | null
          updated_at: string
          updated_by: string | null
          version: number | null
          version_records: Json | null
          workspace_id: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived_at?: string | null
          author_name?: string | null
          cancellation_policy?: string[] | null
          city?: string | null
          closed_at?: string | null
          code?: string | null
          country?: string | null
          cover_image?: string | null
          cover_style?: string | null
          cover_template_id?: string | null
          created_at?: string
          created_by?: string | null
          creator_user_id?: string | null
          daily_itinerary?: Json | null
          daily_template_id?: string | null
          departure_date?: string | null
          description?: string | null
          duration_days?: number | null
          erp_itinerary_id?: string | null
          faqs?: Json | null
          features?: Json | null
          features_style?: string | null
          flight_style?: string | null
          flight_template_id?: string | null
          focus_cards?: Json | null
          hotel_style?: string | null
          hotels?: Json | null
          id?: string
          is_latest?: boolean | null
          is_template?: boolean | null
          itinerary_style?: string | null
          itinerary_subtitle?: string | null
          leader?: Json | null
          leader_style?: string | null
          meeting_info?: Json | null
          notices?: string[] | null
          outbound_flight?: Json | null
          parent_id?: string | null
          price?: string | null
          price_note?: string | null
          price_tiers?: Json | null
          pricing_details?: Json | null
          pricing_style?: string | null
          return_flight?: Json | null
          show_cancellation_policy?: boolean | null
          show_faqs?: boolean | null
          show_features?: boolean | null
          show_hotels?: boolean | null
          show_leader_meeting?: boolean | null
          show_notices?: boolean | null
          show_price_tiers?: boolean | null
          show_pricing_details?: boolean | null
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          tagline?: string | null
          title?: string | null
          tour_code?: string | null
          tour_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number | null
          version_records?: Json | null
          workspace_id: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived_at?: string | null
          author_name?: string | null
          cancellation_policy?: string[] | null
          city?: string | null
          closed_at?: string | null
          code?: string | null
          country?: string | null
          cover_image?: string | null
          cover_style?: string | null
          cover_template_id?: string | null
          created_at?: string
          created_by?: string | null
          creator_user_id?: string | null
          daily_itinerary?: Json | null
          daily_template_id?: string | null
          departure_date?: string | null
          description?: string | null
          duration_days?: number | null
          erp_itinerary_id?: string | null
          faqs?: Json | null
          features?: Json | null
          features_style?: string | null
          flight_style?: string | null
          flight_template_id?: string | null
          focus_cards?: Json | null
          hotel_style?: string | null
          hotels?: Json | null
          id?: string
          is_latest?: boolean | null
          is_template?: boolean | null
          itinerary_style?: string | null
          itinerary_subtitle?: string | null
          leader?: Json | null
          leader_style?: string | null
          meeting_info?: Json | null
          notices?: string[] | null
          outbound_flight?: Json | null
          parent_id?: string | null
          price?: string | null
          price_note?: string | null
          price_tiers?: Json | null
          pricing_details?: Json | null
          pricing_style?: string | null
          return_flight?: Json | null
          show_cancellation_policy?: boolean | null
          show_faqs?: boolean | null
          show_features?: boolean | null
          show_hotels?: boolean | null
          show_leader_meeting?: boolean | null
          show_notices?: boolean | null
          show_price_tiers?: boolean | null
          show_pricing_details?: boolean | null
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          tagline?: string | null
          title?: string | null
          tour_code?: string | null
          tour_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number | null
          version_records?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_itineraries_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_itineraries_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_itineraries_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_cover_template_id_fkey"
            columns: ["cover_template_id"]
            isOneToOne: false
            referencedRelation: "cover_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_daily_template_id_fkey"
            columns: ["daily_template_id"]
            isOneToOne: false
            referencedRelation: "daily_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_flight_template_id_fkey"
            columns: ["flight_template_id"]
            isOneToOne: false
            referencedRelation: "flight_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itineraries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          created_at: string
          day_number: number
          description: string | null
          id: string
          itinerary_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          itinerary_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          itinerary_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          attraction_id: string | null
          booking_details: Json | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          image_url: string | null
          item_order: number
          item_type: string
          itinerary_day_id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          attraction_id?: string | null
          booking_details?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          item_order?: number
          item_type: string
          itinerary_day_id: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          attraction_id?: string | null
          booking_details?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          item_order?: number
          item_type?: string
          itinerary_day_id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_attraction_id_fkey"
            columns: ["attraction_id"]
            isOneToOne: false
            referencedRelation: "attractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_itinerary_day_id_fkey"
            columns: ["itinerary_day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      Itinerary_Permissions: {
        Row: {
          created_at: string | null
          id: number
          itinerary_id: string
          permission_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          itinerary_id: string
          permission_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          itinerary_id?: string
          permission_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Itinerary_Permissions_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          line_no: number
          subledger_id: string | null
          subledger_type: Database["public"]["Enums"]["subledger_type"] | null
          voucher_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          line_no: number
          subledger_id?: string | null
          subledger_type?: Database["public"]["Enums"]["subledger_type"] | null
          voucher_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          line_no?: number
          subledger_id?: string | null
          subledger_type?: Database["public"]["Enums"]["subledger_type"] | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "journal_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_vouchers: {
        Row: {
          company_unit: string | null
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          memo: string | null
          status: Database["public"]["Enums"]["voucher_status"] | null
          total_credit: number | null
          total_debit: number | null
          updated_at: string | null
          voucher_date: string
          voucher_no: string
          workspace_id: string | null
        }
        Insert: {
          company_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          memo?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
          voucher_date: string
          voucher_no: string
          workspace_id?: string | null
        }
        Update: {
          company_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          memo?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string | null
          voucher_date?: string
          voucher_no?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_vouchers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "accounting_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_vouchers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      linkpay_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          link: string | null
          linkpay_order_number: string | null
          payment_name: string | null
          price: number
          receipt_number: string
          status: number | null
          sync_status: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          linkpay_order_number?: string | null
          payment_name?: string | null
          price: number
          receipt_number: string
          status?: number | null
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          linkpay_order_number?: string | null
          payment_name?: string | null
          price?: number
          receipt_number?: string
          status?: number | null
          sync_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkpay_logs_receipt_number_fkey"
            columns: ["receipt_number"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["receipt_number"]
          },
          {
            foreignKeyName: "linkpay_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      luxury_hotels: {
        Row: {
          address: string | null
          address_en: string | null
          airport_transfer: boolean | null
          amenities: string[] | null
          avg_price_per_night: number | null
          awards: string[] | null
          best_seasons: string[] | null
          booking_contact: string | null
          booking_email: string | null
          booking_phone: string | null
          brand: string | null
          butler_service: boolean | null
          category: string | null
          certifications: string[] | null
          city_id: string
          commission_rate: number | null
          concierge_service: boolean | null
          country_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          description_en: string | null
          dining_options: string[] | null
          display_order: number | null
          facilities: Json | null
          google_maps_url: string | null
          group_friendly: boolean | null
          group_rate_available: boolean | null
          has_michelin_restaurant: boolean | null
          highlights: string[] | null
          hotel_class: string | null
          id: string
          images: string[] | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          max_group_size: number | null
          min_rooms_for_group: number | null
          name: string
          name_en: string | null
          name_local: string | null
          notes: string | null
          price_range: string | null
          region_id: string | null
          restaurants_count: number | null
          room_types: Json | null
          star_rating: number | null
          thumbnail: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          airport_transfer?: boolean | null
          amenities?: string[] | null
          avg_price_per_night?: number | null
          awards?: string[] | null
          best_seasons?: string[] | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          brand?: string | null
          butler_service?: boolean | null
          category?: string | null
          certifications?: string[] | null
          city_id: string
          commission_rate?: number | null
          concierge_service?: boolean | null
          country_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dining_options?: string[] | null
          display_order?: number | null
          facilities?: Json | null
          google_maps_url?: string | null
          group_friendly?: boolean | null
          group_rate_available?: boolean | null
          has_michelin_restaurant?: boolean | null
          highlights?: string[] | null
          hotel_class?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          min_rooms_for_group?: number | null
          name: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          price_range?: string | null
          region_id?: string | null
          restaurants_count?: number | null
          room_types?: Json | null
          star_rating?: number | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_en?: string | null
          airport_transfer?: boolean | null
          amenities?: string[] | null
          avg_price_per_night?: number | null
          awards?: string[] | null
          best_seasons?: string[] | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          brand?: string | null
          butler_service?: boolean | null
          category?: string | null
          certifications?: string[] | null
          city_id?: string
          commission_rate?: number | null
          concierge_service?: boolean | null
          country_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dining_options?: string[] | null
          display_order?: number | null
          facilities?: Json | null
          google_maps_url?: string | null
          group_friendly?: boolean | null
          group_rate_available?: boolean | null
          has_michelin_restaurant?: boolean | null
          highlights?: string[] | null
          hotel_class?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          min_rooms_for_group?: number | null
          name?: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          price_range?: string | null
          region_id?: string | null
          restaurants_count?: number | null
          room_types?: Json | null
          star_rating?: number | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "luxury_hotels_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luxury_hotels_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luxury_hotels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luxury_hotels_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "luxury_hotels_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      manifestation_records: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          record_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          record_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          record_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifestation_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          add_ons: string[] | null
          address: string | null
          assigned_room: string | null
          birthday: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          created_at: string | null
          dietary_requirements: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          english_name: string | null
          gender: string | null
          hotel_confirmation: string | null
          id: string
          id_number: string | null
          is_active: boolean | null
          is_child_no_bed: boolean | null
          medical_conditions: string | null
          member_type: string | null
          name: string
          name_en: string | null
          national_id: string | null
          notes: string | null
          order_id: string | null
          passport_expiry: string | null
          passport_image_url: string | null
          passport_number: string | null
          phone: string | null
          refunds: string[] | null
          reservation_code: string | null
          room_preference: string | null
          room_type: string | null
          roommate: string | null
          special_requests: string | null
          tour_id: string | null
          updated_at: string | null
        }
        Insert: {
          add_ons?: string[] | null
          address?: string | null
          assigned_room?: string | null
          birthday?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          english_name?: string | null
          gender?: string | null
          hotel_confirmation?: string | null
          id: string
          id_number?: string | null
          is_active?: boolean | null
          is_child_no_bed?: boolean | null
          medical_conditions?: string | null
          member_type?: string | null
          name: string
          name_en?: string | null
          national_id?: string | null
          notes?: string | null
          order_id?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          phone?: string | null
          refunds?: string[] | null
          reservation_code?: string | null
          room_preference?: string | null
          room_type?: string | null
          roommate?: string | null
          special_requests?: string | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Update: {
          add_ons?: string[] | null
          address?: string | null
          assigned_room?: string | null
          birthday?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          english_name?: string | null
          gender?: string | null
          hotel_confirmation?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean | null
          is_child_no_bed?: boolean | null
          medical_conditions?: string | null
          member_type?: string | null
          name?: string
          name_en?: string | null
          national_id?: string | null
          notes?: string | null
          order_id?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_number?: string | null
          phone?: string | null
          refunds?: string[] | null
          reservation_code?: string | null
          room_preference?: string | null
          room_type?: string | null
          roommate?: string | null
          special_requests?: string | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          attachments: Json | null
          author: Json | null
          author_id: string | null
          channel_id: string
          content: string
          created_at: string | null
          created_by: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          last_reply_at: string | null
          parent_message_id: string | null
          reactions: Json | null
          reply_count: number | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          attachments?: Json | null
          author?: Json | null
          author_id?: string | null
          channel_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          last_reply_at?: string | null
          parent_message_id?: string | null
          reactions?: Json | null
          reply_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          attachments?: Json | null
          author?: Json | null
          author_id?: string | null
          channel_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          last_reply_at?: string | null
          parent_message_id?: string | null
          reactions?: Json | null
          reply_count?: number | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      michelin_restaurants: {
        Row: {
          address: string | null
          address_en: string | null
          avg_price_dinner: number | null
          avg_price_lunch: number | null
          awards: string[] | null
          best_season: string[] | null
          bib_gourmand: boolean | null
          booking_contact: string | null
          booking_email: string | null
          booking_notes: string | null
          chef_name: string | null
          chef_profile: string | null
          city_id: string
          commission_rate: number | null
          country_id: string
          created_at: string | null
          created_by: string | null
          cuisine_type: string[] | null
          currency: string | null
          description: string | null
          description_en: string | null
          dining_restrictions: Json | null
          dining_style: string | null
          display_order: number | null
          dress_code: string | null
          email: string | null
          facilities: Json | null
          google_maps_url: string | null
          green_star: boolean | null
          group_menu_available: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          max_group_size: number | null
          menu_images: string[] | null
          michelin_guide_year: number | null
          michelin_plate: boolean | null
          michelin_stars: number | null
          min_group_size: number | null
          name: string
          name_en: string | null
          name_local: string | null
          notes: string | null
          opening_hours: Json | null
          phone: string | null
          price_range: string | null
          ratings: Json | null
          recommended_for: string[] | null
          region_id: string | null
          reservation_required: boolean | null
          reservation_url: string | null
          signature_dishes: string[] | null
          specialties: string[] | null
          thumbnail: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          avg_price_dinner?: number | null
          avg_price_lunch?: number | null
          awards?: string[] | null
          best_season?: string[] | null
          bib_gourmand?: boolean | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_notes?: string | null
          chef_name?: string | null
          chef_profile?: string | null
          city_id: string
          commission_rate?: number | null
          country_id: string
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string[] | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dining_restrictions?: Json | null
          dining_style?: string | null
          display_order?: number | null
          dress_code?: string | null
          email?: string | null
          facilities?: Json | null
          google_maps_url?: string | null
          green_star?: boolean | null
          group_menu_available?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          menu_images?: string[] | null
          michelin_guide_year?: number | null
          michelin_plate?: boolean | null
          michelin_stars?: number | null
          min_group_size?: number | null
          name: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          ratings?: Json | null
          recommended_for?: string[] | null
          region_id?: string | null
          reservation_required?: boolean | null
          reservation_url?: string | null
          signature_dishes?: string[] | null
          specialties?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_en?: string | null
          avg_price_dinner?: number | null
          avg_price_lunch?: number | null
          awards?: string[] | null
          best_season?: string[] | null
          bib_gourmand?: boolean | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_notes?: string | null
          chef_name?: string | null
          chef_profile?: string | null
          city_id?: string
          commission_rate?: number | null
          country_id?: string
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string[] | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dining_restrictions?: Json | null
          dining_style?: string | null
          display_order?: number | null
          dress_code?: string | null
          email?: string | null
          facilities?: Json | null
          google_maps_url?: string | null
          green_star?: boolean | null
          group_menu_available?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          menu_images?: string[] | null
          michelin_guide_year?: number | null
          michelin_plate?: boolean | null
          michelin_stars?: number | null
          min_group_size?: number | null
          name?: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          ratings?: Json | null
          recommended_for?: string[] | null
          region_id?: string | null
          reservation_required?: boolean | null
          reservation_url?: string | null
          signature_dishes?: string[] | null
          specialties?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "michelin_restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "michelin_restaurants_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "michelin_restaurants_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          tab_id: string
          tab_name: string
          tab_order: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          tab_id: string
          tab_name?: string
          tab_order?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          tab_id?: string
          tab_name?: string
          tab_order?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      order_members: {
        Row: {
          age: number | null
          balance_amount: number | null
          balance_receipt_no: string | null
          birth_date: string | null
          chinese_name: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deposit_amount: number | null
          deposit_receipt_no: string | null
          flight_cost: number | null
          gender: string | null
          hotel_1_checkin: string | null
          hotel_1_checkout: string | null
          hotel_1_name: string | null
          hotel_2_checkin: string | null
          hotel_2_checkout: string | null
          hotel_2_name: string | null
          id: string
          id_number: string | null
          identity: string | null
          member_type: string
          misc_cost: number | null
          order_id: string
          passport_expiry: string | null
          passport_image_url: string | null
          passport_name: string | null
          passport_number: string | null
          pnr: string | null
          profit: number | null
          remarks: string | null
          selling_price: number | null
          special_meal: string | null
          ticket_number: string | null
          total_payable: number | null
          transport_cost: number | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          age?: number | null
          balance_amount?: number | null
          balance_receipt_no?: string | null
          birth_date?: string | null
          chinese_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_receipt_no?: string | null
          flight_cost?: number | null
          gender?: string | null
          hotel_1_checkin?: string | null
          hotel_1_checkout?: string | null
          hotel_1_name?: string | null
          hotel_2_checkin?: string | null
          hotel_2_checkout?: string | null
          hotel_2_name?: string | null
          id?: string
          id_number?: string | null
          identity?: string | null
          member_type: string
          misc_cost?: number | null
          order_id: string
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_name?: string | null
          passport_number?: string | null
          pnr?: string | null
          profit?: number | null
          remarks?: string | null
          selling_price?: number | null
          special_meal?: string | null
          ticket_number?: string | null
          total_payable?: number | null
          transport_cost?: number | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          age?: number | null
          balance_amount?: number | null
          balance_receipt_no?: string | null
          birth_date?: string | null
          chinese_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_receipt_no?: string | null
          flight_cost?: number | null
          gender?: string | null
          hotel_1_checkin?: string | null
          hotel_1_checkout?: string | null
          hotel_1_name?: string | null
          hotel_2_checkin?: string | null
          hotel_2_checkout?: string | null
          hotel_2_name?: string | null
          id?: string
          id_number?: string | null
          identity?: string | null
          member_type?: string
          misc_cost?: number | null
          order_id?: string
          passport_expiry?: string | null
          passport_image_url?: string | null
          passport_name?: string | null
          passport_number?: string | null
          pnr?: string | null
          profit?: number | null
          remarks?: string | null
          selling_price?: number | null
          special_meal?: string | null
          ticket_number?: string | null
          total_payable?: number | null
          transport_cost?: number | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          adult_count: number | null
          assistant: string | null
          child_count: number | null
          code: string
          contact_email: string | null
          contact_person: string
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          identity_options: Json | null
          infant_count: number | null
          is_active: boolean | null
          member_count: number | null
          notes: string | null
          order_number: string | null
          paid_amount: number | null
          payment_status: string | null
          remaining_amount: number | null
          sales_person: string | null
          status: string | null
          total_amount: number | null
          total_people: number | null
          tour_id: string | null
          tour_name: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          adult_count?: number | null
          assistant?: string | null
          child_count?: number | null
          code: string
          contact_email?: string | null
          contact_person: string
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id: string
          identity_options?: Json | null
          infant_count?: number | null
          is_active?: boolean | null
          member_count?: number | null
          notes?: string | null
          order_number?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          remaining_amount?: number | null
          sales_person?: string | null
          status?: string | null
          total_amount?: number | null
          total_people?: number | null
          tour_id?: string | null
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          adult_count?: number | null
          assistant?: string | null
          child_count?: number | null
          code?: string
          contact_email?: string | null
          contact_person?: string
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          identity_options?: Json | null
          infant_count?: number | null
          is_active?: boolean | null
          member_count?: number | null
          notes?: string | null
          order_number?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          remaining_amount?: number | null
          sales_person?: string | null
          status?: string | null
          total_amount?: number | null
          total_people?: number | null
          tour_id?: string | null
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_request_items: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          custom_request_date: string | null
          description: string
          id: string
          item_number: string | null
          note: string | null
          payment_method: string | null
          quantity: number | null
          request_id: string | null
          sort_order: number | null
          subtotal: number | null
          supplier_id: string | null
          supplier_name: string | null
          tour_id: string | null
          unitprice: number | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_request_date?: string | null
          description: string
          id?: string
          item_number?: string | null
          note?: string | null
          payment_method?: string | null
          quantity?: number | null
          request_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          tour_id?: string | null
          unitprice?: number | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_request_date?: string | null
          description?: string
          id?: string
          item_number?: string | null
          note?: string | null
          payment_method?: string | null
          quantity?: number | null
          request_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          tour_id?: string | null
          unitprice?: number | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_request_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_request_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_warning: boolean | null
          code: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          id: string
          items: Json | null
          note: string | null
          order_id: string | null
          order_number: string | null
          paid_at: string | null
          paid_by: string | null
          request_date: string | null
          request_type: string
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number | null
          tour_code: string | null
          tour_id: string | null
          tour_name: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_warning?: boolean | null
          code: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          items?: Json | null
          note?: string | null
          order_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          paid_by?: string | null
          request_date?: string | null
          request_type: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          tour_code?: string | null
          tour_id?: string | null
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_warning?: boolean | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          items?: Json | null
          note?: string | null
          order_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          paid_by?: string | null
          request_date?: string | null
          request_type?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          tour_code?: string | null
          tour_id?: string | null
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_by: string | null
          createdat: string | null
          id: string
          notes: string | null
          orderid: string | null
          payer: string | null
          paymentdate: string
          paymentnumber: string
          paymenttype: string | null
          receivedby: string | null
          status: string | null
          tourid: string | null
          updated_by: string | null
          updatedat: string | null
          workspace_id: string | null
        }
        Insert: {
          amount: number
          created_by?: string | null
          createdat?: string | null
          id?: string
          notes?: string | null
          orderid?: string | null
          payer?: string | null
          paymentdate: string
          paymentnumber: string
          paymenttype?: string | null
          receivedby?: string | null
          status?: string | null
          tourid?: string | null
          updated_by?: string | null
          updatedat?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          created_by?: string | null
          createdat?: string | null
          id?: string
          notes?: string | null
          orderid?: string | null
          payer?: string | null
          paymentdate?: string
          paymentnumber?: string
          paymenttype?: string | null
          receivedby?: string | null
          status?: string | null
          tourid?: string | null
          updated_by?: string | null
          updatedat?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_canvases: {
        Row: {
          canvas_number: number
          content: Json | null
          created_at: string | null
          employee_id: string
          id: string
          layout: Json | null
          title: string
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          canvas_number: number
          content?: Json | null
          created_at?: string | null
          employee_id: string
          id?: string
          layout?: Json | null
          title: string
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          canvas_number?: number
          content?: Json | null
          created_at?: string | null
          employee_id?: string
          id?: string
          layout?: Json | null
          title?: string
          type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_date: string
          created_at: string
          exercise_id: number
          exercise_name: string
          id: string
          max_reps: number | null
          max_weight: number | null
          one_rep_max: number | null
          session_id: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          achieved_date: string
          created_at?: string
          exercise_id: number
          exercise_name: string
          id?: string
          max_reps?: number | null
          max_weight?: number | null
          one_rep_max?: number | null
          session_id?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          achieved_date?: string
          created_at?: string
          exercise_id?: number
          exercise_name?: string
          id?: string
          max_reps?: number | null
          max_weight?: number | null
          one_rep_max?: number | null
          session_id?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_ai_queries: {
        Row: {
          created_at: string | null
          id: string
          pnr_id: string | null
          queried_by: string | null
          query_context: Json | null
          query_text: string
          response_metadata: Json | null
          response_text: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pnr_id?: string | null
          queried_by?: string | null
          query_context?: Json | null
          query_text: string
          response_metadata?: Json | null
          response_text?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pnr_id?: string | null
          queried_by?: string | null
          query_context?: Json | null
          query_text?: string
          response_metadata?: Json | null
          response_text?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_ai_queries_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_ai_queries_queried_by_fkey"
            columns: ["queried_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_ai_queries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_fare_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          last_fare: number | null
          notify_channel_id: string | null
          notify_employee_ids: string[] | null
          pnr_id: string
          threshold_amount: number | null
          threshold_percent: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_fare?: number | null
          notify_channel_id?: string | null
          notify_employee_ids?: string[] | null
          pnr_id: string
          threshold_amount?: number | null
          threshold_percent?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_fare?: number | null
          notify_channel_id?: string | null
          notify_employee_ids?: string[] | null
          pnr_id?: string
          threshold_amount?: number | null
          threshold_percent?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_fare_alerts_notify_channel_id_fkey"
            columns: ["notify_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_fare_alerts_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_fare_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_fare_history: {
        Row: {
          base_fare: number | null
          created_at: string | null
          currency: string | null
          fare_basis: string | null
          id: string
          pnr_id: string
          raw_fare_data: Json | null
          recorded_at: string | null
          recorded_by: string | null
          source: string | null
          taxes: number | null
          total_fare: number
          workspace_id: string
        }
        Insert: {
          base_fare?: number | null
          created_at?: string | null
          currency?: string | null
          fare_basis?: string | null
          id?: string
          pnr_id: string
          raw_fare_data?: Json | null
          recorded_at?: string | null
          recorded_by?: string | null
          source?: string | null
          taxes?: number | null
          total_fare: number
          workspace_id: string
        }
        Update: {
          base_fare?: number | null
          created_at?: string | null
          currency?: string | null
          fare_basis?: string | null
          id?: string
          pnr_id?: string
          raw_fare_data?: Json | null
          recorded_at?: string | null
          recorded_by?: string | null
          source?: string | null
          taxes?: number | null
          total_fare?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_fare_history_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_fare_history_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_fare_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_flight_status_history: {
        Row: {
          airline_code: string
          booking_status: string | null
          delay_minutes: number | null
          external_data: Json | null
          flight_date: string
          flight_number: string
          gate_info: string | null
          id: string
          new_arrival_time: string | null
          new_departure_time: string | null
          operational_status: string | null
          pnr_id: string
          recorded_at: string | null
          remarks: string | null
          segment_id: string | null
          source: string | null
          workspace_id: string
        }
        Insert: {
          airline_code: string
          booking_status?: string | null
          delay_minutes?: number | null
          external_data?: Json | null
          flight_date: string
          flight_number: string
          gate_info?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_time?: string | null
          operational_status?: string | null
          pnr_id: string
          recorded_at?: string | null
          remarks?: string | null
          segment_id?: string | null
          source?: string | null
          workspace_id: string
        }
        Update: {
          airline_code?: string
          booking_status?: string | null
          delay_minutes?: number | null
          external_data?: Json | null
          flight_date?: string
          flight_number?: string
          gate_info?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_time?: string | null
          operational_status?: string | null
          pnr_id?: string
          recorded_at?: string | null
          remarks?: string | null
          segment_id?: string | null
          source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_flight_status_history_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_flight_status_history_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "pnr_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_flight_status_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_passengers: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date_of_birth: string | null
          given_name: string | null
          id: string
          order_member_id: string | null
          passenger_type: string | null
          pnr_id: string
          sequence_number: number | null
          surname: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          given_name?: string | null
          id?: string
          order_member_id?: string | null
          passenger_type?: string | null
          pnr_id: string
          sequence_number?: number | null
          surname: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          given_name?: string | null
          id?: string
          order_member_id?: string | null
          passenger_type?: string | null
          pnr_id?: string
          sequence_number?: number | null
          surname?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_passengers_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_queue_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          pnr_id: string
          priority: number | null
          queue_type: string
          reminder_at: string | null
          resolution_notes: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          pnr_id: string
          priority?: number | null
          queue_type: string
          reminder_at?: string | null
          resolution_notes?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          pnr_id?: string
          priority?: number | null
          queue_type?: string
          reminder_at?: string | null
          resolution_notes?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_queue_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_queue_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_queue_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_queue_items_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_queue_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_records: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_date: string | null
          current_fare: number | null
          fare_currency: string | null
          has_schedule_change: boolean | null
          id: string
          is_ticketed: boolean | null
          notes: string | null
          office_id: string | null
          queue_count: number | null
          raw_content: string | null
          record_locator: string
          ticket_issued_at: string | null
          ticket_numbers: string[] | null
          ticketing_deadline: string | null
          ticketing_status: string | null
          tour_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          current_fare?: number | null
          fare_currency?: string | null
          has_schedule_change?: boolean | null
          id?: string
          is_ticketed?: boolean | null
          notes?: string | null
          office_id?: string | null
          queue_count?: number | null
          raw_content?: string | null
          record_locator: string
          ticket_issued_at?: string | null
          ticket_numbers?: string[] | null
          ticketing_deadline?: string | null
          ticketing_status?: string | null
          tour_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          created_date?: string | null
          current_fare?: number | null
          fare_currency?: string | null
          has_schedule_change?: boolean | null
          id?: string
          is_ticketed?: boolean | null
          notes?: string | null
          office_id?: string | null
          queue_count?: number | null
          raw_content?: string | null
          record_locator?: string
          ticket_issued_at?: string | null
          ticket_numbers?: string[] | null
          ticketing_deadline?: string | null
          ticketing_status?: string | null
          tour_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_remarks: {
        Row: {
          content: string
          created_at: string | null
          id: string
          pnr_id: string
          remark_type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          pnr_id: string
          remark_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          pnr_id?: string
          remark_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_remarks_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_schedule_changes: {
        Row: {
          change_type: string
          created_at: string | null
          detected_at: string | null
          id: string
          new_arrival_time: string | null
          new_departure_date: string | null
          new_departure_time: string | null
          new_flight_number: string | null
          notes: string | null
          original_arrival_time: string | null
          original_departure_date: string | null
          original_departure_time: string | null
          original_flight_number: string | null
          pnr_id: string
          processed_at: string | null
          processed_by: string | null
          requires_refund: boolean | null
          requires_reissue: boolean | null
          requires_revalidation: boolean | null
          segment_id: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          detected_at?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_date?: string | null
          new_departure_time?: string | null
          new_flight_number?: string | null
          notes?: string | null
          original_arrival_time?: string | null
          original_departure_date?: string | null
          original_departure_time?: string | null
          original_flight_number?: string | null
          pnr_id: string
          processed_at?: string | null
          processed_by?: string | null
          requires_refund?: boolean | null
          requires_reissue?: boolean | null
          requires_revalidation?: boolean | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          detected_at?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_date?: string | null
          new_departure_time?: string | null
          new_flight_number?: string | null
          notes?: string | null
          original_arrival_time?: string | null
          original_departure_date?: string | null
          original_departure_time?: string | null
          original_flight_number?: string | null
          pnr_id?: string
          processed_at?: string | null
          processed_by?: string | null
          requires_refund?: boolean | null
          requires_reissue?: boolean | null
          requires_revalidation?: boolean | null
          segment_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnr_schedule_changes_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_schedule_changes_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_schedule_changes_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "pnr_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_schedule_changes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_segments: {
        Row: {
          airline_code: string
          arrival_day_offset: number | null
          arrival_time: string | null
          booking_class: string | null
          created_at: string | null
          day_of_week: number | null
          departure_date: string
          departure_time: string | null
          destination: string
          equipment: string | null
          flight_number: string
          id: string
          origin: string
          pnr_id: string
          quantity: number | null
          segment_number: number | null
          status_code: string | null
        }
        Insert: {
          airline_code: string
          arrival_day_offset?: number | null
          arrival_time?: string | null
          booking_class?: string | null
          created_at?: string | null
          day_of_week?: number | null
          departure_date: string
          departure_time?: string | null
          destination: string
          equipment?: string | null
          flight_number: string
          id?: string
          origin: string
          pnr_id: string
          quantity?: number | null
          segment_number?: number | null
          status_code?: string | null
        }
        Update: {
          airline_code?: string
          arrival_day_offset?: number | null
          arrival_time?: string | null
          booking_class?: string | null
          created_at?: string | null
          day_of_week?: number | null
          departure_date?: string
          departure_time?: string | null
          destination?: string
          equipment?: string | null
          flight_number?: string
          id?: string
          origin?: string
          pnr_id?: string
          quantity?: number | null
          segment_number?: number | null
          status_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_segments_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pnr_ssr_elements: {
        Row: {
          airline_code: string | null
          created_at: string | null
          free_text: string | null
          id: string
          passenger_id: string | null
          pnr_id: string
          segment_id: string | null
          ssr_code: string
          status: string | null
        }
        Insert: {
          airline_code?: string | null
          created_at?: string | null
          free_text?: string | null
          id?: string
          passenger_id?: string | null
          pnr_id: string
          segment_id?: string | null
          ssr_code: string
          status?: string | null
        }
        Update: {
          airline_code?: string | null
          created_at?: string | null
          free_text?: string | null
          id?: string
          passenger_id?: string | null
          pnr_id?: string
          segment_id?: string | null
          ssr_code?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnr_ssr_elements_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "pnr_passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_ssr_elements_pnr_id_fkey"
            columns: ["pnr_id"]
            isOneToOne: false
            referencedRelation: "pnr_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnr_ssr_elements_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "pnr_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      pnrs: {
        Row: {
          cancellation_deadline: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          id: string
          notes: string | null
          other_info: Json | null
          passenger_names: string[]
          raw_pnr: string
          record_locator: string
          segments: Json | null
          special_requests: Json | null
          status: string | null
          ticketing_deadline: string | null
          tour_id: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          cancellation_deadline?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          other_info?: Json | null
          passenger_names?: string[]
          raw_pnr: string
          record_locator: string
          segments?: Json | null
          special_requests?: Json | null
          status?: string | null
          ticketing_deadline?: string | null
          tour_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          cancellation_deadline?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          other_info?: Json | null
          passenger_names?: string[]
          raw_pnr?: string
          record_locator?: string
          segments?: Json | null
          special_requests?: Json | null
          status?: string | null
          ticketing_deadline?: string | null
          tour_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnrs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnrs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnrs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnrs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_rules: {
        Row: {
          created_at: string | null
          event_type: Database["public"]["Enums"]["accounting_event_type"]
          id: string
          is_active: boolean | null
          rule_config: Json
          rule_name: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: Database["public"]["Enums"]["accounting_event_type"]
          id?: string
          is_active?: boolean | null
          rule_config: Json
          rule_name: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["accounting_event_type"]
          id?: string
          is_active?: boolean | null
          rule_config?: Json
          rule_name?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posting_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_experiences: {
        Row: {
          advance_booking_days: number | null
          available_seasons: string[] | null
          awards: string[] | null
          best_for_age_group: string | null
          best_time_of_day: string | null
          booking_contact: string | null
          booking_email: string | null
          booking_phone: string | null
          cancellation_policy: string | null
          category: string
          certifications: string[] | null
          city_id: string
          combine_with: string[] | null
          commission_rate: number | null
          country_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          description_en: string | null
          difficulty_level: string | null
          display_order: number | null
          dress_code: string | null
          duration_hours: number | null
          eco_friendly: boolean | null
          exclusivity_level: string
          expert_credentials: string[] | null
          expert_name: string | null
          expert_profile: string | null
          expert_title: string | null
          group_size_max: number | null
          group_size_min: number | null
          highlights: string[] | null
          id: string
          images: string[] | null
          inclusions: Json | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          language_support: string[] | null
          latitude: number | null
          longitude: number | null
          media_features: string[] | null
          meeting_point: string | null
          meeting_point_coords: Json | null
          minimum_participants: number | null
          name: string
          name_en: string | null
          name_local: string | null
          net_price_per_person: number | null
          physical_requirement: string | null
          pickup_service: boolean | null
          price_excludes: string[] | null
          price_includes: string[] | null
          price_per_person_max: number | null
          price_per_person_min: number | null
          ratings: Json | null
          recommended_for: string[] | null
          region_id: string | null
          related_attractions: string[] | null
          restrictions: string[] | null
          review_count: number | null
          specific_location: string | null
          sub_category: string[] | null
          suitable_for_children: boolean | null
          supports_local_community: boolean | null
          sustainability_practices: string[] | null
          tagline: string | null
          thumbnail: string | null
          transportation_included: boolean | null
          updated_at: string | null
          updated_by: string | null
          video_url: string | null
          what_makes_it_special: string | null
          what_to_bring: string[] | null
        }
        Insert: {
          advance_booking_days?: number | null
          available_seasons?: string[] | null
          awards?: string[] | null
          best_for_age_group?: string | null
          best_time_of_day?: string | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          cancellation_policy?: string | null
          category: string
          certifications?: string[] | null
          city_id: string
          combine_with?: string[] | null
          commission_rate?: number | null
          country_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          description_en?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          dress_code?: string | null
          duration_hours?: number | null
          eco_friendly?: boolean | null
          exclusivity_level: string
          expert_credentials?: string[] | null
          expert_name?: string | null
          expert_profile?: string | null
          expert_title?: string | null
          group_size_max?: number | null
          group_size_min?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inclusions?: Json | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          language_support?: string[] | null
          latitude?: number | null
          longitude?: number | null
          media_features?: string[] | null
          meeting_point?: string | null
          meeting_point_coords?: Json | null
          minimum_participants?: number | null
          name: string
          name_en?: string | null
          name_local?: string | null
          net_price_per_person?: number | null
          physical_requirement?: string | null
          pickup_service?: boolean | null
          price_excludes?: string[] | null
          price_includes?: string[] | null
          price_per_person_max?: number | null
          price_per_person_min?: number | null
          ratings?: Json | null
          recommended_for?: string[] | null
          region_id?: string | null
          related_attractions?: string[] | null
          restrictions?: string[] | null
          review_count?: number | null
          specific_location?: string | null
          sub_category?: string[] | null
          suitable_for_children?: boolean | null
          supports_local_community?: boolean | null
          sustainability_practices?: string[] | null
          tagline?: string | null
          thumbnail?: string | null
          transportation_included?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
          what_makes_it_special?: string | null
          what_to_bring?: string[] | null
        }
        Update: {
          advance_booking_days?: number | null
          available_seasons?: string[] | null
          awards?: string[] | null
          best_for_age_group?: string | null
          best_time_of_day?: string | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_phone?: string | null
          cancellation_policy?: string | null
          category?: string
          certifications?: string[] | null
          city_id?: string
          combine_with?: string[] | null
          commission_rate?: number | null
          country_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          description_en?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          dress_code?: string | null
          duration_hours?: number | null
          eco_friendly?: boolean | null
          exclusivity_level?: string
          expert_credentials?: string[] | null
          expert_name?: string | null
          expert_profile?: string | null
          expert_title?: string | null
          group_size_max?: number | null
          group_size_min?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          inclusions?: Json | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          language_support?: string[] | null
          latitude?: number | null
          longitude?: number | null
          media_features?: string[] | null
          meeting_point?: string | null
          meeting_point_coords?: Json | null
          minimum_participants?: number | null
          name?: string
          name_en?: string | null
          name_local?: string | null
          net_price_per_person?: number | null
          physical_requirement?: string | null
          pickup_service?: boolean | null
          price_excludes?: string[] | null
          price_includes?: string[] | null
          price_per_person_max?: number | null
          price_per_person_min?: number | null
          ratings?: Json | null
          recommended_for?: string[] | null
          region_id?: string | null
          related_attractions?: string[] | null
          restrictions?: string[] | null
          review_count?: number | null
          specific_location?: string | null
          sub_category?: string[] | null
          suitable_for_children?: boolean | null
          supports_local_community?: boolean | null
          sustainability_practices?: string[] | null
          tagline?: string | null
          thumbnail?: string | null
          transportation_included?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
          what_makes_it_special?: string | null
          what_to_bring?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_experiences_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_experiences_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_experiences_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          category: string | null
          createdat: string | null
          currency: string | null
          id: string
          itemcode: string
          itemname: string
          minimumorder: number | null
          notes: string | null
          supplierid: string | null
          unit: string | null
          unitprice: number | null
          updatedat: string | null
          validfrom: string | null
          validuntil: string | null
        }
        Insert: {
          category?: string | null
          createdat?: string | null
          currency?: string | null
          id?: string
          itemcode: string
          itemname: string
          minimumorder?: number | null
          notes?: string | null
          supplierid?: string | null
          unit?: string | null
          unitprice?: number | null
          updatedat?: string | null
          validfrom?: string | null
          validuntil?: string | null
        }
        Update: {
          category?: string | null
          createdat?: string | null
          currency?: string | null
          id?: string
          itemcode?: string
          itemname?: string
          minimumorder?: number | null
          notes?: string | null
          supplierid?: string | null
          unit?: string | null
          unitprice?: number | null
          updatedat?: string | null
          validfrom?: string | null
          validuntil?: string | null
        }
        Relationships: []
      }
      pricing_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          is_beta_tester: boolean | null
          name: string | null
          nickname: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          id: string
          is_beta_tester?: boolean | null
          name?: string | null
          nickname?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_beta_tester?: boolean | null
          name?: string | null
          nickname?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          measurement_id: string | null
          notes: string | null
          photo_type: string
          photo_url: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          measurement_id?: string | null
          notes?: string | null
          photo_type: string
          photo_url: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          measurement_id?: string | null
          notes?: string | null
          photo_type?: string
          photo_url?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "body_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_categories: {
        Row: {
          createdat: string | null
          id: string
          items: Json | null
          name: string
          quoteid: string | null
          subtotal: number | null
          updatedat: string | null
        }
        Insert: {
          createdat?: string | null
          id?: string
          items?: Json | null
          name: string
          quoteid?: string | null
          subtotal?: number | null
          updatedat?: string | null
        }
        Update: {
          createdat?: string | null
          id?: string
          items?: Json | null
          name?: string
          quoteid?: string | null
          subtotal?: number | null
          updatedat?: string | null
        }
        Relationships: []
      }
      quote_confirmation_logs: {
        Row: {
          action: string
          confirmed_by_email: string | null
          confirmed_by_name: string | null
          confirmed_by_phone: string | null
          confirmed_by_staff_id: string | null
          confirmed_by_type: string | null
          confirmed_version: number | null
          created_at: string | null
          id: string
          ip_address: string | null
          notes: string | null
          quote_id: string
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          confirmed_by_staff_id?: string | null
          confirmed_by_type?: string | null
          confirmed_version?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          quote_id: string
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          confirmed_by_staff_id?: string | null
          confirmed_by_type?: string | null
          confirmed_version?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          quote_id?: string
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_confirmation_logs_confirmed_by_staff_id_fkey"
            columns: ["confirmed_by_staff_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_confirmation_logs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_confirmation_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_optional: boolean | null
          item_type: string | null
          notes: string | null
          quantity: number | null
          quote_id: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description: string
          display_order?: number | null
          id: string
          is_active?: boolean | null
          is_optional?: boolean | null
          item_type?: string | null
          notes?: string | null
          quantity?: number | null
          quote_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_optional?: boolean | null
          item_type?: string | null
          notes?: string | null
          quantity?: number | null
          quote_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_regions: {
        Row: {
          city: string
          city_name: string
          country: string
          country_name: string
          created_at: string | null
          id: string
          order: number
          quote_id: string
          region: string | null
          region_name: string | null
          updated_at: string | null
        }
        Insert: {
          city: string
          city_name: string
          country: string
          country_name: string
          created_at?: string | null
          id?: string
          order?: number
          quote_id: string
          region?: string | null
          region_name?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          city_name?: string
          country?: string
          country_name?: string
          created_at?: string | null
          id?: string
          order?: number
          quote_id?: string
          region?: string | null
          region_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_regions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          changenote: string | null
          createdat: string | null
          createdby: string | null
          data: Json
          id: string
          quoteid: string | null
          version: number
        }
        Insert: {
          changenote?: string | null
          createdat?: string | null
          createdby?: string | null
          data: Json
          id?: string
          quoteid?: string | null
          version: number
        }
        Update: {
          changenote?: string | null
          createdat?: string | null
          createdby?: string | null
          data?: Json
          id?: string
          quoteid?: string | null
          version?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accommodation_days: number | null
          adult_count: number | null
          balance_amount: number | null
          categories: Json | null
          child_count: number | null
          code: string | null
          confirmation_ip: string | null
          confirmation_notes: string | null
          confirmation_status: string | null
          confirmation_token: string | null
          confirmation_token_expires_at: string | null
          confirmation_user_agent: string | null
          confirmed_at: string | null
          confirmed_by_email: string | null
          confirmed_by_name: string | null
          confirmed_by_phone: string | null
          confirmed_by_staff_id: string | null
          confirmed_by_type: string | null
          confirmed_version: number | null
          contact_address: string | null
          contact_phone: string | null
          converted_to_tour: boolean | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          current_version_index: number | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          days: number | null
          destination: string | null
          end_date: string | null
          expense_description: string | null
          group_size: number | null
          handler_name: string | null
          id: string
          infant_count: number | null
          is_active: boolean | null
          is_pinned: boolean | null
          issue_date: string | null
          itinerary_id: string | null
          main_city_id: string | null
          name: string | null
          nights: number | null
          notes: string | null
          number_of_people: number | null
          other_city_ids: string[] | null
          participant_counts: Json | null
          quick_quote_items: Json | null
          quote_type: string | null
          received_amount: number | null
          selling_prices: Json | null
          shared_with_workspaces: string[] | null
          start_date: string | null
          status: string | null
          tier_pricings: Json | null
          total_amount: number | null
          total_cost: number | null
          tour_code: string | null
          tour_id: string | null
          updated_at: string | null
          updated_by: string | null
          valid_until: string | null
          version: number | null
          versions: Json | null
          workspace_id: string | null
        }
        Insert: {
          accommodation_days?: number | null
          adult_count?: number | null
          balance_amount?: number | null
          categories?: Json | null
          child_count?: number | null
          code?: string | null
          confirmation_ip?: string | null
          confirmation_notes?: string | null
          confirmation_status?: string | null
          confirmation_token?: string | null
          confirmation_token_expires_at?: string | null
          confirmation_user_agent?: string | null
          confirmed_at?: string | null
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          confirmed_by_staff_id?: string | null
          confirmed_by_type?: string | null
          confirmed_version?: number | null
          contact_address?: string | null
          contact_phone?: string | null
          converted_to_tour?: boolean | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          current_version_index?: number | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          days?: number | null
          destination?: string | null
          end_date?: string | null
          expense_description?: string | null
          group_size?: number | null
          handler_name?: string | null
          id: string
          infant_count?: number | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          issue_date?: string | null
          itinerary_id?: string | null
          main_city_id?: string | null
          name?: string | null
          nights?: number | null
          notes?: string | null
          number_of_people?: number | null
          other_city_ids?: string[] | null
          participant_counts?: Json | null
          quick_quote_items?: Json | null
          quote_type?: string | null
          received_amount?: number | null
          selling_prices?: Json | null
          shared_with_workspaces?: string[] | null
          start_date?: string | null
          status?: string | null
          tier_pricings?: Json | null
          total_amount?: number | null
          total_cost?: number | null
          tour_code?: string | null
          tour_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string | null
          version?: number | null
          versions?: Json | null
          workspace_id?: string | null
        }
        Update: {
          accommodation_days?: number | null
          adult_count?: number | null
          balance_amount?: number | null
          categories?: Json | null
          child_count?: number | null
          code?: string | null
          confirmation_ip?: string | null
          confirmation_notes?: string | null
          confirmation_status?: string | null
          confirmation_token?: string | null
          confirmation_token_expires_at?: string | null
          confirmation_user_agent?: string | null
          confirmed_at?: string | null
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          confirmed_by_staff_id?: string | null
          confirmed_by_type?: string | null
          confirmed_version?: number | null
          contact_address?: string | null
          contact_phone?: string | null
          converted_to_tour?: boolean | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          current_version_index?: number | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          days?: number | null
          destination?: string | null
          end_date?: string | null
          expense_description?: string | null
          group_size?: number | null
          handler_name?: string | null
          id?: string
          infant_count?: number | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          issue_date?: string | null
          itinerary_id?: string | null
          main_city_id?: string | null
          name?: string | null
          nights?: number | null
          notes?: string | null
          number_of_people?: number | null
          other_city_ids?: string[] | null
          participant_counts?: Json | null
          quick_quote_items?: Json | null
          quote_type?: string | null
          received_amount?: number | null
          selling_prices?: Json | null
          shared_with_workspaces?: string[] | null
          start_date?: string | null
          status?: string | null
          tier_pricings?: Json | null
          total_amount?: number | null
          total_cost?: number | null
          tour_code?: string | null
          tour_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string | null
          version?: number | null
          versions?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_main_city_id_fkey"
            columns: ["main_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_orders: {
        Row: {
          amount: number
          code: string
          created_at: string | null
          created_by: string | null
          handled_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string
          receipt_date: string
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          code: string
          created_at?: string | null
          created_by?: string | null
          handled_by?: string | null
          id: string
          notes?: string | null
          order_id?: string | null
          payment_method: string
          receipt_date: string
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string | null
          created_by?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string
          receipt_date?: string
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_receipt_orders_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_payment_items: {
        Row: {
          amount: number
          createdat: string | null
          id: string
          itemname: string
          notes: string | null
          receiptid: string | null
        }
        Insert: {
          amount: number
          createdat?: string | null
          id?: string
          itemname: string
          notes?: string | null
          receiptid?: string | null
        }
        Update: {
          amount?: number
          createdat?: string | null
          id?: string
          itemname?: string
          notes?: string | null
          receiptid?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          account_info: string | null
          account_last_digits: string | null
          actual_amount: number | null
          amount: number
          auth_code: string | null
          bank_name: string | null
          card_last_four: string | null
          check_bank: string | null
          check_number: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          customer_name: string | null
          deleted_at: string | null
          email: string | null
          fees: number | null
          handler_name: string | null
          id: string
          note: string | null
          notes: string | null
          order_id: string
          order_number: string | null
          pay_dateline: string | null
          payment_date: string
          payment_method: string
          payment_name: string | null
          receipt_account: string | null
          receipt_amount: number
          receipt_date: string | null
          receipt_number: string
          receipt_type: number
          status: string
          sync_status: string | null
          tour_id: string | null
          tour_name: string | null
          transaction_id: string | null
          updated_at: string | null
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          account_info?: string | null
          account_last_digits?: string | null
          actual_amount?: number | null
          amount: number
          auth_code?: string | null
          bank_name?: string | null
          card_last_four?: string | null
          check_bank?: string | null
          check_number?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          customer_name?: string | null
          deleted_at?: string | null
          email?: string | null
          fees?: number | null
          handler_name?: string | null
          id?: string
          note?: string | null
          notes?: string | null
          order_id: string
          order_number?: string | null
          pay_dateline?: string | null
          payment_date: string
          payment_method: string
          payment_name?: string | null
          receipt_account?: string | null
          receipt_amount: number
          receipt_date?: string | null
          receipt_number: string
          receipt_type?: number
          status?: string
          sync_status?: string | null
          tour_id?: string | null
          tour_name?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          account_info?: string | null
          account_last_digits?: string | null
          actual_amount?: number | null
          amount?: number
          auth_code?: string | null
          bank_name?: string | null
          card_last_four?: string | null
          check_bank?: string | null
          check_number?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          customer_name?: string | null
          deleted_at?: string | null
          email?: string | null
          fees?: number | null
          handler_name?: string | null
          id?: string
          note?: string | null
          notes?: string | null
          order_id?: string
          order_number?: string | null
          pay_dateline?: string | null
          payment_date?: string
          payment_method?: string
          payment_name?: string | null
          receipt_account?: string | null
          receipt_amount?: number
          receipt_date?: string | null
          receipt_number?: string
          receipt_type?: number
          status?: string
          sync_status?: string | null
          tour_id?: string | null
          tour_name?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_airlines: {
        Row: {
          alliance: string | null
          country: string | null
          created_at: string | null
          iata_code: string
          icao_code: string | null
          is_active: boolean | null
          name_en: string | null
          name_zh: string | null
        }
        Insert: {
          alliance?: string | null
          country?: string | null
          created_at?: string | null
          iata_code: string
          icao_code?: string | null
          is_active?: boolean | null
          name_en?: string | null
          name_zh?: string | null
        }
        Update: {
          alliance?: string | null
          country?: string | null
          created_at?: string | null
          iata_code?: string
          icao_code?: string | null
          is_active?: boolean | null
          name_en?: string | null
          name_zh?: string | null
        }
        Relationships: []
      }
      ref_airports: {
        Row: {
          city_code: string | null
          city_name_en: string | null
          city_name_zh: string | null
          country_code: string | null
          created_at: string | null
          iata_code: string
          icao_code: string | null
          latitude: number | null
          longitude: number | null
          name_en: string | null
          name_zh: string | null
          timezone: string | null
        }
        Insert: {
          city_code?: string | null
          city_name_en?: string | null
          city_name_zh?: string | null
          country_code?: string | null
          created_at?: string | null
          iata_code: string
          icao_code?: string | null
          latitude?: number | null
          longitude?: number | null
          name_en?: string | null
          name_zh?: string | null
          timezone?: string | null
        }
        Update: {
          city_code?: string | null
          city_name_en?: string | null
          city_name_zh?: string | null
          country_code?: string | null
          created_at?: string | null
          iata_code?: string
          icao_code?: string | null
          latitude?: number | null
          longitude?: number | null
          name_en?: string | null
          name_zh?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      ref_booking_classes: {
        Row: {
          cabin_type: string | null
          code: string
          created_at: string | null
          description: string | null
          priority: number | null
        }
        Insert: {
          cabin_type?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          priority?: number | null
        }
        Update: {
          cabin_type?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          priority?: number | null
        }
        Relationships: []
      }
      ref_ssr_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description_en: string | null
          description_zh: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description_en?: string | null
          description_zh?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description_en?: string | null
          description_zh?: string | null
        }
        Relationships: []
      }
      ref_status_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description_en: string | null
          description_zh: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description_en?: string | null
          description_zh?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description_en?: string | null
          description_zh?: string | null
        }
        Relationships: []
      }
      region_stats: {
        Row: {
          attractions_count: number | null
          city_id: string
          cost_templates_count: number | null
          quotes_count: number | null
          tours_count: number | null
          updated_at: string | null
        }
        Insert: {
          attractions_count?: number | null
          city_id: string
          cost_templates_count?: number | null
          quotes_count?: number | null
          tours_count?: number | null
          updated_at?: string | null
        }
        Update: {
          attractions_count?: number | null
          city_id?: string
          cost_templates_count?: number | null
          quotes_count?: number | null
          tours_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_stats_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          address_en: string | null
          avg_price_dinner: number | null
          avg_price_lunch: number | null
          booking_contact: string | null
          booking_email: string | null
          booking_notes: string | null
          booking_phone: string | null
          category: string | null
          city_id: string
          commission_rate: number | null
          country_id: string
          created_at: string | null
          created_by: string | null
          cuisine_type: string[] | null
          currency: string | null
          description: string | null
          description_en: string | null
          dietary_options: string[] | null
          display_order: number | null
          facilities: Json | null
          google_maps_url: string | null
          group_friendly: boolean | null
          group_menu_available: boolean | null
          group_menu_options: Json | null
          group_menu_price: number | null
          highlights: string[] | null
          id: string
          images: string[] | null
          internal_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          max_group_size: number | null
          meal_type: string[] | null
          menu_images: string[] | null
          min_group_size: number | null
          name: string
          name_en: string | null
          name_local: string | null
          notes: string | null
          opening_hours: Json | null
          phone: string | null
          price_range: string | null
          private_room: boolean | null
          private_room_capacity: number | null
          rating: number | null
          region_id: string | null
          reservation_required: boolean | null
          reservation_url: string | null
          review_count: number | null
          specialties: string[] | null
          thumbnail: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          avg_price_dinner?: number | null
          avg_price_lunch?: number | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_notes?: string | null
          booking_phone?: string | null
          category?: string | null
          city_id: string
          commission_rate?: number | null
          country_id: string
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string[] | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dietary_options?: string[] | null
          display_order?: number | null
          facilities?: Json | null
          google_maps_url?: string | null
          group_friendly?: boolean | null
          group_menu_available?: boolean | null
          group_menu_options?: Json | null
          group_menu_price?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          meal_type?: string[] | null
          menu_images?: string[] | null
          min_group_size?: number | null
          name: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          private_room?: boolean | null
          private_room_capacity?: number | null
          rating?: number | null
          region_id?: string | null
          reservation_required?: boolean | null
          reservation_url?: string | null
          review_count?: number | null
          specialties?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_en?: string | null
          avg_price_dinner?: number | null
          avg_price_lunch?: number | null
          booking_contact?: string | null
          booking_email?: string | null
          booking_notes?: string | null
          booking_phone?: string | null
          category?: string | null
          city_id?: string
          commission_rate?: number | null
          country_id?: string
          created_at?: string | null
          created_by?: string | null
          cuisine_type?: string[] | null
          currency?: string | null
          description?: string | null
          description_en?: string | null
          dietary_options?: string[] | null
          display_order?: number | null
          facilities?: Json | null
          google_maps_url?: string | null
          group_friendly?: boolean | null
          group_menu_available?: boolean | null
          group_menu_options?: Json | null
          group_menu_price?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_group_size?: number | null
          meal_type?: string[] | null
          menu_images?: string[] | null
          min_group_size?: number | null
          name?: string
          name_en?: string | null
          name_local?: string | null
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          private_room?: boolean | null
          private_room_capacity?: number | null
          rating?: number | null
          region_id?: string | null
          reservation_required?: boolean | null
          reservation_url?: string | null
          review_count?: number | null
          specialties?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      rich_documents: {
        Row: {
          canvas_id: string
          content: string
          created_at: string | null
          format_data: Json | null
          id: string
          is_favorite: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          canvas_id: string
          content: string
          created_at?: string | null
          format_data?: Json | null
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          canvas_id?: string
          content?: string
          created_at?: string | null
          format_data?: Json | null
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rich_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_order_lists: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          author_id: string
          channel_id: string
          created_at: string | null
          created_by: string
          id: string
          order_ids: Json
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string
          channel_id: string
          created_at?: string | null
          created_by: string
          id?: string
          order_ids?: Json
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_id?: string
          channel_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          order_ids?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_order_lists_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      social_group_members: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          group_id: string
          id: string
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          group_id: string
          id?: string
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          group_id?: string
          id?: string
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_group_tags: {
        Row: {
          group_id: string
          id: string
          tag: string
        }
        Insert: {
          group_id: string
          id?: string
          tag: string
        }
        Update: {
          group_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_group_tags_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      social_groups: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string | null
          created_by: string
          current_members: number | null
          description: string | null
          end_time: string | null
          estimated_cost: number | null
          event_date: string | null
          gender_limit: string | null
          id: string
          is_private: boolean | null
          latitude: number | null
          location_address: string | null
          location_name: string | null
          longitude: number | null
          max_members: number | null
          require_approval: boolean | null
          start_time: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by: string
          current_members?: number | null
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          event_date?: string | null
          gender_limit?: string | null
          id?: string
          is_private?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          max_members?: number | null
          require_approval?: boolean | null
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string
          current_members?: number | null
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          event_date?: string | null
          gender_limit?: string | null
          id?: string
          is_private?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          max_members?: number | null
          require_approval?: boolean | null
          start_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bill_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          expense_date: string | null
          id: string
          note: string | null
          paid_by: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          note?: string | null
          paid_by: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          note?: string | null
          paid_by?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "split_bill_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_bill_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "split_bill_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bill_members: {
        Row: {
          created_at: string | null
          id: string
          is_owner: boolean | null
          name: string
          nickname: string | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          name: string
          nickname?: string | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          name?: string
          nickname?: string | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "split_bill_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bill_projects: {
        Row: {
          created_at: string | null
          enabled_currencies: string[] | null
          exchange_rates: Json | null
          id: string
          name: string
          owner_id: string
          settlement_currency: string | null
          status: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_currencies?: string[] | null
          exchange_rates?: Json | null
          id?: string
          name: string
          owner_id: string
          settlement_currency?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_currencies?: string[] | null
          exchange_rates?: Json | null
          id?: string
          name?: string
          owner_id?: string
          settlement_currency?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      split_bill_splits: {
        Row: {
          amount: number
          created_at: string | null
          expense_id: string
          id: string
          is_paid: boolean | null
          member_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expense_id: string
          id?: string
          is_paid?: boolean | null
          member_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expense_id?: string
          id?: string
          is_paid?: boolean | null
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "split_bill_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_bill_splits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "split_bill_members"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_payment_accounts: {
        Row: {
          account_holder: string
          account_name: string
          account_number: string
          account_type: string | null
          bank_branch: string | null
          bank_code: string | null
          bank_name: string
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          note: string | null
          supplier_id: string
          swift_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_holder: string
          account_name: string
          account_number: string
          account_type?: string | null
          bank_branch?: string | null
          bank_code?: string | null
          bank_name: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          note?: string | null
          supplier_id: string
          swift_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_holder?: string
          account_name?: string
          account_number?: string
          account_type?: string | null
          bank_branch?: string | null
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          note?: string | null
          supplier_id?: string
          swift_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payment_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_list: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          item_name: string
          note: string | null
          seasonality: string | null
          supplier_id: string
          unit: string
          unit_price: number
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name: string
          note?: string | null
          seasonality?: string | null
          supplier_id: string
          unit: string
          unit_price: number
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_name?: string
          note?: string | null
          seasonality?: string | null
          supplier_id?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_list_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_service_areas: {
        Row: {
          city_id: string
          created_at: string
          created_by: string | null
          id: string
          supplier_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          supplier_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_cities_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          address: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_code_legacy: string | null
          bank_name: string | null
          category_id: string | null
          code: string
          contact: Json | null
          contact_person: string | null
          country: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          display_order: number | null
          email: string | null
          id: string
          is_active: boolean | null
          is_preferred: boolean | null
          name: string
          name_en: string | null
          note: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          region: string | null
          status: string | null
          tax_id: string | null
          total_orders: number | null
          total_spent: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_code_legacy?: string | null
          bank_name?: string | null
          category_id?: string | null
          code: string
          contact?: Json | null
          contact_person?: string | null
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          display_order?: number | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_preferred?: boolean | null
          name: string
          name_en?: string | null
          note?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          region?: string | null
          status?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_code_legacy?: string | null
          bank_name?: string | null
          category_id?: string | null
          code?: string
          contact?: Json | null
          contact_person?: string | null
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_preferred?: boolean | null
          name?: string
          name_en?: string | null
          note?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          region?: string | null
          status?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supplier_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      syncqueue: {
        Row: {
          created_at: string | null
          data: Json
          error_message: string | null
          id: string
          operation: string
          retry_count: number | null
          status: string | null
          table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          error_message?: string | null
          id?: string
          operation: string
          retry_count?: number | null
          status?: string | null
          table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          operation?: string
          retry_count?: number | null
          status?: string | null
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          settings: Json
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          content: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          preview: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timebox_blocks: {
        Row: {
          block_date: string
          category: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          end_time: string
          id: string
          is_completed: boolean | null
          owner: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          block_date: string
          category?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_completed?: boolean | null
          owner: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          block_date?: string
          category?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_completed?: boolean | null
          owner?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      timebox_boxes: {
        Row: {
          color: string
          created_at: string | null
          default_content: Json | null
          default_duration: number | null
          equipment: string | null
          id: string
          name: string
          reps: number | null
          sets: number | null
          type: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          color: string
          created_at?: string | null
          default_content?: Json | null
          default_duration?: number | null
          equipment?: string | null
          id?: string
          name: string
          reps?: number | null
          sets?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          default_content?: Json | null
          default_duration?: number | null
          equipment?: string | null
          id?: string
          name?: string
          reps?: number | null
          sets?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      timebox_scheduled_boxes: {
        Row: {
          box_id: string
          completed: boolean
          created_at: string
          data: Json | null
          day_of_week: number
          duration: number
          id: string
          start_time: string
          updated_at: string
          user_id: string
          week_id: string
        }
        Insert: {
          box_id: string
          completed?: boolean
          created_at?: string
          data?: Json | null
          day_of_week: number
          duration: number
          id?: string
          start_time: string
          updated_at?: string
          user_id: string
          week_id: string
        }
        Update: {
          box_id?: string
          completed?: boolean
          created_at?: string
          data?: Json | null
          day_of_week?: number
          duration?: number
          id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timebox_scheduled_boxes_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "timebox_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timebox_scheduled_boxes_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "timebox_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      timebox_schedules: {
        Row: {
          box_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          day_of_week: number
          duration: number
          id: string
          reminder_data: Json | null
          start_time: string
          updated_at: string | null
          user_id: string
          week_id: string
          workout_data: Json | null
        }
        Insert: {
          box_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          day_of_week: number
          duration: number
          id?: string
          reminder_data?: Json | null
          start_time: string
          updated_at?: string | null
          user_id: string
          week_id: string
          workout_data?: Json | null
        }
        Update: {
          box_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          day_of_week?: number
          duration?: number
          id?: string
          reminder_data?: Json | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
          week_id?: string
          workout_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "timebox_schedules_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "timebox_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timebox_schedules_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "timebox_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      timebox_weeks: {
        Row: {
          archived: boolean | null
          completed_count: number | null
          completion_rate: number | null
          created_at: string | null
          id: string
          name: string | null
          next_week_goals: string | null
          review_created_at: string | null
          review_notes: string | null
          total_count: number | null
          total_workout_sessions: number | null
          total_workout_volume: number | null
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          archived?: boolean | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          next_week_goals?: string | null
          review_created_at?: string | null
          review_notes?: string | null
          total_count?: number | null
          total_workout_sessions?: number | null
          total_workout_volume?: number | null
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          archived?: boolean | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          next_week_goals?: string | null
          review_created_at?: string | null
          review_notes?: string | null
          total_count?: number | null
          total_workout_sessions?: number | null
          total_workout_volume?: number | null
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      timebox_workout_templates: {
        Row: {
          created_at: string | null
          exercises: Json
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exercises?: Json
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exercises?: Json
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          assignee: string | null
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          creator: string
          deadline: string | null
          enabled_quick_actions: string[] | null
          id: string
          is_public: boolean | null
          needs_creator_notification: boolean | null
          notes: Json | null
          priority: number
          related_items: Json | null
          status: string
          sub_tasks: Json | null
          title: string
          updated_at: string | null
          updated_by: string | null
          visibility: string[] | null
          workspace_id: string
        }
        Insert: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          creator: string
          deadline?: string | null
          enabled_quick_actions?: string[] | null
          id?: string
          is_public?: boolean | null
          needs_creator_notification?: boolean | null
          notes?: Json | null
          priority?: number
          related_items?: Json | null
          status?: string
          sub_tasks?: Json | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string[] | null
          workspace_id: string
        }
        Update: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          creator?: string
          deadline?: string | null
          enabled_quick_actions?: string[] | null
          id?: string
          is_public?: boolean | null
          needs_creator_notification?: boolean | null
          notes?: Json | null
          priority?: number
          related_items?: Json | null
          status?: string
          sub_tasks?: Json | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_creator_fkey"
            columns: ["creator"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_addons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          quantity: number | null
          tour_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          price?: number | null
          quantity?: number | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          quantity?: number | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_addons_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_addons_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_custom_cost_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_name: string
          id: string
          tour_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_name: string
          id?: string
          tour_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_name?: string
          id?: string
          tour_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_custom_cost_fields_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_custom_cost_fields_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_custom_cost_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          member_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          member_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          member_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_custom_cost_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "tour_custom_cost_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_custom_cost_values_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["order_member_id"]
          },
          {
            foreignKeyName: "tour_custom_cost_values_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "order_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_departure_data: {
        Row: {
          bus_info: Json | null
          created_at: string | null
          created_by: string | null
          emergency_contact: Json | null
          flight_info: Json | null
          guide_info: Json | null
          hotel_info: Json | null
          id: string
          notes: string | null
          tour_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bus_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          emergency_contact?: Json | null
          flight_info?: Json | null
          guide_info?: Json | null
          hotel_info?: Json | null
          id?: string
          notes?: string | null
          tour_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bus_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          emergency_contact?: Json | null
          flight_info?: Json | null
          guide_info?: Json | null
          hotel_info?: Json | null
          id?: string
          notes?: string | null
          tour_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_departure_data_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: true
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_departure_data_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: true
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_destinations: {
        Row: {
          airport_code: string
          city: string
          country: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          airport_code: string
          city: string
          country: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          airport_code?: string
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Tour_Expenses: {
        Row: {
          actual_amount: number
          created_at: string | null
          expense_id: number
          itinerary_id: string
          leader_id: string
          notes: string | null
        }
        Insert: {
          actual_amount: number
          created_at?: string | null
          expense_id?: number
          itinerary_id: string
          leader_id: string
          notes?: string | null
        }
        Update: {
          actual_amount?: number
          created_at?: string | null
          expense_id?: number
          itinerary_id?: string
          leader_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Tour_Expenses_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_leaders: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          id: string
          languages: string[] | null
          license_number: string | null
          name: string
          name_en: string | null
          national_id: string | null
          notes: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          specialties: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          languages?: string[] | null
          license_number?: string | null
          name: string
          name_en?: string | null
          national_id?: string | null
          notes?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          specialties?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          languages?: string[] | null
          license_number?: string | null
          name?: string
          name_en?: string | null
          national_id?: string | null
          notes?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          specialties?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tour_member_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_name: string
          field_value: string | null
          id: string
          order_member_id: string
          tour_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_name: string
          field_value?: string | null
          id?: string
          order_member_id: string
          tour_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_name?: string
          field_value?: string | null
          id?: string
          order_member_id?: string
          tour_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_member_fields_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["order_member_id"]
          },
          {
            foreignKeyName: "tour_member_fields_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "order_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_member_fields_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_member_fields_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_members: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          dietary_requirements: string | null
          id: string
          member_type: string
          room_type: string | null
          roommate_id: string | null
          special_requests: string | null
          tour_id: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          dietary_requirements?: string | null
          id?: string
          member_type: string
          room_type?: string | null
          roommate_id?: string | null
          special_requests?: string | null
          tour_id: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          dietary_requirements?: string | null
          id?: string
          member_type?: string
          room_type?: string | null
          roommate_id?: string | null
          special_requests?: string | null
          tour_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_refunds: {
        Row: {
          createdat: string | null
          id: string
          memberid: string | null
          notes: string | null
          orderid: string | null
          processedby: string | null
          processingstatus: string | null
          refundamount: number
          refunddate: string | null
          refundreason: string
          tourid: string | null
          updatedat: string | null
        }
        Insert: {
          createdat?: string | null
          id?: string
          memberid?: string | null
          notes?: string | null
          orderid?: string | null
          processedby?: string | null
          processingstatus?: string | null
          refundamount: number
          refunddate?: string | null
          refundreason: string
          tourid?: string | null
          updatedat?: string | null
        }
        Update: {
          createdat?: string | null
          id?: string
          memberid?: string | null
          notes?: string | null
          orderid?: string | null
          processedby?: string | null
          processingstatus?: string | null
          refundamount?: number
          refunddate?: string | null
          refundreason?: string
          tourid?: string | null
          updatedat?: string | null
        }
        Relationships: []
      }
      tour_request_items: {
        Row: {
          created_at: string | null
          day_number: number | null
          description: string
          id: string
          item_type: string
          quantity: number | null
          reply_content: Json | null
          reply_status: string | null
          request_id: string
          sort_order: number | null
          specifications: Json | null
          subtotal: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          description: string
          id?: string
          item_type: string
          quantity?: number | null
          reply_content?: Json | null
          reply_status?: string | null
          request_id: string
          sort_order?: number | null
          specifications?: Json | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          description?: string
          id?: string
          item_type?: string
          quantity?: number | null
          reply_content?: Json | null
          reply_status?: string | null
          request_id?: string
          sort_order?: number | null
          specifications?: Json | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tour_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_request_member_vouchers: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          member_name: string | null
          request_id: string
          status: string | null
          unit_price: number | null
          updated_at: string | null
          voucher_code: string | null
          voucher_data: Json | null
          voucher_file_url: string | null
          voucher_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          member_name?: string | null
          request_id: string
          status?: string | null
          unit_price?: number | null
          updated_at?: string | null
          voucher_code?: string | null
          voucher_data?: Json | null
          voucher_file_url?: string | null
          voucher_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          member_name?: string | null
          request_id?: string
          status?: string | null
          unit_price?: number | null
          updated_at?: string | null
          voucher_code?: string | null
          voucher_data?: Json | null
          voucher_file_url?: string | null
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_request_member_vouchers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tour_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_request_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          forwarded_at: string | null
          forwarded_message_id: string | null
          forwarded_to_channel: boolean | null
          id: string
          is_important: boolean | null
          is_read: boolean | null
          is_read_by_staff: boolean | null
          is_read_by_supplier: boolean | null
          read_at: string | null
          request_id: string
          sender_id: string
          sender_name: string | null
          sender_type: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          forwarded_at?: string | null
          forwarded_message_id?: string | null
          forwarded_to_channel?: boolean | null
          id?: string
          is_important?: boolean | null
          is_read?: boolean | null
          is_read_by_staff?: boolean | null
          is_read_by_supplier?: boolean | null
          read_at?: string | null
          request_id: string
          sender_id: string
          sender_name?: string | null
          sender_type: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          forwarded_at?: string | null
          forwarded_message_id?: string | null
          forwarded_to_channel?: boolean | null
          id?: string
          is_important?: boolean | null
          is_read?: boolean | null
          is_read_by_staff?: boolean | null
          is_read_by_supplier?: boolean | null
          read_at?: string | null
          request_id?: string
          sender_id?: string
          sender_name?: string | null
          sender_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tour_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_requests: {
        Row: {
          app_sync_data: Json | null
          assignee_id: string | null
          assignee_name: string | null
          category: string
          code: string
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_by_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          currency: string | null
          description: string | null
          estimated_cost: number | null
          final_cost: number | null
          handler_type: string
          id: string
          member_data: Json | null
          member_ids: string[] | null
          order_id: string | null
          priority: string | null
          quantity: number | null
          quoted_cost: number | null
          replied_at: string | null
          replied_by: string | null
          reply_content: Json | null
          reply_note: string | null
          request_type: string | null
          service_date: string | null
          service_date_end: string | null
          specifications: Json | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_response_at: string | null
          supplier_type: string | null
          sync_to_app: boolean | null
          synced_at: string | null
          target_workspace_id: string | null
          title: string
          tour_code: string | null
          tour_id: string
          tour_name: string | null
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
          workspace_id: string
        }
        Insert: {
          app_sync_data?: Json | null
          assignee_id?: string | null
          assignee_name?: string | null
          category: string
          code: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_by_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          currency?: string | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          handler_type?: string
          id?: string
          member_data?: Json | null
          member_ids?: string[] | null
          order_id?: string | null
          priority?: string | null
          quantity?: number | null
          quoted_cost?: number | null
          replied_at?: string | null
          replied_by?: string | null
          reply_content?: Json | null
          reply_note?: string | null
          request_type?: string | null
          service_date?: string | null
          service_date_end?: string | null
          specifications?: Json | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_response_at?: string | null
          supplier_type?: string | null
          sync_to_app?: boolean | null
          synced_at?: string | null
          target_workspace_id?: string | null
          title: string
          tour_code?: string | null
          tour_id: string
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          workspace_id: string
        }
        Update: {
          app_sync_data?: Json | null
          assignee_id?: string | null
          assignee_name?: string | null
          category?: string
          code?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_by_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          currency?: string | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          handler_type?: string
          id?: string
          member_data?: Json | null
          member_ids?: string[] | null
          order_id?: string | null
          priority?: string | null
          quantity?: number | null
          quoted_cost?: number | null
          replied_at?: string | null
          replied_by?: string | null
          reply_content?: Json | null
          reply_note?: string | null
          request_type?: string | null
          service_date?: string | null
          service_date_end?: string | null
          specifications?: Json | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_response_at?: string | null
          supplier_type?: string | null
          sync_to_app?: boolean | null
          synced_at?: string | null
          target_workspace_id?: string | null
          title?: string
          tour_code?: string | null
          tour_id?: string
          tour_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      tour_room_assignments: {
        Row: {
          bed_number: number | null
          created_at: string | null
          id: string
          order_member_id: string
          room_id: string
          updated_at: string | null
        }
        Insert: {
          bed_number?: number | null
          created_at?: string | null
          id?: string
          order_member_id: string
          room_id: string
          updated_at?: string | null
        }
        Update: {
          bed_number?: number | null
          created_at?: string | null
          id?: string
          order_member_id?: string
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_room_assignments_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["order_member_id"]
          },
          {
            foreignKeyName: "tour_room_assignments_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "order_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "tour_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "tour_rooms_status"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_rooms: {
        Row: {
          amount: number | null
          booking_code: string | null
          capacity: number
          created_at: string | null
          display_order: number | null
          hotel_name: string | null
          id: string
          night_number: number
          notes: string | null
          room_number: string | null
          room_type: string
          tour_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          booking_code?: string | null
          capacity?: number
          created_at?: string | null
          display_order?: number | null
          hotel_name?: string | null
          id?: string
          night_number?: number
          notes?: string | null
          room_number?: string | null
          room_type: string
          tour_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          booking_code?: string | null
          capacity?: number
          created_at?: string | null
          display_order?: number | null
          hotel_name?: string | null
          id?: string
          night_number?: number
          notes?: string | null
          room_number?: string | null
          room_type?: string
          tour_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_rooms_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_rooms_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_vehicle_assignments: {
        Row: {
          created_at: string | null
          id: string
          order_member_id: string
          seat_number: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_member_id: string
          seat_number?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_member_id?: string
          seat_number?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_vehicle_assignments_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["order_member_id"]
          },
          {
            foreignKeyName: "tour_vehicle_assignments_order_member_id_fkey"
            columns: ["order_member_id"]
            isOneToOne: false
            referencedRelation: "order_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "tour_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "tour_vehicles_status"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_vehicles: {
        Row: {
          capacity: number
          created_at: string | null
          display_order: number | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          license_plate: string | null
          notes: string | null
          tour_id: string
          updated_at: string | null
          vehicle_name: string
          vehicle_type: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          display_order?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          license_plate?: string | null
          notes?: string | null
          tour_id: string
          updated_at?: string | null
          vehicle_name: string
          vehicle_type?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          display_order?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          license_plate?: string | null
          notes?: string | null
          tour_id?: string
          updated_at?: string | null
          vehicle_name?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_vehicles_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_vehicles_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          archive_reason: string | null
          archived: boolean | null
          checkin_qrcode: string | null
          closed_by: string | null
          closing_date: string | null
          closing_status: string | null
          code: string
          contract_archived_date: string | null
          contract_completed: boolean | null
          contract_content: string | null
          contract_created_at: string | null
          contract_notes: string | null
          contract_status: string
          contract_template: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          departure_date: string
          description: string | null
          enable_checkin: boolean | null
          envelope_records: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          last_unlocked_at: string | null
          last_unlocked_by: string | null
          location: string | null
          locked_at: string | null
          locked_by: string | null
          locked_itinerary_id: string | null
          locked_itinerary_version: number | null
          locked_quote_id: string | null
          locked_quote_version: number | null
          main_city_id: string | null
          max_participants: number | null
          modification_reason: string | null
          name: string
          outbound_flight: Json | null
          price: number | null
          profit: number
          quote_cost_structure: Json | null
          quote_id: string | null
          return_date: string
          return_flight: Json | null
          status: string | null
          total_cost: number
          total_revenue: number
          updated_at: string | null
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archive_reason?: string | null
          archived?: boolean | null
          checkin_qrcode?: string | null
          closed_by?: string | null
          closing_date?: string | null
          closing_status?: string | null
          code: string
          contract_archived_date?: string | null
          contract_completed?: boolean | null
          contract_content?: string | null
          contract_created_at?: string | null
          contract_notes?: string | null
          contract_status?: string
          contract_template?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          departure_date: string
          description?: string | null
          enable_checkin?: boolean | null
          envelope_records?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          last_unlocked_at?: string | null
          last_unlocked_by?: string | null
          location?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_itinerary_id?: string | null
          locked_itinerary_version?: number | null
          locked_quote_id?: string | null
          locked_quote_version?: number | null
          main_city_id?: string | null
          max_participants?: number | null
          modification_reason?: string | null
          name: string
          outbound_flight?: Json | null
          price?: number | null
          profit?: number
          quote_cost_structure?: Json | null
          quote_id?: string | null
          return_date: string
          return_flight?: Json | null
          status?: string | null
          total_cost?: number
          total_revenue?: number
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archive_reason?: string | null
          archived?: boolean | null
          checkin_qrcode?: string | null
          closed_by?: string | null
          closing_date?: string | null
          closing_status?: string | null
          code?: string
          contract_archived_date?: string | null
          contract_completed?: boolean | null
          contract_content?: string | null
          contract_created_at?: string | null
          contract_notes?: string | null
          contract_status?: string
          contract_template?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          departure_date?: string
          description?: string | null
          enable_checkin?: boolean | null
          envelope_records?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          last_unlocked_at?: string | null
          last_unlocked_by?: string | null
          location?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_itinerary_id?: string | null
          locked_itinerary_version?: number | null
          locked_quote_id?: string | null
          locked_quote_version?: number | null
          main_city_id?: string | null
          max_participants?: number | null
          modification_reason?: string | null
          name?: string
          outbound_flight?: Json | null
          price?: number | null
          profit?: number
          quote_cost_structure?: Json | null
          quote_id?: string | null
          return_date?: string
          return_flight?: Json | null
          status?: string | null
          total_cost?: number
          total_revenue?: number
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_main_city_id_fkey"
            columns: ["main_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          order_id: string | null
          status: string | null
          tour_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id: string
          order_id?: string | null
          status?: string | null
          tour_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string | null
          tour_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transportation_rates: {
        Row: {
          category: string | null
          cost_vnd: number | null
          country_id: string | null
          country_name: string
          created_at: string | null
          created_by: string | null
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          display_order: number
          id: string
          is_active: boolean
          is_backup: boolean | null
          kkday_cost: number | null
          kkday_profit: number | null
          kkday_selling_price: number | null
          notes: string | null
          price: number
          price_twd: number | null
          route: string | null
          supplier: string | null
          trip_type: string | null
          unit: string
          updated_at: string | null
          updated_by: string | null
          vehicle_type: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          cost_vnd?: number | null
          country_id?: string | null
          country_name: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_backup?: boolean | null
          kkday_cost?: number | null
          kkday_profit?: number | null
          kkday_selling_price?: number | null
          notes?: string | null
          price?: number
          price_twd?: number | null
          route?: string | null
          supplier?: string | null
          trip_type?: string | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_type: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          cost_vnd?: number | null
          country_id?: string | null
          country_name?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_backup?: boolean | null
          kkday_cost?: number | null
          kkday_profit?: number | null
          kkday_selling_price?: number | null
          notes?: string | null
          price?: number
          price_twd?: number | null
          route?: string | null
          supplier?: string | null
          trip_type?: string | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transportation_rates_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_rates_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_rates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transportation_rates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_card_templates: {
        Row: {
          category: string
          code: string
          created_at: string | null
          icon: string
          id: string
          label_zh: string
          sort_order: number | null
          translations: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          icon: string
          id?: string
          label_zh: string
          sort_order?: number | null
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          icon?: string
          id?: string
          label_zh?: string
          sort_order?: number | null
          translations?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_invoices: {
        Row: {
          allowance_amount: number | null
          allowance_date: string | null
          allowance_items: Json | null
          allowance_no: string | null
          allowanced_by: string | null
          barcode: string | null
          buyer_email: string | null
          buyer_info: Json
          buyer_mobile: string | null
          buyer_name: string
          buyer_ubn: string | null
          created_at: string
          created_by: string
          id: string
          invoice_date: string
          invoice_number: string | null
          items: Json
          merchant_id: string | null
          order_id: string | null
          qrcode_l: string | null
          qrcode_r: string | null
          random_num: string | null
          status: string
          tax_type: string
          total_amount: number
          tour_id: string | null
          transaction_no: string
          updated_at: string
          void_date: string | null
          void_reason: string | null
          voided_by: string | null
        }
        Insert: {
          allowance_amount?: number | null
          allowance_date?: string | null
          allowance_items?: Json | null
          allowance_no?: string | null
          allowanced_by?: string | null
          barcode?: string | null
          buyer_email?: string | null
          buyer_info?: Json
          buyer_mobile?: string | null
          buyer_name: string
          buyer_ubn?: string | null
          created_at?: string
          created_by: string
          id?: string
          invoice_date: string
          invoice_number?: string | null
          items?: Json
          merchant_id?: string | null
          order_id?: string | null
          qrcode_l?: string | null
          qrcode_r?: string | null
          random_num?: string | null
          status?: string
          tax_type?: string
          total_amount: number
          tour_id?: string | null
          transaction_no: string
          updated_at?: string
          void_date?: string | null
          void_reason?: string | null
          voided_by?: string | null
        }
        Update: {
          allowance_amount?: number | null
          allowance_date?: string | null
          allowance_items?: Json | null
          allowance_no?: string | null
          allowanced_by?: string | null
          barcode?: string | null
          buyer_email?: string | null
          buyer_info?: Json
          buyer_mobile?: string | null
          buyer_name?: string
          buyer_ubn?: string | null
          created_at?: string
          created_by?: string
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          items?: Json
          merchant_id?: string | null
          order_id?: string | null
          qrcode_l?: string | null
          qrcode_r?: string | null
          random_num?: string | null
          status?: string
          tax_type?: string
          total_amount?: number
          tour_id?: string | null
          transaction_no?: string
          updated_at?: string
          void_date?: string | null
          void_reason?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_invoices_allowanced_by_fkey"
            columns: ["allowanced_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_invoices_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_invoices_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_invoices_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_badges: {
        Row: {
          badge_type: string
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_conversation_members: {
        Row: {
          conversation_id: string
          employee_id: string | null
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          last_read_message_id: string | null
          left_at: string | null
          member_type: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          employee_id?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          member_type?: string | null
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          employee_id?: string | null
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          member_type?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "traveler_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversation_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_conversations: {
        Row: {
          auto_open_before_days: number | null
          avatar_url: string | null
          close_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_open: boolean | null
          last_message_at: string | null
          last_message_id: string | null
          last_message_preview: string | null
          name: string | null
          open_at: string | null
          split_group_id: string | null
          tour_id: string | null
          trip_id: string | null
          type: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          auto_open_before_days?: number | null
          avatar_url?: string | null
          close_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_open?: boolean | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          name?: string | null
          open_at?: string | null
          split_group_id?: string | null
          tour_id?: string | null
          trip_id?: string | null
          type?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          auto_open_before_days?: number | null
          avatar_url?: string | null
          close_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_open?: boolean | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          name?: string | null
          open_at?: string | null
          split_group_id?: string | null
          tour_id?: string | null
          trip_id?: string | null
          type?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_last_message"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "traveler_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversations_split_group_id_fkey"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "traveler_split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversations_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversations_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_expense_splits: {
        Row: {
          amount: number
          expense_id: string
          id: string
          is_settled: boolean | null
          settled_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          is_settled?: boolean | null
          settled_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          is_settled?: boolean | null
          settled_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "traveler_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expense_date: string | null
          id: string
          paid_by: string
          receipt_url: string | null
          split_group_id: string | null
          title: string
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          paid_by: string
          receipt_url?: string | null
          split_group_id?: string | null
          title: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          paid_by?: string
          receipt_url?: string | null
          split_group_id?: string | null
          title?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_traveler_expenses_split_group"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "traveler_split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_friends: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          friend_id: string
          id: string
          invite_code: string | null
          invite_message: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          friend_id: string
          id?: string
          invite_code?: string | null
          invite_message?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          friend_id?: string
          id?: string
          invite_code?: string | null
          invite_message?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_messages: {
        Row: {
          attachments: Json | null
          content: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          metadata: Json | null
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
          type: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
          type?: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "traveler_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "traveler_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_profiles: {
        Row: {
          active_group_count: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          customer_id: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          id_number: string | null
          id_verified_at: string | null
          is_founding_member: boolean | null
          is_profile_complete: boolean | null
          last_synced_at: string | null
          location: string | null
          member_level: string | null
          member_number: number | null
          phone: string | null
          sync_version: number | null
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          active_group_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          customer_id?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          id_number?: string | null
          id_verified_at?: string | null
          is_founding_member?: boolean | null
          is_profile_complete?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          member_level?: string | null
          member_number?: number | null
          phone?: string | null
          sync_version?: number | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          active_group_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          customer_id?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          id_verified_at?: string | null
          is_founding_member?: boolean | null
          is_profile_complete?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          member_level?: string | null
          member_number?: number | null
          phone?: string | null
          sync_version?: number | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      traveler_settlements: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          from_user: string
          id: string
          note: string | null
          split_group_id: string | null
          status: string | null
          to_user: string
          trip_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_user: string
          id?: string
          note?: string | null
          split_group_id?: string | null
          status?: string | null
          to_user: string
          trip_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_user?: string
          id?: string
          note?: string | null
          split_group_id?: string | null
          status?: string | null
          to_user?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_traveler_settlements_split_group"
            columns: ["split_group_id"]
            isOneToOne: false
            referencedRelation: "traveler_split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_settlements_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_settlements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_split_group_members: {
        Row: {
          display_name: string | null
          group_id: string
          id: string
          is_virtual: boolean | null
          joined_at: string | null
          nickname: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          display_name?: string | null
          group_id: string
          id?: string
          is_virtual?: boolean | null
          joined_at?: string | null
          nickname?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          display_name?: string | null
          group_id?: string
          id?: string
          is_virtual?: boolean | null
          joined_at?: string | null
          nickname?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_split_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "traveler_split_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_split_groups: {
        Row: {
          cover_image: string | null
          created_at: string | null
          created_by: string
          default_currency: string | null
          description: string | null
          id: string
          name: string
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          created_by: string
          default_currency?: string | null
          description?: string | null
          id?: string
          name: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          created_by?: string
          default_currency?: string | null
          description?: string | null
          id?: string
          name?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_split_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_split_groups_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_tour_cache: {
        Row: {
          cached_at: string | null
          chinese_name: string | null
          departure_date: string | null
          english_name: string | null
          id: string
          id_number: string
          identity: string | null
          itinerary_id: string | null
          itinerary_title: string | null
          itinerary_updated_at: string | null
          location: string | null
          member_type: string | null
          needs_refresh: boolean | null
          order_code: string | null
          order_id: string
          order_member_id: string
          order_status: string | null
          outbound_flight: Json | null
          return_date: string | null
          return_flight: Json | null
          source_updated_at: string | null
          tour_code: string
          tour_id: string
          tour_name: string | null
          tour_status: string | null
          traveler_id: string
        }
        Insert: {
          cached_at?: string | null
          chinese_name?: string | null
          departure_date?: string | null
          english_name?: string | null
          id?: string
          id_number: string
          identity?: string | null
          itinerary_id?: string | null
          itinerary_title?: string | null
          itinerary_updated_at?: string | null
          location?: string | null
          member_type?: string | null
          needs_refresh?: boolean | null
          order_code?: string | null
          order_id: string
          order_member_id: string
          order_status?: string | null
          outbound_flight?: Json | null
          return_date?: string | null
          return_flight?: Json | null
          source_updated_at?: string | null
          tour_code: string
          tour_id: string
          tour_name?: string | null
          tour_status?: string | null
          traveler_id: string
        }
        Update: {
          cached_at?: string | null
          chinese_name?: string | null
          departure_date?: string | null
          english_name?: string | null
          id?: string
          id_number?: string
          identity?: string | null
          itinerary_id?: string | null
          itinerary_title?: string | null
          itinerary_updated_at?: string | null
          location?: string | null
          member_type?: string | null
          needs_refresh?: boolean | null
          order_code?: string | null
          order_id?: string
          order_member_id?: string
          order_status?: string | null
          outbound_flight?: Json | null
          return_date?: string | null
          return_flight?: Json | null
          source_updated_at?: string | null
          tour_code?: string
          tour_id?: string
          tour_name?: string | null
          tour_status?: string | null
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_tour_cache_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_accommodations: {
        Row: {
          address: string | null
          booking_platform: string | null
          check_in_date: string | null
          check_out_date: string | null
          confirmation_number: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          room_count: number | null
          room_type: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          booking_platform?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          room_count?: number | null
          room_type?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          booking_platform?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          room_count?: number | null
          room_type?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_briefings: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          title: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_briefings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_flights: {
        Row: {
          airline: string | null
          arrival_airport: string | null
          arrival_airport_code: string | null
          arrival_date: string | null
          arrival_time: string | null
          cabin_class: string | null
          created_at: string | null
          departure_airport: string | null
          departure_airport_code: string | null
          departure_date: string | null
          departure_time: string | null
          flight_no: string | null
          flight_type: string | null
          id: string
          meeting_location: string | null
          meeting_time: string | null
          pnr: string | null
          ticket_number: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_airport_code?: string | null
          arrival_date?: string | null
          arrival_time?: string | null
          cabin_class?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_airport_code?: string | null
          departure_date?: string | null
          departure_time?: string | null
          flight_no?: string | null
          flight_type?: string | null
          id?: string
          meeting_location?: string | null
          meeting_time?: string | null
          pnr?: string | null
          ticket_number?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          airline?: string | null
          arrival_airport?: string | null
          arrival_airport_code?: string | null
          arrival_date?: string | null
          arrival_time?: string | null
          cabin_class?: string | null
          created_at?: string | null
          departure_airport?: string | null
          departure_airport_code?: string | null
          departure_date?: string | null
          departure_time?: string | null
          flight_no?: string | null
          flight_type?: string | null
          id?: string
          meeting_location?: string | null
          meeting_time?: string | null
          pnr?: string | null
          ticket_number?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_flights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_invitations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invite_code: string
          invitee_id: string | null
          inviter_id: string
          role: string | null
          status: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invitee_id?: string | null
          inviter_id: string
          role?: string | null
          status?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invitee_id?: string | null
          inviter_id?: string
          role?: string | null
          status?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_trip_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_trip_invitations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_itinerary_items: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          day_number: number | null
          description: string | null
          end_time: string | null
          estimated_cost: number | null
          icon: string | null
          id: string
          item_date: string | null
          latitude: number | null
          location_address: string | null
          location_name: string | null
          location_url: string | null
          longitude: number | null
          notes: string | null
          sort_order: number | null
          start_time: string | null
          title: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          day_number?: number | null
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          icon?: string | null
          id?: string
          item_date?: string | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          location_url?: string | null
          longitude?: number | null
          notes?: string | null
          sort_order?: number | null
          start_time?: string | null
          title: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          day_number?: number | null
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          icon?: string | null
          id?: string
          item_date?: string | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          location_url?: string | null
          longitude?: number | null
          notes?: string | null
          sort_order?: number | null
          start_time?: string | null
          title?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trip_members: {
        Row: {
          id: string
          joined_at: string | null
          nickname: string | null
          role: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "traveler_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_trips: {
        Row: {
          cover_image: string | null
          created_at: string | null
          created_by: string
          default_currency: string | null
          description: string | null
          end_date: string | null
          erp_tour_id: string | null
          id: string
          start_date: string | null
          status: string | null
          title: string
          tour_code: string | null
          trip_source: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          created_by: string
          default_currency?: string | null
          description?: string | null
          end_date?: string | null
          erp_tour_id?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title: string
          tour_code?: string | null
          trip_source?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          created_by?: string
          default_currency?: string | null
          description?: string | null
          end_date?: string | null
          erp_tour_id?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          tour_code?: string | null
          trip_source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traveler_trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          app_user_id: string | null
          assigned_itinerary_id: string
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          invited_by: string | null
          name: string
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          app_user_id?: string | null
          assigned_itinerary_id: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          name: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_user_id?: string | null
          assigned_itinerary_id?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          name?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_assigned_itinerary_id_fkey"
            columns: ["assigned_itinerary_id"]
            isOneToOne: false
            referencedRelation: "customer_assigned_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members_v2: {
        Row: {
          assigned_itinerary_id: string
          customer_id: string
          esim_activation_date: string | null
          esim_data_plan: string | null
          esim_expiry_date: string | null
          esim_provider: string | null
          esim_url: string | null
          id: string
          joined_at: string
          payment_balance_due_date: string | null
          payment_currency: string | null
          payment_deposit_amount: number | null
          payment_deposit_paid_at: string | null
          payment_paid_amount: number | null
          payment_records: Json | null
          payment_status: string | null
          payment_total_amount: number | null
          role: string
          room_assignments: Json | null
          visa_application_date: string | null
          visa_country: string | null
          visa_expiry_date: string | null
          visa_notes: string | null
          visa_status: string | null
          visa_type: string | null
        }
        Insert: {
          assigned_itinerary_id: string
          customer_id: string
          esim_activation_date?: string | null
          esim_data_plan?: string | null
          esim_expiry_date?: string | null
          esim_provider?: string | null
          esim_url?: string | null
          id?: string
          joined_at?: string
          payment_balance_due_date?: string | null
          payment_currency?: string | null
          payment_deposit_amount?: number | null
          payment_deposit_paid_at?: string | null
          payment_paid_amount?: number | null
          payment_records?: Json | null
          payment_status?: string | null
          payment_total_amount?: number | null
          role?: string
          room_assignments?: Json | null
          visa_application_date?: string | null
          visa_country?: string | null
          visa_expiry_date?: string | null
          visa_notes?: string | null
          visa_status?: string | null
          visa_type?: string | null
        }
        Update: {
          assigned_itinerary_id?: string
          customer_id?: string
          esim_activation_date?: string | null
          esim_data_plan?: string | null
          esim_expiry_date?: string | null
          esim_provider?: string | null
          esim_url?: string | null
          id?: string
          joined_at?: string
          payment_balance_due_date?: string | null
          payment_currency?: string | null
          payment_deposit_amount?: number | null
          payment_deposit_paid_at?: string | null
          payment_paid_amount?: number | null
          payment_records?: Json | null
          payment_status?: string | null
          payment_total_amount?: number | null
          role?: string
          room_assignments?: Json | null
          visa_application_date?: string | null
          visa_country?: string | null
          visa_expiry_date?: string | null
          visa_notes?: string | null
          visa_status?: string | null
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_v2_assigned_itinerary_id_fkey"
            columns: ["assigned_itinerary_id"]
            isOneToOne: false
            referencedRelation: "assigned_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      usa_esta: {
        Row: {
          applicant_name_zh: string
          application_code: string
          application_number: string | null
          birth_city: string | null
          birth_country: string | null
          cbp_membership_number: string | null
          company_address_en: string | null
          company_address_zh: string | null
          company_name_en: string | null
          company_name_zh: string | null
          company_phone: string | null
          contact_address_en: string | null
          contact_address_zh: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          emergency_contact_country_code: string | null
          emergency_contact_email: string | null
          emergency_contact_firstname_en: string | null
          emergency_contact_firstname_zh: string | null
          emergency_contact_phone: string | null
          emergency_contact_surname_en: string | null
          emergency_contact_surname_zh: string | null
          employment_status: string | null
          esta_validity_end: string | null
          esta_validity_start: string | null
          father_firstname_en: string | null
          father_firstname_zh: string | null
          father_surname_en: string | null
          father_surname_zh: string | null
          had_citizenship_acquired_date: string | null
          had_citizenship_renounced_date: string | null
          had_other_citizenship: boolean | null
          had_other_citizenship_country: string | null
          has_other_citizenship: boolean | null
          has_other_names: boolean | null
          has_other_passport_or_id: boolean | null
          id: string
          is_cbp_global_entry_member: boolean | null
          is_transit_to_another_country: boolean | null
          job_title_en: string | null
          job_title_zh: string | null
          mother_firstname_en: string | null
          mother_firstname_zh: string | null
          mother_surname_en: string | null
          mother_surname_zh: string | null
          no_social_media: boolean | null
          order_id: string | null
          other_citizenship_country: string | null
          other_citizenship_method: string | null
          other_citizenship_method_detail: string | null
          other_document_country: string | null
          other_document_expiry_year: number | null
          other_document_number: string | null
          other_document_type: string | null
          other_name_firstname_en: string | null
          other_name_firstname_zh: string | null
          other_name_surname_en: string | null
          other_name_surname_zh: string | null
          passport_validity_over_2_years: boolean
          provides_social_media: boolean | null
          q1_has_health_issues: boolean | null
          q2_has_criminal_record: boolean | null
          q3_has_drug_violation: boolean | null
          q4_involved_in_terrorism: boolean | null
          q5_committed_fraud: boolean | null
          q6_illegal_employment: boolean | null
          q7_denied_when: string | null
          q7_denied_where: string | null
          q7_visa_denied: boolean | null
          q8_overstayed: boolean | null
          q9_countries_visited: string[] | null
          q9_visit_end_month: number | null
          q9_visit_end_year: number | null
          q9_visit_purpose: string | null
          q9_visit_purpose_detail: string | null
          q9_visit_start_month: number | null
          q9_visit_start_year: number | null
          q9_visited_restricted_countries: boolean | null
          social_media_id_1: string | null
          social_media_id_2: string | null
          social_media_platform_1: string | null
          social_media_platform_2: string | null
          status: string | null
          tour_id: string | null
          transit_destination_country: string | null
          updated_at: string | null
          updated_by: string | null
          us_contact_address_en: string | null
          us_contact_city_en: string | null
          us_contact_name_en: string | null
          us_contact_phone: string | null
          us_contact_state_en: string | null
          us_stay_address_en: string | null
          us_stay_city_en: string | null
          us_stay_state_en: string | null
          workspace_id: string
        }
        Insert: {
          applicant_name_zh: string
          application_code: string
          application_number?: string | null
          birth_city?: string | null
          birth_country?: string | null
          cbp_membership_number?: string | null
          company_address_en?: string | null
          company_address_zh?: string | null
          company_name_en?: string | null
          company_name_zh?: string | null
          company_phone?: string | null
          contact_address_en?: string | null
          contact_address_zh?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          emergency_contact_country_code?: string | null
          emergency_contact_email?: string | null
          emergency_contact_firstname_en?: string | null
          emergency_contact_firstname_zh?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_surname_en?: string | null
          emergency_contact_surname_zh?: string | null
          employment_status?: string | null
          esta_validity_end?: string | null
          esta_validity_start?: string | null
          father_firstname_en?: string | null
          father_firstname_zh?: string | null
          father_surname_en?: string | null
          father_surname_zh?: string | null
          had_citizenship_acquired_date?: string | null
          had_citizenship_renounced_date?: string | null
          had_other_citizenship?: boolean | null
          had_other_citizenship_country?: string | null
          has_other_citizenship?: boolean | null
          has_other_names?: boolean | null
          has_other_passport_or_id?: boolean | null
          id?: string
          is_cbp_global_entry_member?: boolean | null
          is_transit_to_another_country?: boolean | null
          job_title_en?: string | null
          job_title_zh?: string | null
          mother_firstname_en?: string | null
          mother_firstname_zh?: string | null
          mother_surname_en?: string | null
          mother_surname_zh?: string | null
          no_social_media?: boolean | null
          order_id?: string | null
          other_citizenship_country?: string | null
          other_citizenship_method?: string | null
          other_citizenship_method_detail?: string | null
          other_document_country?: string | null
          other_document_expiry_year?: number | null
          other_document_number?: string | null
          other_document_type?: string | null
          other_name_firstname_en?: string | null
          other_name_firstname_zh?: string | null
          other_name_surname_en?: string | null
          other_name_surname_zh?: string | null
          passport_validity_over_2_years: boolean
          provides_social_media?: boolean | null
          q1_has_health_issues?: boolean | null
          q2_has_criminal_record?: boolean | null
          q3_has_drug_violation?: boolean | null
          q4_involved_in_terrorism?: boolean | null
          q5_committed_fraud?: boolean | null
          q6_illegal_employment?: boolean | null
          q7_denied_when?: string | null
          q7_denied_where?: string | null
          q7_visa_denied?: boolean | null
          q8_overstayed?: boolean | null
          q9_countries_visited?: string[] | null
          q9_visit_end_month?: number | null
          q9_visit_end_year?: number | null
          q9_visit_purpose?: string | null
          q9_visit_purpose_detail?: string | null
          q9_visit_start_month?: number | null
          q9_visit_start_year?: number | null
          q9_visited_restricted_countries?: boolean | null
          social_media_id_1?: string | null
          social_media_id_2?: string | null
          social_media_platform_1?: string | null
          social_media_platform_2?: string | null
          status?: string | null
          tour_id?: string | null
          transit_destination_country?: string | null
          updated_at?: string | null
          updated_by?: string | null
          us_contact_address_en?: string | null
          us_contact_city_en?: string | null
          us_contact_name_en?: string | null
          us_contact_phone?: string | null
          us_contact_state_en?: string | null
          us_stay_address_en?: string | null
          us_stay_city_en?: string | null
          us_stay_state_en?: string | null
          workspace_id: string
        }
        Update: {
          applicant_name_zh?: string
          application_code?: string
          application_number?: string | null
          birth_city?: string | null
          birth_country?: string | null
          cbp_membership_number?: string | null
          company_address_en?: string | null
          company_address_zh?: string | null
          company_name_en?: string | null
          company_name_zh?: string | null
          company_phone?: string | null
          contact_address_en?: string | null
          contact_address_zh?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          emergency_contact_country_code?: string | null
          emergency_contact_email?: string | null
          emergency_contact_firstname_en?: string | null
          emergency_contact_firstname_zh?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_surname_en?: string | null
          emergency_contact_surname_zh?: string | null
          employment_status?: string | null
          esta_validity_end?: string | null
          esta_validity_start?: string | null
          father_firstname_en?: string | null
          father_firstname_zh?: string | null
          father_surname_en?: string | null
          father_surname_zh?: string | null
          had_citizenship_acquired_date?: string | null
          had_citizenship_renounced_date?: string | null
          had_other_citizenship?: boolean | null
          had_other_citizenship_country?: string | null
          has_other_citizenship?: boolean | null
          has_other_names?: boolean | null
          has_other_passport_or_id?: boolean | null
          id?: string
          is_cbp_global_entry_member?: boolean | null
          is_transit_to_another_country?: boolean | null
          job_title_en?: string | null
          job_title_zh?: string | null
          mother_firstname_en?: string | null
          mother_firstname_zh?: string | null
          mother_surname_en?: string | null
          mother_surname_zh?: string | null
          no_social_media?: boolean | null
          order_id?: string | null
          other_citizenship_country?: string | null
          other_citizenship_method?: string | null
          other_citizenship_method_detail?: string | null
          other_document_country?: string | null
          other_document_expiry_year?: number | null
          other_document_number?: string | null
          other_document_type?: string | null
          other_name_firstname_en?: string | null
          other_name_firstname_zh?: string | null
          other_name_surname_en?: string | null
          other_name_surname_zh?: string | null
          passport_validity_over_2_years?: boolean
          provides_social_media?: boolean | null
          q1_has_health_issues?: boolean | null
          q2_has_criminal_record?: boolean | null
          q3_has_drug_violation?: boolean | null
          q4_involved_in_terrorism?: boolean | null
          q5_committed_fraud?: boolean | null
          q6_illegal_employment?: boolean | null
          q7_denied_when?: string | null
          q7_denied_where?: string | null
          q7_visa_denied?: boolean | null
          q8_overstayed?: boolean | null
          q9_countries_visited?: string[] | null
          q9_visit_end_month?: number | null
          q9_visit_end_year?: number | null
          q9_visit_purpose?: string | null
          q9_visit_purpose_detail?: string | null
          q9_visit_start_month?: number | null
          q9_visit_start_year?: number | null
          q9_visited_restricted_countries?: boolean | null
          social_media_id_1?: string | null
          social_media_id_2?: string | null
          social_media_platform_1?: string | null
          social_media_platform_2?: string | null
          status?: string | null
          tour_id?: string | null
          transit_destination_country?: string | null
          updated_at?: string | null
          updated_by?: string | null
          us_contact_address_en?: string | null
          us_contact_city_en?: string | null
          us_contact_name_en?: string | null
          us_contact_phone?: string | null
          us_contact_state_en?: string | null
          us_stay_address_en?: string | null
          us_stay_city_en?: string | null
          us_stay_state_en?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usa_esta_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usa_esta_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey_badges"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points_change: number
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points_change: number
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points_change?: number
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preference_key: string
          preference_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_key: string
          preference_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          permissions: string[] | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_costs: {
        Row: {
          cost: number
          created_at: string | null
          id: string
          updated_at: string | null
          vendor_name: string
          visa_type: string
        }
        Insert: {
          cost?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vendor_name: string
          visa_type: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vendor_name?: string
          visa_type?: string
        }
        Relationships: []
      }
      visas: {
        Row: {
          _needs_sync: boolean | null
          _synced_at: string | null
          actual_submission_date: string | null
          applicant_name: string
          code: string
          contact_person: string
          contact_phone: string
          cost: number | null
          country: string
          created_at: string | null
          created_by: string | null
          documents_returned_date: string | null
          expected_issue_date: string | null
          fee: number | null
          id: string
          is_active: boolean | null
          note: string | null
          order_id: string
          order_number: string
          pickup_date: string | null
          received_date: string | null
          status: string | null
          submission_date: string | null
          tour_id: string
          updated_at: string | null
          updated_by: string | null
          vendor: string | null
          visa_type: string
          workspace_id: string
        }
        Insert: {
          _needs_sync?: boolean | null
          _synced_at?: string | null
          actual_submission_date?: string | null
          applicant_name: string
          code: string
          contact_person: string
          contact_phone: string
          cost?: number | null
          country: string
          created_at?: string | null
          created_by?: string | null
          documents_returned_date?: string | null
          expected_issue_date?: string | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          note?: string | null
          order_id: string
          order_number: string
          pickup_date?: string | null
          received_date?: string | null
          status?: string | null
          submission_date?: string | null
          tour_id: string
          updated_at?: string | null
          updated_by?: string | null
          vendor?: string | null
          visa_type: string
          workspace_id: string
        }
        Update: {
          _needs_sync?: boolean | null
          _synced_at?: string | null
          actual_submission_date?: string | null
          applicant_name?: string
          code?: string
          contact_person?: string
          contact_phone?: string
          cost?: number | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          documents_returned_date?: string | null
          expected_issue_date?: string | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          note?: string | null
          order_id?: string
          order_number?: string
          pickup_date?: string | null
          received_date?: string | null
          status?: string | null
          submission_date?: string | null
          tour_id?: string
          updated_at?: string | null
          updated_by?: string | null
          vendor?: string | null
          visa_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visas_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visas_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visas_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_entries: {
        Row: {
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          entry_no: number
          id: string
          subject_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_no: number
          id?: string
          subject_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_no?: number
          id?: string
          subject_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "accounting_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          posted_at: string | null
          posted_by: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          total_credit: number | null
          total_debit: number | null
          type: string
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          voucher_date: string
          voucher_no: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          total_credit?: number | null
          total_debit?: number | null
          type: string
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voucher_date: string
          voucher_no: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          total_credit?: number | null
          total_debit?: number | null
          type?: string
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voucher_date?: string
          voucher_no?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number | null
          end_time: string | null
          feeling: number | null
          id: string
          notes: string | null
          start_time: string | null
          total_reps: number | null
          total_sets: number | null
          total_volume: number | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes?: number | null
          end_time?: string | null
          feeling?: number | null
          id?: string
          notes?: string | null
          start_time?: string | null
          total_reps?: number | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number | null
          end_time?: string | null
          feeling?: number | null
          id?: string
          notes?: string | null
          start_time?: string | null
          total_reps?: number | null
          total_sets?: number | null
          total_volume?: number | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean | null
          created_at: string
          distance_meters: number | null
          duration_seconds: number | null
          exercise_category: string
          exercise_id: number
          exercise_name: string
          id: string
          notes: string | null
          reps: number | null
          rest_seconds: number | null
          session_id: string
          set_number: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_category: string
          exercise_id: number
          exercise_name: string
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          session_id: string
          set_number: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_category?: string
          exercise_id?: number
          exercise_name?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          session_id?: string
          set_number?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_items: {
        Row: {
          content: Json | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_pinned: boolean | null
          item_type: string
          owner: string
          priority: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          item_type: string
          owner: string
          priority?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          item_type?: string
          owner?: string
          priority?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workspace_modules: {
        Row: {
          created_at: string | null
          enabled_at: string | null
          expires_at: string | null
          id: string
          is_enabled: boolean | null
          module_name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          enabled_at?: string | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          enabled_at?: string | null
          expires_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_config: Json | null
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_erp_tours: {
        Row: {
          chinese_name: string | null
          destination: string | null
          end_date: string | null
          english_name: string | null
          id: string | null
          member_category: string | null
          member_type: string | null
          order_code: string | null
          order_id: string | null
          order_member_id: string | null
          order_status: string | null
          start_date: string | null
          status: string | null
          title: string | null
          tour_code: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      my_tours: {
        Row: {
          cached_at: string | null
          chinese_name: string | null
          destination: string | null
          end_date: string | null
          english_name: string | null
          id: string | null
          identity: string | null
          itinerary_title: string | null
          member_type: string | null
          order_code: string | null
          order_status: string | null
          outbound_flight: Json | null
          return_flight: Json | null
          source_updated_at: string | null
          start_date: string | null
          status: string | null
          title: string | null
          tour_code: string | null
        }
        Insert: {
          cached_at?: string | null
          chinese_name?: string | null
          destination?: string | null
          end_date?: string | null
          english_name?: string | null
          id?: string | null
          identity?: string | null
          itinerary_title?: string | null
          member_type?: string | null
          order_code?: string | null
          order_status?: string | null
          outbound_flight?: Json | null
          return_flight?: Json | null
          source_updated_at?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          tour_code?: string | null
        }
        Update: {
          cached_at?: string | null
          chinese_name?: string | null
          destination?: string | null
          end_date?: string | null
          english_name?: string | null
          id?: string | null
          identity?: string | null
          itinerary_title?: string | null
          member_type?: string | null
          order_code?: string | null
          order_status?: string | null
          outbound_flight?: Json | null
          return_flight?: Json | null
          source_updated_at?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          tour_code?: string | null
        }
        Relationships: []
      }
      tour_requests_progress: {
        Row: {
          cancelled_requests: number | null
          completed_requests: number | null
          completion_percentage: number | null
          draft_requests: number | null
          in_progress_requests: number | null
          total_requests: number | null
          tour_code: string | null
          tour_id: string | null
          tour_name: string | null
          workspace_id: string | null
        }
        Relationships: []
      }
      tour_rooms_status: {
        Row: {
          assigned_count: number | null
          capacity: number | null
          display_order: number | null
          hotel_name: string | null
          id: string | null
          is_full: boolean | null
          night_number: number | null
          notes: string | null
          remaining_beds: number | null
          room_number: string | null
          room_type: string | null
          tour_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_rooms_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_rooms_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_vehicles_status: {
        Row: {
          assigned_count: number | null
          capacity: number | null
          display_order: number | null
          driver_name: string | null
          driver_phone: string | null
          id: string | null
          is_full: boolean | null
          license_plate: string | null
          notes: string | null
          remaining_seats: number | null
          tour_id: string | null
          vehicle_name: string | null
          vehicle_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_vehicles_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "my_erp_tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_vehicles_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_employee_to_tour_conversation: {
        Args: { p_employee_id: string; p_role?: string; p_tour_id: string }
        Returns: undefined
      }
      auto_open_tour_conversations: { Args: never; Returns: number }
      auto_open_tour_conversations_with_logging: {
        Args: never
        Returns: undefined
      }
      can_manage_workspace: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      check_my_tours_updates: {
        Args: { p_last_synced_at?: string }
        Returns: Json
      }
      confirm_quote_by_customer: {
        Args: {
          p_email?: string
          p_ip_address?: string
          p_name: string
          p_notes?: string
          p_phone?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      confirm_quote_by_staff: {
        Args: {
          p_notes?: string
          p_quote_id: string
          p_staff_id: string
          p_staff_name: string
        }
        Returns: Json
      }
      create_atomic_transaction: {
        Args: {
          p_account_id: string
          p_amount: number
          p_category_id: string
          p_description: string
          p_transaction_date: string
          p_transaction_type: string
        }
        Returns: undefined
      }
      ensure_traveler_profile: {
        Args: {
          p_avatar_url?: string
          p_email?: string
          p_full_name?: string
          p_user_id: string
        }
        Returns: string
      }
      generate_confirmation_token: { Args: never; Returns: string }
      get_cron_job_status: {
        Args: never
        Returns: {
          job_name: string
          last_run: string
          next_run: string
          schedule: string
          status: string
        }[]
      }
      get_current_employee_id: { Args: never; Returns: string }
      get_current_traveler_id: { Args: never; Returns: string }
      get_current_user_workspace: { Args: never; Returns: string }
      get_my_tour_details: { Args: { p_tour_code: string }; Returns: Json }
      get_or_create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_or_create_dm_channel: {
        Args: {
          p_user_1_id: string
          p_user_2_id: string
          p_workspace_id: string
        }
        Returns: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          archived_at: string | null
          channel_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          is_announcement: boolean
          is_archived: boolean | null
          is_company_wide: boolean | null
          is_favorite: boolean | null
          is_pinned: boolean | null
          name: string
          order: number | null
          scope: string | null
          tour_id: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          visibility: Database["public"]["Enums"]["channel_visibility"] | null
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "channels"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_tour_conversations: {
        Args: { p_workspace_id: string }
        Returns: {
          conversation_id: string
          conversation_type: string
          departure_date: string
          is_open: boolean
          last_message_at: string
          last_message_preview: string
          member_count: number
          open_at: string
          tour_code: string
          tour_id: string
          tour_name: string
          traveler_count: number
          unread_count: number
        }[]
      }
      get_unread_count: { Args: { p_conversation_id: string }; Returns: number }
      get_unread_counts_batch: {
        Args: { p_conversation_ids: string[] }
        Returns: {
          conversation_id: string
          unread_count: number
        }[]
      }
      get_user_permission: {
        Args: { p_itinerary_id: string; p_user_id: string }
        Returns: string
      }
      get_user_project_ids: { Args: { uid: string }; Returns: string[] }
      get_user_workspace_id: { Args: never; Returns: string }
      has_permission: { Args: { permission_name: string }; Returns: boolean }
      increment_points: {
        Args: { customer_id_param: string; points_param: number }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id: string }; Returns: boolean }
      is_employee: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_traveler: { Args: never; Returns: boolean }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      refresh_all_region_stats: { Args: never; Returns: undefined }
      refresh_traveler_tour_cache: {
        Args: { p_traveler_id?: string }
        Returns: number
      }
      revoke_quote_confirmation: {
        Args: {
          p_quote_id: string
          p_reason: string
          p_staff_id: string
          p_staff_name: string
        }
        Returns: Json
      }
      run_auto_open_now: {
        Args: never
        Returns: {
          executed_at: string
          opened_count: number
        }[]
      }
      send_quote_confirmation: {
        Args: {
          p_expires_in_days?: number
          p_quote_id: string
          p_staff_id?: string
        }
        Returns: Json
      }
      send_tour_message: {
        Args: {
          p_attachments?: Json
          p_content: string
          p_conversation_id: string
          p_type?: string
        }
        Returns: string
      }
      set_current_workspace: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      sync_my_tours: { Args: never; Returns: Json }
      toggle_tour_conversation: {
        Args: {
          p_is_open: boolean
          p_send_welcome?: boolean
          p_tour_id: string
        }
        Returns: undefined
      }
      update_city_stats: { Args: { p_city_id: string }; Returns: undefined }
    }
    Enums: {
      accounting_event_status: "posted" | "reversed"
      accounting_event_type:
        | "customer_receipt_posted"
        | "supplier_payment_posted"
        | "group_settlement_posted"
        | "bonus_paid"
        | "tax_paid"
        | "manual_voucher"
      calendar_visibility: "private" | "workspace" | "company_wide"
      channel_visibility: "private" | "public"
      confirmation_type: "accommodation" | "flight"
      subledger_type: "customer" | "supplier" | "bank" | "group" | "employee"
      verification_status: "verified" | "unverified" | "rejected"
      voucher_status: "draft" | "posted" | "reversed" | "locked"
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
    Enums: {
      accounting_event_status: ["posted", "reversed"],
      accounting_event_type: [
        "customer_receipt_posted",
        "supplier_payment_posted",
        "group_settlement_posted",
        "bonus_paid",
        "tax_paid",
        "manual_voucher",
      ],
      calendar_visibility: ["private", "workspace", "company_wide"],
      channel_visibility: ["private", "public"],
      confirmation_type: ["accommodation", "flight"],
      subledger_type: ["customer", "supplier", "bank", "group", "employee"],
      verification_status: ["verified", "unverified", "rejected"],
      voucher_status: ["draft", "posted", "reversed", "locked"],
    },
  },
} as const
