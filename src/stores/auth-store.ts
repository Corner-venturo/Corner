import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from './types'
import { generateToken, type AuthPayload } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'
import { getRoleConfig, type UserRole } from '@/lib/rbac-config'
import type { Database } from '@/lib/supabase/types'
import { ensureAuthSync, resetAuthSyncState } from '@/lib/auth/auth-sync'

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
  ) => Promise<{ success: boolean; message?: string; needsSetup?: boolean }>
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

        // 重置 Auth 同步狀態
        resetAuthSyncState()

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

      validateLogin: async (username: string, password: string, code?: string, rememberMe: boolean = true) => {
        try {
          logger.log('🌐 Authenticating via API...', username, 'code:', code)

          if (!code) {
            return { success: false, message: '請輸入辦公室或廠商代號' }
          }

          // 使用 API route 驗證登入（繞過 RLS）
          const response = await fetch('/api/auth/validate-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, code }),
          })

          const result = await response.json()

          if (!result.success) {
            logger.warn('⚠️ Login validation failed:', result.message)
            return { success: false, message: result.message }
          }

          const employeeData = result.employee as EmployeeRow
          logger.log('✅ Employee validated:', employeeData.display_name)

          const { supabase } = await import('@/lib/supabase/client')

          logger.log('✅ Employee authentication successful')

          // Supabase Auth 登入（必須成功才能繼續）
          // 新格式：{workspace_code}_{employee_number}@venturo.com（區分不同公司的同編號員工）
          // 舊格式：{employee_number}@venturo.com（向後兼容現有用戶）
          // 統一使用小寫格式（與 create-employee-auth API 一致）
          const newFormatEmail = code
            ? `${code.toLowerCase()}_${username.toLowerCase()}@venturo.com`
            : `${username.toLowerCase()}@venturo.com`
          const oldFormatEmail = `${username.toLowerCase()}@venturo.com`

          // 先嘗試新格式
          let authData = null
          let authError = null

          const newResult = await supabase.auth.signInWithPassword({
            email: newFormatEmail,
            password,
          })

          if (newResult.error) {
            // 新格式失敗，嘗試舊格式（向後兼容）
            if (code && newFormatEmail !== oldFormatEmail) {
              logger.log('⚠️ 新格式登入失敗，嘗試舊格式:', oldFormatEmail)
              const oldResult = await supabase.auth.signInWithPassword({
                email: oldFormatEmail,
                password,
              })
              authData = oldResult.data
              authError = oldResult.error
            } else {
              authError = newResult.error
            }
          } else {
            authData = newResult.data
          }

          if (authError || !authData) {
            logger.error('❌ Supabase Auth session sign-in failed:', authError?.message)
            // 顯示更明確的錯誤訊息
            return {
              success: false,
              message: '登入驗證失敗，請稍後再試或聯繫管理員'
            }
          }

          logger.log('✅ Supabase Auth session created:', authData.user?.id)

          // 使用抽象層確保 Auth 同步（處理 RLS 所需的 supabase_user_id）
          // 登入時直接傳入員工資訊，因為 localStorage 還沒寫入
          await ensureAuthSync({
            employeeId: employeeData.id,
            workspaceId: employeeData.workspace_id ?? undefined,
          })

          // 查詢 workspace 資訊（如果有 workspace_id）
          let workspaceCode: string | undefined = undefined
          let workspaceName: string | undefined = undefined
          let workspaceType: User['workspace_type'] = undefined
          if (employeeData.workspace_id) {
            try {
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('code, name, type')
                .eq('id', employeeData.workspace_id)
                .single()

              if (workspace) {
                workspaceCode = workspace.code || workspace.name?.substring(0, 2).toUpperCase()
                workspaceName = workspace.name || undefined
                workspaceType = (workspace.type as User['workspace_type']) || undefined
                logger.log('✅ Workspace info fetched:', { workspaceCode, workspaceName, workspaceType })
              }
            } catch (wsError) {
              logger.warn('⚠️ Failed to fetch workspace info:', wsError)
            }
          }

          // 合併角色預設權限和資料庫權限
          const userRoles = (employeeData.roles || []) as UserRole[]
          const mergedPermissions = mergePermissionsWithRoles(
            employeeData.permissions || [],
            userRoles
          )

          // 檢查是否需要首次設定（預設密碼 00000000 或 must_change_password 標記）
          const mustChangePassword = (employeeData as Record<string, unknown>).must_change_password === true
          const hasAvatar = !!(employeeData.avatar_url || employeeData.avatar)
          const needsSetup = mustChangePassword || !hasAvatar

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
            workspace_name: workspaceName, // 登入時取得的 workspace 名稱
            workspace_type: workspaceType, // 登入時取得的 workspace 類型
            avatar: employeeData.avatar_url ?? employeeData.avatar ?? undefined,
            must_change_password: mustChangePassword,
            created_at: employeeData.created_at ?? new Date().toISOString(),
            updated_at: employeeData.updated_at ?? new Date().toISOString(),
          }

          const authPayload: AuthPayload = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            permissions: mergedPermissions, // 使用合併後的權限
            role: mergedPermissions.includes('admin') || mergedPermissions.includes('*') ? 'admin' : 'employee',
          }

          const token = generateToken(authPayload, rememberMe)
          setSecureCookie(token, rememberMe)

          get().setUser(user);

          logger.log('✅ Login successful:', employeeData.display_name)

          // 如果需要首次設定，返回 needsSetup 標記讓前端處理導向
          if (needsSetup) {
            logger.log('⚠️ User needs initial setup (password change or avatar)')
            return { success: true, needsSetup: true }
          }

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

          // 使用 maybeSingle() 而不是 single()，避免 RLS 返回 0 筆時拋錯
          // 這可能發生在 supabase_user_id 還沒同步時
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()

          if (error) {
            // RLS 查詢失敗，可能是 supabase_user_id 未同步
            // 靜默失敗，使用 localStorage 中的快取資料
            logger.warn('⚠️ Failed to refresh user data (RLS issue?):', error?.message)
            return
          }

          if (!data) {
            // 沒有返回資料，可能是 RLS 阻擋
            logger.warn('⚠️ No user data returned (RLS may be blocking), using cached data')
            return
          }

          const employeeData = data as EmployeeRow

          // 如果帳號已停用，自動登出
          if (employeeData.status === 'terminated') {
            logger.warn('⚠️ Account terminated, logging out')
            get().logout()
            return
          }

          // 查詢 workspace 資訊（如果有 workspace_id）
          let workspaceCode = currentUser.workspace_code // 保留原有的值
          let workspaceName = currentUser.workspace_name
          let workspaceType = currentUser.workspace_type
          if (employeeData.workspace_id) {
            try {
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('code, name, type')
                .eq('id', employeeData.workspace_id)
                .single()

              if (workspace) {
                workspaceCode = workspace.code || workspace.name?.substring(0, 2).toUpperCase()
                workspaceName = workspace.name || undefined
                workspaceType = (workspace.type as User['workspace_type']) || undefined
              }
            } catch (wsError) {
              logger.warn('⚠️ Failed to fetch workspace info:', wsError)
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
            workspace_name: workspaceName, // 保留或更新 workspace 名稱
            workspace_type: workspaceType, // 保留或更新 workspace 類型
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
          // Session 恢復時，確保 Auth 同步
          if (state.isAuthenticated && state.user) {
            ensureAuthSync().catch(err => {
              logger.warn('⚠️ Auth sync on rehydrate failed:', err)
            })
          }
        }
      },
    }
  )
)

if (typeof window !== 'undefined') {
  // Zustand persist 的 rehydrate 方法類型定義缺失，使用 type assertion
  type StoreWithPersist = typeof useAuthStore & {
    persist: { rehydrate: () => void }
  }
  ;(useAuthStore as StoreWithPersist).persist.rehydrate()
}
