import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from './types'
import { generateToken, type AuthPayload } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'
import { getRoleConfig, type UserRole } from '@/lib/rbac-config'
import type { Database } from '@/lib/supabase/types'

/**
 * Supabase Employee Row 類型
 * 直接從 Database 類型推斷，確保與資料庫結構一致
 */
type EmployeeRow = Database['public']['Tables']['employees']['Row']

/**
 * 根據員工的角色，合併角色預設權限和資料庫中的額外權限
 * 這確保了當 rbac-config.ts 更新時，員工會自動獲得新的權限
 */
function mergePermissionsWithRoles(
  dbPermissions: string[],
  roles: UserRole[]
): string[] {
  const allPermissions = new Set<string>(dbPermissions)

  // 合併所有角色的預設權限
  roles.forEach(role => {
    const roleConfig = getRoleConfig(role)
    if (roleConfig) {
      if (roleConfig.permissions.includes('*')) {
        allPermissions.add('*')
      } else {
        roleConfig.permissions.forEach(p => allPermissions.add(p))
      }
    }
  })

  return Array.from(allPermissions)
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean // Added isAdmin flag
  sidebarCollapsed: boolean
  _hasHydrated: boolean

  // Methods
  setUser: (user: User | null) => void
  logout: () => void
  validateLogin: (
    username: string,
    password: string,
    workspaceId?: string,
    rememberMe?: boolean
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
      isAdmin: false, // Initial state
      sidebarCollapsed: true,
      _hasHydrated: false,
      
      setUser: (user) => {
        const isAuthenticated = !!user;
        const isAdmin = isAuthenticated && (user.permissions.includes('admin') || user.permissions.includes('*'));
        set({ user, isAuthenticated, isAdmin });
      },

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
          isAdmin: false,
        })
      },

      validateLogin: async (username: string, password: string, workspaceId?: string, rememberMe: boolean = true) => {
        try {
          logger.log('🌐 Authenticating via Supabase...', username, 'workspace:', workspaceId)

          const { supabase } = await import('@/lib/supabase/client')

          // 建立查詢，加上 workspace_id 條件（如果有提供）
          let query = supabase
            .from('employees')
            .select('*')
            .eq('employee_number', username)

          if (workspaceId) {
            query = query.eq('workspace_id', workspaceId)
          }

          const { data: employees, error: queryError } = await query.single()

          if (queryError || !employees) {
            logger.error('❌ Supabase query failed:', queryError?.message)
            return { success: false, message: '帳號或密碼錯誤' }
          }
          
          const employeeData = employees as EmployeeRow
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

          // Supabase Auth 登入（必須成功才能繼續）
          const email = `${username}@venturo.com`
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) {
            logger.error('❌ Supabase Auth session sign-in failed:', authError.message)
            // 密碼不同步，需要重設
            return {
              success: false,
              message: '密碼需要重設，請聯繫管理員或使用「忘記密碼」功能'
            }
          }

          logger.log('✅ Supabase Auth session created:', authData.user?.id)

          // 同步 workspace_id 和 employee_id 到 user_metadata
          // 這樣 Server Actions 可以直接從 user_metadata 讀取，不用每次查 DB
          if (employeeData.workspace_id) {
            try {
              await supabase.auth.updateUser({
                data: {
                  workspace_id: employeeData.workspace_id,
                  employee_id: employeeData.id
                }
              })
              logger.log('✅ Synced workspace_id to user_metadata')
            } catch (metadataError) {
              // 非關鍵錯誤，只記錄警告
              logger.warn('⚠️ Failed to sync user_metadata:', metadataError)
            }
          }

          // 查詢 workspace code（如果有 workspace_id）
          let workspaceCode: string | undefined = undefined
          if (employeeData.workspace_id) {
            try {
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('code, name')
                .eq('id', employeeData.workspace_id)
                .single()

              if (workspace) {
                workspaceCode = workspace.code || workspace.name?.substring(0, 2).toUpperCase()
                logger.log('✅ Workspace code fetched:', workspaceCode)
              }
            } catch (wsError) {
              logger.warn('⚠️ Failed to fetch workspace code:', wsError)
            }
          }

          // 合併角色預設權限和資料庫權限
          const userRoles = (employeeData.roles || []) as UserRole[]
          const mergedPermissions = mergePermissionsWithRoles(
            employeeData.permissions || [],
            userRoles
          )

          const user: User = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            english_name: employeeData.english_name ?? '',
            display_name: employeeData.display_name ?? '',
            chinese_name: employeeData.chinese_name ?? employeeData.display_name ?? '',
            personal_info: (employeeData.personal_info ?? {}) as User['personal_info'],
            job_info: (employeeData.job_info ?? {}) as User['job_info'],
            salary_info: (employeeData.salary_info ?? {}) as User['salary_info'],
            permissions: mergedPermissions, // 使用合併後的權限
            roles: userRoles as User['roles'],
            attendance: (employeeData.attendance ?? { leave_records: [], overtime_records: [] }) as User['attendance'],
            contracts: (employeeData.contracts ?? []) as User['contracts'],
            status: employeeData.status as User['status'],
            workspace_id: employeeData.workspace_id ?? undefined,
            workspace_code: workspaceCode, // 登入時取得的 workspace code
            created_at: employeeData.created_at ?? new Date().toISOString(),
            updated_at: employeeData.updated_at ?? new Date().toISOString(),
          }

          const authPayload: AuthPayload = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            permissions: mergedPermissions, // 使用合併後的權限
            role: mergedPermissions.includes('admin') || mergedPermissions.includes('*') ? 'admin' : 'employee',
          }

          const token = generateToken(authPayload)
          setSecureCookie(token, rememberMe)

          get().setUser(user);
          
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
        // Updated to use the new isAdmin flag for simplicity
        return get().isAdmin || user.permissions.includes(permission)
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

          const employeeData = data as EmployeeRow

          // 如果帳號已停用，自動登出
          if (employeeData.status === 'terminated') {
            logger.warn('⚠️ Account terminated, logging out')
            get().logout()
            return
          }

          // 查詢 workspace code（如果有 workspace_id）
          let workspaceCode = currentUser.workspace_code // 保留原有的 code
          if (employeeData.workspace_id) {
            try {
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('code, name')
                .eq('id', employeeData.workspace_id)
                .single()

              if (workspace) {
                workspaceCode = workspace.code || workspace.name?.substring(0, 2).toUpperCase()
              }
            } catch (wsError) {
              logger.warn('⚠️ Failed to fetch workspace code:', wsError)
            }
          }

          // 合併角色預設權限和資料庫權限
          const userRoles = (employeeData.roles || []) as UserRole[]
          const mergedPermissions = mergePermissionsWithRoles(
            employeeData.permissions || [],
            userRoles
          )

          const updatedUser: User = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            english_name: employeeData.english_name ?? '',
            display_name: employeeData.display_name ?? '',
            chinese_name: employeeData.chinese_name ?? employeeData.display_name ?? '',
            personal_info: (employeeData.personal_info ?? {}) as User['personal_info'],
            job_info: (employeeData.job_info ?? {}) as User['job_info'],
            salary_info: (employeeData.salary_info ?? {}) as User['salary_info'],
            permissions: mergedPermissions, // 使用合併後的權限
            roles: userRoles as User['roles'],
            attendance: (employeeData.attendance ?? { leave_records: [], overtime_records: [] }) as User['attendance'],
            contracts: (employeeData.contracts ?? []) as User['contracts'],
            status: employeeData.status as User['status'],
            workspace_id: employeeData.workspace_id ?? undefined,
            workspace_code: workspaceCode, // 保留或更新 workspace code
            created_at: employeeData.created_at ?? new Date().toISOString(),
            updated_at: employeeData.updated_at ?? new Date().toISOString(),
          }

          get().setUser(updatedUser);
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
        isAdmin: state.isAdmin, // Persist isAdmin
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
