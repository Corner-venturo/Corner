import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from './types'
import { generateToken, type AuthPayload } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  _hasHydrated: boolean

  // Methods
  setUser: (user: User | null) => void
  logout: () => void
  validateLogin: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>
  refreshUserData: () => Promise<void>
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  checkPermission: (permission: string) => boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

function setSecureCookie(token: string, rememberMe: boolean = false): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60 // 30 days or 8 hours
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure; ' : ''

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else if (typeof window !== 'undefined') {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; ${secure}`
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: true,
      _hasHydrated: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      logout: async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          await supabase.auth.signOut()
          logger.log('✅ Supabase Auth session logged out')
        } catch (error) {
          logger.warn('⚠️ Supabase Auth logout failed:', error)
        }

        if (typeof window !== 'undefined') {
          if (window.location.hostname === 'localhost') {
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax'
          } else {
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict; Secure'
          }
        }

        set({
          user: null,
          isAuthenticated: false,
        })
      },

      validateLogin: async (username: string, password: string) => {
        try {
          logger.log('🌐 Authenticating via Supabase...', username)

          const { supabase } = await import('@/lib/supabase/client')
          const { data: employees, error: queryError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_number', username)
            .single()

          if (queryError || !employees) {
            logger.error('❌ Supabase query failed:', queryError?.message)
            return { success: false, message: '帳號或密碼錯誤' }
          }
          
          const employeeData = employees as any; // Cast to any to handle snake_case
          logger.log('✅ Found employee data:', employeeData.display_name)
          
          if (employeeData.status === 'terminated') {
            logger.error('❌ Account is terminated')
            return { success: false, message: '此帳號已停用' }
          }

          if (!employeeData.password_hash) {
            logger.warn('⚠️ User has not set a password:', username)
            return { success: false, message: '請先設定密碼' }
          }
          
          const bcrypt = (await import('bcryptjs')).default
          const isValidPassword = await bcrypt.compare(password, employeeData.password_hash)

          if (!isValidPassword) {
            logger.error('❌ Invalid password')
            return { success: false, message: '帳號或密碼錯誤' }
          }

          logger.log('✅ Supabase authentication successful')
          
          try {
            const email = `${username}@venturo.com`
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            if (authError) {
              logger.warn('⚠️ Supabase Auth session sign-in failed (but login proceeds):', authError.message)
            } else {
              logger.log('✅ Supabase Auth session created:', authData.user?.id)
            }
          } catch (authError) {
            logger.warn('⚠️ Supabase Auth session creation failed:', authError)
          }

          const user: User = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            english_name: employeeData.english_name,
            display_name: employeeData.display_name,
            chinese_name: employeeData.chinese_name || employeeData.display_name,
            personal_info: employeeData.personal_info || {},
            job_info: employeeData.job_info || {},
            salary_info: employeeData.salary_info || {},
            permissions: employeeData.permissions || [],
            roles: (employeeData.roles || []) as User['roles'],
            attendance: employeeData.attendance || { leave_records: [], overtime_records: [] },
            contracts: employeeData.contracts || [],
            status: employeeData.status as User['status'],
            workspace_id: employeeData.workspace_id,
            created_at: employeeData.created_at || new Date().toISOString(),
            updated_at: employeeData.updated_at || new Date().toISOString(),
          }

          const authPayload: AuthPayload = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            permissions: employeeData.permissions || [],
            role: employeeData.permissions?.includes('admin') ? 'admin' : 'employee',
          }

          const token = generateToken(authPayload)
          setSecureCookie(token, false)

          set({ user, isAuthenticated: true })
          
          logger.log('✅ Login successful:', employeeData.display_name)
          return { success: true }
        } catch (error) {
          logger.error('💥 Login validation error:', error)
          return { success: false, message: '系統錯誤，請稍後再試' }
        }
      },

      checkPermission: (permission: string) => {
        const user = get().user
        if (!user) return false
        return user.permissions.includes(permission) || user.permissions.includes('admin')
      },

      refreshUserData: async () => {
        const currentUser = get().user
        if (!currentUser?.id) return

        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (error || !data) {
            logger.warn('⚠️ Failed to refresh user data:', error?.message)
            return
          }

          const employeeData = data as any

          // 如果帳號已停用，自動登出
          if (employeeData.status === 'terminated') {
            logger.warn('⚠️ Account terminated, logging out')
            get().logout()
            return
          }

          const updatedUser: User = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            english_name: employeeData.english_name,
            display_name: employeeData.display_name,
            chinese_name: employeeData.chinese_name || employeeData.display_name,
            personal_info: employeeData.personal_info || {},
            job_info: employeeData.job_info || {},
            salary_info: employeeData.salary_info || {},
            permissions: employeeData.permissions || [],
            roles: (employeeData.roles || []) as User['roles'],
            attendance: employeeData.attendance || { leave_records: [], overtime_records: [] },
            contracts: employeeData.contracts || [],
            status: employeeData.status as User['status'],
            workspace_id: employeeData.workspace_id,
            created_at: employeeData.created_at || new Date().toISOString(),
            updated_at: employeeData.updated_at || new Date().toISOString(),
          }

          set({ user: updatedUser })
          logger.log('✅ User data refreshed:', updatedUser.display_name)
        } catch (error) {
          logger.error('💥 Error refreshing user data:', error)
        }
      },
      
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: collapsed => set({ sidebarCollapsed: collapsed }),
      setHasHydrated: hasHydrated => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          state._hasHydrated = true
        }
      },
    }
  )
)

if (typeof window !== 'undefined') {
  (useAuthStore as any).persist.rehydrate()
}