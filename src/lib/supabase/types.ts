export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          employee_number: string
          english_name: string
          chinese_name: string
          personal_info: {
            national_id: string
            birthday: string
            gender: 'male' | 'female'
            phone: string
            email: string
            address: string
            emergency_contact: {
              name: string
              relationship: string
              phone: string
            }
          }
          job_info: {
            department: string
            position: string
            supervisor?: string
            hire_date: string
            probation_end_date?: string
            employment_type: 'fulltime' | 'parttime' | 'contract'
          }
          salary_info: {
            base_salary: number
            allowances: {
              type: string
              amount: number
            }[]
            salary_history: {
              effective_date: string
              base_salary: number
              reason: string
            }[]
          }
          permissions: string[]
          attendance: {
            leave_records: {
              id: string
              type: 'annual' | 'sick' | 'personal' | 'maternity' | 'other'
              start_date: string
              end_date: string
              days: number
              reason?: string
              status: 'pending' | 'approved' | 'rejected'
              approved_by?: string
            }[]
            overtime_records: {
              id: string
              date: string
              hours: number
              reason: string
              approved_by?: string
            }[]
          }
          contracts: {
            id: string
            type: 'employment' | 'probation' | 'renewal'
            start_date: string
            end_date?: string
            file_path?: string
            notes?: string
          }[]
          status: 'active' | 'probation' | 'leave' | 'terminated'
          avatar?: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      todos: {
        Row: {
          id: string
          title: string
          priority: number
          deadline?: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          creator: string
          assignee?: string
          visibility: string[]
          related_items: {
            type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt'
            id: string
            title: string
          }[]
          sub_tasks: {
            id: string
            title: string
            done: boolean
            completed_at?: string
          }[]
          notes: {
            timestamp: string
            content: string
          }[]
          enabled_quick_actions: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['todos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['todos']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          employee_id?: string
          username?: string
          display_name?: string
          role: 'admin' | 'employee' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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