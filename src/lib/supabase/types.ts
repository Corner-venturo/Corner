/**
 * Supabase Database Types
 * 根據 IndexedDB schemas 自動生成
 * 最後更新：2025-01-15
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ==================== 核心業務表 ====================

      employees: {
        Row: {
          id: string
          employee_number: string
          english_name: string
          display_name: string
          email: string
          password_hash: string
          personal_info: Json
          job_info: Json
          salary_info: Json
          permissions: string[]
          attendance: Json
          contracts: Json[]
          status: 'active' | 'probation' | 'leave' | 'terminated'
          avatar: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }

      tours: {
        Row: {
          id: string
          code: string
          name: string
          departure_date: string
          return_date: string
          status: string
          location: string
          price: number
          max_participants: number
          current_participants: number
          contract_status: string
          total_revenue: number
          total_cost: number
          profit: number
          quote_id: string | null
          quote_cost_structure: Json | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tours']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tours']['Insert']>
      }

      orders: {
        Row: {
          id: string
          code: string
          order_number: string
          tour_id: string
          tour_name: string
          customer_id: string | null
          contact_person: string
          sales_person: string | null
          assistant: string | null
          member_count: number
          payment_status: string
          status: string
          total_amount: number
          paid_amount: number
          remaining_amount: number
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }

      members: {
        Row: {
          id: string
          order_id: string
          tour_id: string
          name: string
          name_en: string | null
          gender: string | null
          birthday: string | null
          id_number: string | null
          passport_number: string | null
          passport_expiry: string | null
          phone: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          dietary_restrictions: string | null
          medical_conditions: string | null
          room_preference: string | null
          assigned_room: string | null
          reservation_code: string | null
          is_child_no_bed: boolean
          add_ons: string[] | null
          refunds: string[] | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['members']['Insert']>
      }

      customers: {
        Row: {
          id: string
          code: string
          name: string
          phone: string
          email: string | null
          address: string | null
          notes: string | null
          is_vip: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }

      // ==================== 財務相關表 ====================

      payments: {
        Row: {
          id: string
          code: string
          order_id: string
          customer_id: string | null
          amount: number
          payment_method: string
          payment_date: string
          status: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }

      payment_requests: {
        Row: {
          id: string
          code: string
          tour_id: string | null
          supplier_id: string | null
          requester_id: string
          amount: number
          status: string
          request_date: string
          payment_date: string | null
          items: Json
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payment_requests']['Insert']>
      }

      disbursement_orders: {
        Row: {
          id: string
          code: string
          tour_id: string | null
          payment_request_id: string | null
          amount: number
          payment_method: string
          payment_date: string
          status: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['disbursement_orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['disbursement_orders']['Insert']>
      }

      receipt_orders: {
        Row: {
          id: string
          code: string
          order_id: string
          customer_id: string | null
          amount: number
          receipt_date: string
          payment_method: string
          status: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipt_orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['receipt_orders']['Insert']>
      }

      // ==================== 報價相關表 ====================

      quotes: {
        Row: {
          id: string
          code: string
          customer_id: string | null
          customer_name: string | null
          name: string | null
          destination: string | null
          start_date: string | null
          end_date: string | null
          days: number
          nights: number
          number_of_people: number
          group_size: number
          accommodation_days: number | null
          status: string
          total_amount: number
          version: number
          valid_until: string | null
          notes: string | null
          created_by: string | null
          created_by_name: string | null
          converted_to_tour: boolean
          tour_id: string | null
          categories: Json
          versions: Json[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }

      quote_items: {
        Row: {
          id: string
          quote_id: string
          category_id: string | null
          category_name: string | null
          type: string
          name: string
          description: string | null
          quantity: number
          unit_price: number
          total_price: number
          order_index: number
          notes: string | null
          is_optional: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quote_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quote_items']['Insert']>
      }

      // ==================== 系統管理表 ====================

      todos: {
        Row: {
          id: string
          title: string
          priority: number
          deadline: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          creator: string
          assignee: string | null
          visibility: string[]
          related_items: Json[]
          sub_tasks: Json[]
          notes: Json[]
          enabled_quick_actions: string[]
          needs_creator_notification: boolean
          type: string | null
          parent_id: string | null
          project_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['todos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['todos']['Insert']>
      }

      visas: {
        Row: {
          id: string
          code: string
          tour_id: string | null
          customer_id: string | null
          member_id: string | null
          country: string
          visa_type: string
          application_date: string
          appointment_date: string | null
          expected_date: string | null
          received_date: string | null
          status: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['visas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['visas']['Insert']>
      }

      suppliers: {
        Row: {
          id: string
          code: string
          name: string
          type: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          bank_account: string | null
          tax_id: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
      }

      // ==================== 行事曆表 ====================

      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          event_type: string
          start_date: string
          end_date: string
          visibility: string
          related_id: string | null
          related_type: string | null
          color: string | null
          is_all_day: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>
      }

      // ==================== 記帳系統表 ====================

      accounts: {
        Row: {
          id: string
          name: string
          type: string
          balance: number
          currency: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }

      categories: {
        Row: {
          id: string
          name: string
          type: string
          parent_id: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }

      transactions: {
        Row: {
          id: string
          date: string
          type: string
          account_id: string
          category_id: string
          amount: number
          description: string | null
          tags: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }

      budgets: {
        Row: {
          id: string
          category_id: string
          period: string
          amount: number
          spent: number
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }

      // ==================== 工作空間表 ====================

      workspace_items: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: Json
          position: number
          size: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspace_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspace_items']['Insert']>
      }

      // ==================== 時間箱表 ====================

      timebox_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          title: string
          start_time: string
          end_time: string
          duration: number
          status: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['timebox_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['timebox_sessions']['Insert']>
      }

      // ==================== 模板表 ====================

      templates: {
        Row: {
          id: string
          name: string
          type: string
          category: string
          content: Json
          preview: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['templates']['Insert']>
      }

      // ==================== 同步佇列表 ====================

      syncQueue: {
        Row: {
          id: string
          table_name: string
          operation: 'create' | 'update' | 'delete'
          data: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          retry_count: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['syncQueue']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['syncQueue']['Insert']>
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
