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
      attractions: {
        Row: {
          address: string | null
          category: string | null
          city_id: string
          country_id: string
          created_at: string | null
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
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city_id: string
          country_id: string
          created_at?: string | null
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
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city_id?: string
          country_id?: string
          created_at?: string | null
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
          updated_at?: string | null
          website?: string | null
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
        ]
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
      channels: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          is_favorite: boolean | null
          name: string
          order: number | null
          tour_id: string | null
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          order?: number | null
          tour_id?: string | null
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          order?: number | null
          tour_id?: string | null
          type?: string | null
          updated_at?: string | null
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
            referencedRelation: "tours"
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
          name: string
          name_en: string | null
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
          name: string
          name_en?: string | null
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
          name?: string
          name_en?: string | null
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
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_templates: {
        Row: {
          attraction_id: string | null
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
          id: string
          is_active: boolean | null
          item_name: string
          item_name_en: string | null
          max_quantity: number | null
          min_quantity: number | null
          notes: string | null
          season: string | null
          selling_price: number | null
          supplier_id: string
          unit: string
          updated_at: string | null
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          attraction_id?: string | null
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
          id?: string
          is_active?: boolean | null
          item_name: string
          item_name_en?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          season?: string | null
          selling_price?: number | null
          supplier_id: string
          unit: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          attraction_id?: string | null
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
          id?: string
          is_active?: boolean | null
          item_name?: string
          item_name_en?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          season?: string | null
          selling_price?: number | null
          supplier_id?: string
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
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
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          alternative_phone: string | null
          city: string | null
          code: string
          company: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: Json | null
          english_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_vip: boolean | null
          last_order_date: string | null
          name: string
          national_id: string | null
          notes: string | null
          passport_expiry_date: string | null
          passport_number: string | null
          passport_romanization: string | null
          phone: string | null
          referred_by: string | null
          source: string | null
          tax_id: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          vip_level: string | null
        }
        Insert: {
          address?: string | null
          alternative_phone?: string | null
          city?: string | null
          code: string
          company?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: Json | null
          english_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_vip?: boolean | null
          last_order_date?: string | null
          name: string
          national_id?: string | null
          notes?: string | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_romanization?: string | null
          phone?: string | null
          referred_by?: string | null
          source?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          vip_level?: string | null
        }
        Update: {
          address?: string | null
          alternative_phone?: string | null
          city?: string | null
          code?: string
          company?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: Json | null
          english_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_vip?: boolean | null
          last_order_date?: string | null
          name?: string
          national_id?: string | null
          notes?: string | null
          passport_expiry_date?: string | null
          passport_number?: string | null
          passport_romanization?: string | null
          phone?: string | null
          referred_by?: string | null
          source?: string | null
          tax_id?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          vip_level?: string | null
        }
        Relationships: []
      }
      disbursement_orders: {
        Row: {
          amount: number
          code: string
          created_at: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_request_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id: string
          notes?: string | null
          payment_method?: string | null
          payment_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          id: string
          is_active: boolean | null
          job_info: Json | null
          last_login_at: string | null
          password_hash: string | null
          permissions: string[] | null
          personal_info: Json | null
          roles: string[] | null
          salary_info: Json | null
          status: string | null
          updated_at: string | null
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
          id?: string
          is_active?: boolean | null
          job_info?: Json | null
          last_login_at?: string | null
          password_hash?: string | null
          permissions?: string[] | null
          personal_info?: Json | null
          roles?: string[] | null
          salary_info?: Json | null
          status?: string | null
          updated_at?: string | null
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
          id?: string
          is_active?: boolean | null
          job_info?: Json | null
          last_login_at?: string | null
          password_hash?: string | null
          permissions?: string[] | null
          personal_info?: Json | null
          roles?: string[] | null
          salary_info?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      itineraries: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          author_name: string | null
          city: string
          code: string | null
          country: string
          cover_image: string | null
          coverImage: string | null
          created_at: string
          created_by: string | null
          daily_itinerary: Json | null
          dailyItinerary: Json | null
          departure_date: string
          departureDate: string | null
          description: string | null
          features: Json | null
          focus_cards: Json | null
          focusCards: Json | null
          id: string
          itinerary_subtitle: string | null
          itinerarySubtitle: string | null
          leader: Json | null
          meeting_info: Json | null
          meetingInfo: Json | null
          outbound_flight: Json | null
          outboundFlight: Json | null
          return_flight: Json | null
          returnFlight: Json | null
          status: string
          subtitle: string
          tagline: string
          title: string
          tour_code: string
          tour_id: string | null
          tourCode: string | null
          updated_at: string
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_name?: string | null
          city: string
          code?: string | null
          country: string
          cover_image?: string | null
          coverImage?: string | null
          created_at?: string
          created_by?: string | null
          daily_itinerary?: Json | null
          dailyItinerary?: Json | null
          departure_date: string
          departureDate?: string | null
          description?: string | null
          features?: Json | null
          focus_cards?: Json | null
          focusCards?: Json | null
          id?: string
          itinerary_subtitle?: string | null
          itinerarySubtitle?: string | null
          leader?: Json | null
          meeting_info?: Json | null
          meetingInfo?: Json | null
          outbound_flight?: Json | null
          outboundFlight?: Json | null
          return_flight?: Json | null
          returnFlight?: Json | null
          status?: string
          subtitle?: string
          tagline?: string
          title: string
          tour_code: string
          tour_id?: string | null
          tourCode?: string | null
          updated_at?: string
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          author_name?: string | null
          city?: string
          code?: string | null
          country?: string
          cover_image?: string | null
          coverImage?: string | null
          created_at?: string
          created_by?: string | null
          daily_itinerary?: Json | null
          dailyItinerary?: Json | null
          departure_date?: string
          departureDate?: string | null
          description?: string | null
          features?: Json | null
          focus_cards?: Json | null
          focusCards?: Json | null
          id?: string
          itinerary_subtitle?: string | null
          itinerarySubtitle?: string | null
          leader?: Json | null
          meeting_info?: Json | null
          meetingInfo?: Json | null
          outbound_flight?: Json | null
          outboundFlight?: Json | null
          return_flight?: Json | null
          returnFlight?: Json | null
          status?: string
          subtitle?: string
          tagline?: string
          title?: string
          tour_code?: string
          tour_id?: string | null
          tourCode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          dietary_requirements: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          english_name: string | null
          gender: string | null
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
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          english_name?: string | null
          gender?: string | null
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
          created_at?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          english_name?: string | null
          gender?: string | null
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
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          reactions: Json | null
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
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          reactions?: Json | null
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
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          reactions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          created_at: string | null
          customer_id: string
          id: string
          member_type: string
          order_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          member_type: string
          order_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          member_type?: string
          order_id?: string
        }
        Relationships: []
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
          customer_id: string | null
          id: string
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
          customer_id?: string | null
          id: string
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
          customer_id?: string | null
          id?: string
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
        }
        Relationships: [
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
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_request_items: {
        Row: {
          category: string | null
          createdat: string | null
          id: string
          itemname: string
          notes: string | null
          quantity: number | null
          requestid: string | null
          totalprice: number | null
          unitprice: number | null
        }
        Insert: {
          category?: string | null
          createdat?: string | null
          id?: string
          itemname: string
          notes?: string | null
          quantity?: number | null
          requestid?: string | null
          totalprice?: number | null
          unitprice?: number | null
        }
        Update: {
          category?: string | null
          createdat?: string | null
          id?: string
          itemname?: string
          notes?: string | null
          quantity?: number | null
          requestid?: string | null
          totalprice?: number | null
          unitprice?: number | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          request_type: string
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          tour_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          request_type: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tour_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          request_type?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tour_id?: string | null
          updated_at?: string | null
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
        ]
      }
      payments: {
        Row: {
          amount: number
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
          updatedat: string | null
        }
        Insert: {
          amount: number
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
          updatedat?: string | null
        }
        Update: {
          amount?: number
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
          updatedat?: string | null
        }
        Relationships: []
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
      quote_items: {
        Row: {
          category: string
          created_at: string | null
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
        }
        Insert: {
          category: string
          created_at?: string | null
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
        }
        Update: {
          category?: string
          created_at?: string | null
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
          categories: Json | null
          child_count: number | null
          code: string | null
          converted_to_tour: boolean | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          days: number | null
          destination: string | null
          end_date: string | null
          group_size: number | null
          id: string
          infant_count: number | null
          is_active: boolean | null
          is_pinned: boolean | null
          main_city_id: string | null
          name: string | null
          nights: number | null
          notes: string | null
          number_of_people: number | null
          other_city_ids: string[] | null
          participant_counts: Json | null
          selling_prices: Json | null
          start_date: string | null
          status: string | null
          total_amount: number | null
          total_cost: number | null
          tour_id: string | null
          updated_at: string | null
          valid_until: string | null
          version: number | null
          versions: Json | null
        }
        Insert: {
          accommodation_days?: number | null
          adult_count?: number | null
          categories?: Json | null
          child_count?: number | null
          code?: string | null
          converted_to_tour?: boolean | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          days?: number | null
          destination?: string | null
          end_date?: string | null
          group_size?: number | null
          id: string
          infant_count?: number | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          main_city_id?: string | null
          name?: string | null
          nights?: number | null
          notes?: string | null
          number_of_people?: number | null
          other_city_ids?: string[] | null
          participant_counts?: Json | null
          selling_prices?: Json | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          total_cost?: number | null
          tour_id?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
          versions?: Json | null
        }
        Update: {
          accommodation_days?: number | null
          adult_count?: number | null
          categories?: Json | null
          child_count?: number | null
          code?: string | null
          converted_to_tour?: boolean | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          days?: number | null
          destination?: string | null
          end_date?: string | null
          group_size?: number | null
          id?: string
          infant_count?: number | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          main_city_id?: string | null
          name?: string | null
          nights?: number | null
          notes?: string | null
          number_of_people?: number | null
          other_city_ids?: string[] | null
          participant_counts?: Json | null
          selling_prices?: Json | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          total_cost?: number | null
          tour_id?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
          versions?: Json | null
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
        ]
      }
      receipt_orders: {
        Row: {
          amount: number
          code: string
          created_at: string | null
          handled_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string
          receipt_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string | null
          handled_by?: string | null
          id: string
          notes?: string | null
          order_id?: string | null
          payment_method: string
          receipt_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string
          receipt_date?: string
          updated_at?: string | null
        }
        Relationships: [
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
          tour_name?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
        }
        Relationships: []
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
          address: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
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
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
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
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
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
      todos: {
        Row: {
          assignee: string | null
          completed: boolean | null
          created_at: string | null
          creator: string
          deadline: string | null
          enabled_quick_actions: string[] | null
          id: string
          needs_creator_notification: boolean | null
          notes: Json | null
          priority: number
          related_items: Json | null
          status: string
          sub_tasks: Json | null
          title: string
          updated_at: string | null
          visibility: string[] | null
        }
        Insert: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string | null
          creator: string
          deadline?: string | null
          enabled_quick_actions?: string[] | null
          id?: string
          needs_creator_notification?: boolean | null
          notes?: Json | null
          priority?: number
          related_items?: Json | null
          status?: string
          sub_tasks?: Json | null
          title: string
          updated_at?: string | null
          visibility?: string[] | null
        }
        Update: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string | null
          creator?: string
          deadline?: string | null
          enabled_quick_actions?: string[] | null
          id?: string
          needs_creator_notification?: boolean | null
          notes?: Json | null
          priority?: number
          related_items?: Json | null
          status?: string
          sub_tasks?: Json | null
          title?: string
          updated_at?: string | null
          visibility?: string[] | null
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
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_members: {
        Row: {
          created_at: string | null
          customer_id: string
          dietary_requirements: string | null
          id: string
          member_type: string
          room_type: string | null
          roommate_id: string | null
          special_requests: string | null
          tour_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          dietary_requirements?: string | null
          id?: string
          member_type: string
          room_type?: string | null
          roommate_id?: string | null
          special_requests?: string | null
          tour_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          dietary_requirements?: string | null
          id?: string
          member_type?: string
          room_type?: string | null
          roommate_id?: string | null
          special_requests?: string | null
          tour_id?: string
        }
        Relationships: []
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
      tours: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          archived: boolean | null
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
          current_participants: number | null
          departure_date: string
          description: string | null
          envelope_records: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          location: string | null
          main_city_id: string | null
          max_participants: number | null
          name: string
          price: number | null
          profit: number
          quote_cost_structure: Json | null
          quote_id: string | null
          return_date: string
          status: string | null
          total_cost: number
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived?: boolean | null
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
          current_participants?: number | null
          departure_date: string
          description?: string | null
          envelope_records?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          location?: string | null
          main_city_id?: string | null
          max_participants?: number | null
          name: string
          price?: number | null
          profit?: number
          quote_cost_structure?: Json | null
          quote_id?: string | null
          return_date: string
          status?: string | null
          total_cost?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          archived?: boolean | null
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
          current_participants?: number | null
          departure_date?: string
          description?: string | null
          envelope_records?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          main_city_id?: string | null
          max_participants?: number | null
          name?: string
          price?: number | null
          profit?: number
          quote_cost_structure?: Json | null
          quote_id?: string | null
          return_date?: string
          status?: string | null
          total_cost?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_main_city_id_fkey"
            columns: ["main_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
      visas: {
        Row: {
          _needs_sync: boolean | null
          _synced_at: string | null
          applicant_name: string
          code: string
          contact_person: string
          contact_phone: string
          cost: number | null
          country: string
          created_at: string | null
          created_by: string | null
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
          visa_type: string
        }
        Insert: {
          _needs_sync?: boolean | null
          _synced_at?: string | null
          applicant_name: string
          code: string
          contact_person: string
          contact_phone: string
          cost?: number | null
          country: string
          created_at?: string | null
          created_by?: string | null
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
          visa_type: string
        }
        Update: {
          _needs_sync?: boolean | null
          _synced_at?: string | null
          applicant_name?: string
          code?: string
          contact_person?: string
          contact_phone?: string
          cost?: number | null
          country?: string
          created_at?: string | null
          created_by?: string | null
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
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visas_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
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
      workspaces: {
        Row: {
          _deleted: boolean | null
          _needs_sync: boolean | null
          _synced_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _needs_sync?: boolean | null
          _synced_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
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
      [_ in never]: never
    }
    Functions: {
      refresh_all_region_stats: { Args: never; Returns: undefined }
      update_city_stats: { Args: { p_city_id: string }; Returns: undefined }
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
