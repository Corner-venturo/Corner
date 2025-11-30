import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from './types'
import { useUserStore } from './user-store'
import { generateToken, type AuthPayload } from '@/lib/auth'
import { useLocalAuthStore, LocalProfile } from '@/lib/auth/local-auth-manager'
import { OfflineAuthService } from '@/services/offline-auth.service'
import { logger } from '@/lib/utils/logger'
import { generateQuickLoginToken } from '@/lib/auth/quick-login-token'

interface AuthState {
  // 保持向下相容的屬性
  user: User | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  loginAttempts: Map<string, { count: number; lastAttempt: Date }>

  // 新增屬性
  currentProfile: LocalProfile | null
  isOfflineMode: boolean
  _hasHydrated: boolean

  // 方法
  login: (user: User) => void
  logout: () => void
  validateLogin: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  checkPermission: (permission: string) => boolean
  switchProfile: (profileId: string) => Promise<boolean>
  setHasHydrated: (hasHydrated: boolean) => void
}

// 防暴力破解的失敗記錄
const loginAttemptsMap = new Map<string, { count: number; lastAttempt: Date }>()

function checkLoginAttempts(username: string): { allowed: boolean; message?: string } {
  const attempts = loginAttemptsMap.get(username)

  if (!attempts) {
    loginAttemptsMap.set(username, { count: 1, lastAttempt: new Date() })
    return { allowed: true }
  }

  // 15 分鐘後重置
  const timeDiff = Date.now() - attempts.lastAttempt.getTime()
  if (timeDiff > 15 * 60 * 1000) {
    loginAttemptsMap.set(username, { count: 1, lastAttempt: new Date() })
    return { allowed: true }
  }

  // 超過 5 次嘗試
  if (attempts.count >= 5) {
    const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / (60 * 1000))
    return {
      allowed: false,
      message: `登入失敗次數過多，請 ${remainingTime} 分鐘後再試`,
    }
  }

  attempts.count++
  attempts.lastAttempt = new Date()
  return { allowed: true }
}

function recordLoginAttempt(username: string, success: boolean): void {
  if (success) {
    // 登入成功，清除失敗記錄
    loginAttemptsMap.delete(username)
  }
  // 失敗記錄已在 checkLoginAttempts 中處理
}

function setSecureCookie(token: string, rememberMe: boolean = false): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60 // 30天 or 8小時
  const secure = window.location.protocol === 'https:' ? 'Secure; ' : ''

  // 在 localhost 開發環境中，不使用 Secure 和 SameSite=Strict
  if (window.location.hostname === 'localhost') {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; ${secure}`
  }
}

export const useAuthStore = create<AuthState>(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: true, // 預設收合，hover 時展開
      loginAttempts: new Map(),
      currentProfile: null,
      isOfflineMode: false,
      _hasHydrated: false,

      login: async user => {
        // ✅ employees 表有 workspace_id 欄位，登入時會自動載入
        const finalUser = user

        // 同時更新 user 和 currentProfile
        const profile = useLocalAuthStore.getState().currentProfile
        set({
          user: finalUser,
          isAuthenticated: true,
          currentProfile: profile,
        })
      },

      logout: async () => {
        // 🔐 登出 Supabase Auth session
        try {
          const { supabase } = await import('@/lib/supabase/client')
          await supabase.auth.signOut()
          logger.log('✅ Supabase Auth session 已登出')
        } catch (error) {
          logger.warn('⚠️ Supabase Auth 登出失敗:', error)
        }

        // 使用離線認證服務登出
        OfflineAuthService.logout()

        // 安全清除認證 cookie
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
          currentProfile: null,
        })
      },

      validateLogin: async (username: string, password: string) => {
        try {
          // 檢查登入次數限制
          const attemptCheck = checkLoginAttempts(username)
          if (!attemptCheck.allowed) {
            return { success: false, message: attemptCheck.message }
          }

          const localAuthStore = useLocalAuthStore.getState()
          const existingProfile = localAuthStore.profiles.find(p => p.employee_number === username)

          // 🌐 優先檢查網路狀態
          const isOnline = navigator.onLine

          // 🌐 有網路 → 優先從 Supabase 驗證（確保密碼、權限、狀態都是最新的）
          if (isOnline) {
            logger.log('🌐 有網路連線，從 Supabase 驗證...', username)

            // 直接跳到 Supabase 驗證（跳過角色卡登入）
            // （下面的 Supabase 驗證邏輯會在驗證成功後更新角色卡）
          }
          // 📴 無網路 + 有角色卡 → 離線快速登入（使用 IndexedDB）
          else if (!isOnline && existingProfile) {
            logger.log('📴 離線模式 + 找到角色卡，使用離線登入:', username)

            try {
              // 從 IndexedDB 讀取員工資料
              const { localDB } = await import('@/lib/db')
              const { TABLES } = await import('@/lib/db/schemas')

              const employee = (await localDB.read(TABLES.EMPLOYEES, existingProfile.id)) as User | undefined

              if (!employee) {
                logger.error('❌ IndexedDB 找不到員工資料')
                localAuthStore.removeProfile(existingProfile.id)
                return { success: false, message: '本地資料已損壞，請連線網路後重新登入' }
              }

              // 🔍 檢查資料格式（統一使用 snake_case）
              if (!employee.password_hash || !employee.employee_number || !employee.display_name) {
                logger.error('❌ IndexedDB 資料格式錯誤（應為 snake_case）')
                logger.error('   請訪問 /check-db.html 清空資料庫')
                localAuthStore.removeProfile(existingProfile.id)
                return {
                  success: false,
                  message:
                    '本地資料格式錯誤，請連線網路後重新登入\n（或訪問 /check-db.html 清空資料庫）',
                }
              }

              // 檢查員工狀態
              if (employee.status === 'terminated') {
                logger.error('❌ 帳號已停用')
                return { success: false, message: '此帳號已停用' }
              }

              // 驗證密碼（使用 bcrypt）
              const bcrypt = (await import('bcryptjs')).default
              const isValidPassword = await bcrypt.compare(password, employee.password_hash)

              if (!isValidPassword) {
                logger.error('❌ 密碼錯誤')
                recordLoginAttempt(username, false)
                return { success: false, message: '帳號或密碼錯誤' }
              }

              // ✅ 離線登入成功
              logger.log('✅ 📴 離線登入成功')
              recordLoginAttempt(username, true)

              const user: User = {
                id: employee.id,
                employee_number: employee.employee_number,
                english_name: employee.english_name,
                display_name: employee.display_name,
                chinese_name: employee.chinese_name || employee.display_name,
                personal_info: employee.personal_info || {},
                job_info: employee.job_info || {},
                salary_info: employee.salary_info || {},
                permissions: employee.permissions || [],
                roles: employee.roles || [],
                attendance: employee.attendance || { leave_records: [], overtime_records: [] },
                contracts: employee.contracts || [],
                status: employee.status,
                workspace_id: employee.workspace_id, // ✅ 從資料庫讀取 workspace_id
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }

              set({
                user,
                isAuthenticated: true,
                currentProfile: existingProfile,
                isOfflineMode: true,
              })
              return { success: true }
            } catch (error) {
              logger.error('❌ 離線登入失敗:', error)
              // 刪除損壞的角色卡
              localAuthStore.removeProfile(existingProfile.id)
              return { success: false, message: '離線登入失敗，請連線網路後重新登入' }
            }
          }
          // 📴 無網路 + 無角色卡 → 無法登入
          else if (!isOnline && !existingProfile) {
            logger.error('❌ 離線狀態且無角色卡')
            return { success: false, message: '離線狀態下無法登入，請連接網路' }
          }

          // 🌐 沒有角色卡 → 從 Supabase 驗證（第一次登入）
          logger.log('🌐 第一次登入，查詢 Supabase...')

          // 檢查環境變數
          logger.log('🔧 環境變數檢查:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          })

          // 從 Supabase 查詢員工資料
          const { supabase } = await import('@/lib/supabase/client')
          logger.log('📡 Supabase client 載入成功')

          const { data: employees, error: queryError } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_number', username)
            .single()

          logger.log('📊 查詢結果:', {
            hasData: !!employees,
            hasError: !!queryError,
            errorMessage: queryError?.message,
          })

          if (queryError || !employees) {
            logger.error('❌ Supabase 查詢失敗:', queryError?.message)
            logger.error('   完整錯誤:', queryError)
            recordLoginAttempt(username, false)
            return { success: false, message: '帳號或密碼錯誤' }
          }

          interface EmployeeData {
            id: string
            employee_number: string
            display_name: string
            english_name: string
            chinese_name: string
            password_hash: string
            must_change_password: boolean
            last_password_change?: string
            personal_info?: Record<string, unknown>
            job_info?: Record<string, unknown>
            salary_info?: Record<string, unknown>
            permissions?: string[]
            roles?: string[]
            attendance?: Record<string, unknown>
            contracts?: unknown[]
            status: string
            workspace_id: string
            created_at?: string
            updated_at?: string
          }

          const employeeData = employees as EmployeeData
          logger.log('✅ 找到員工資料:', employeeData.display_name)

          // 將 snake_case 轉換為 camelCase（前端統一格式）
          const employee = {
            id: employeeData.id,
            employee_number: employeeData.employee_number,
            display_name: employeeData.display_name,
            english_name: employeeData.english_name,
            chinese_name: employeeData.chinese_name,
            password_hash: employeeData.password_hash,
            must_change_password: employeeData.must_change_password,
            last_password_change: employeeData.last_password_change,
            personal_info: employeeData.personal_info || {},
            job_info: employeeData.job_info || {},
            salary_info: employeeData.salary_info || {},
            permissions: employeeData.permissions || [],
            roles: employeeData.roles || [], // 附加身份標籤
            attendance: employeeData.attendance || { leave_records: [], overtime_records: [] },
            contracts: employeeData.contracts || [],
            status: employeeData.status,
            workspace_id: employeeData.workspace_id, // ✅ 從資料庫讀取 workspace_id
            created_at: employeeData.created_at,
            updated_at: employeeData.updated_at,
          }

          // 檢查員工狀態
          logger.log('🔍 檢查員工狀態:', employee.status)
          if (employee.status === 'terminated') {
            logger.error('❌ 帳號已停用')
            return { success: false, message: '此帳號已停用' }
          }

          // 驗證密碼
          logger.log('🔐 檢查密碼 hash:', {
            hasPasswordHash: !!employee.password_hash,
            hashLength: employee.password_hash?.length,
          })

          if (!employee.password_hash) {
            logger.warn('⚠️ 員工尚未設定密碼:', username)
            return { success: false, message: '請先設定密碼' }
          }

          // 使用 bcrypt 驗證密碼
          logger.log('🔑 開始驗證密碼...')
          const bcrypt = (await import('bcryptjs')).default
          const isValidPassword = await bcrypt.compare(password, employee.password_hash)

          logger.log('🔑 密碼驗證結果:', isValidPassword)

          if (!isValidPassword) {
            logger.error('❌ 密碼錯誤')
            recordLoginAttempt(username, false)
            return { success: false, message: '帳號或密碼錯誤' }
          }

          // ✅ Supabase 驗證成功！
          logger.log('✅ Supabase 驗證成功，建立角色卡...')
          recordLoginAttempt(username, true)

          // 🔐 建立 Supabase Auth session（用於 Realtime 和認證）
          try {
            const email = `${username}@venturo.com` // 使用員工編號作為 email
            logger.log('🔐 嘗試建立 Supabase Auth session...', email)

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (authError) {
              logger.warn('⚠️ Supabase Auth 登入失敗（不影響系統登入）:', authError.message)

              // 🔧 如果是密碼錯誤，嘗試同步密碼（透過 API Route）
              if (authError.message.includes('Invalid login credentials')) {
                logger.log('🔧 嘗試同步 auth.users 密碼...')
                try {
                  // 呼叫 API Route 同步密碼
                  const syncResponse = await fetch('/api/auth/sync-password', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: employee.id,
                      password: password,
                    }),
                  })

                  if (syncResponse.ok) {
                    logger.log('✅ auth.users 密碼已同步，重新嘗試登入...')

                    // 重新嘗試登入
                    const { data: retryAuthData, error: retryAuthError } =
                      await supabase.auth.signInWithPassword({
                        email,
                        password,
                      })

                    if (retryAuthError) {
                      logger.warn('⚠️ 重新登入仍然失敗:', retryAuthError.message)
                    } else {
                      logger.log('✅ Supabase Auth session 已建立:', retryAuthData.user?.id)
                    }
                  } else {
                    const errorText = await syncResponse.text()
                    logger.warn('⚠️ 同步密碼失敗:', errorText)
                  }
                } catch (syncError) {
                  logger.warn('⚠️ 密碼同步錯誤:', syncError)
                }
              }
            } else {
              logger.log('✅ Supabase Auth session 已建立:', authData.user?.id)
            }
          } catch (authError) {
            logger.warn('⚠️ Supabase Auth 登入失敗（不影響系統登入）:', authError)
          }

          // 建立用戶對象（向下相容）
          const user: User = {
            id: employee.id,
            employee_number: employee.employee_number,
            english_name: employee.english_name,
            display_name: employee.display_name,
            chinese_name: employee.chinese_name || employee.display_name,
            personal_info: employee.personal_info,
            job_info: employee.job_info,
            salary_info: employee.salary_info,
            permissions: employee.permissions,
            roles: employee.roles || [], // 附加身份標籤
            attendance: employee.attendance,
            contracts: employee.contracts,
            status: employee.status,
            workspace_id: employee.workspace_id, // ✅ 從資料庫讀取 workspace_id
            created_at: employee.created_at || new Date().toISOString(),
            updated_at: employee.updated_at || new Date().toISOString(),
          }

          // 🎴 建立角色卡（Profile Card）- 用於離線快速登入
          const personalInfo = employee.personal_info as { email?: string; phone?: string | string[] } | null
          const profile: LocalProfile = {
            id: employee.id,
            email: personalInfo?.email || `${username}@venturo.local`,
            employee_number: employee.employee_number,
            display_name: employee.display_name,
            english_name: employee.english_name,
            role: employee.permissions?.includes('admin') ? 'ADMIN' : 'EMPLOYEE',
            permissions: employee.permissions || [],
            roles: employee.roles || [], // 附加身份標籤（支援多重角色）
            personal_info: employee.personal_info,
            job_info: employee.job_info,
            salary_info: employee.salary_info,
            contracts: employee.contracts,
            attendance: employee.attendance,
            lastLoginAt: new Date().toISOString(),
            created_at: employee.created_at || new Date().toISOString(),
            status: employee.status === 'active' ? 'active' : 'inactive',
          }

          // 💾 儲存角色卡到 local-auth-manager（下次可離線登入）
          // 先移除舊的，再新增（確保完全更新）
          const oldProfile = localAuthStore.profiles.find(p => p.id === employee.id)
          if (oldProfile) {
            logger.log('🔄 發現舊角色卡，移除後重新建立...')
            localAuthStore.removeProfile(employee.id)
          }

          localAuthStore.addProfile(profile)
          localAuthStore.setCurrentProfile(profile)
          logger.log('🎴 角色卡已建立/更新，下次可離線登入')

          // 💾 同步更新 IndexedDB 的 employees 資料（確保離線資料最新）
          try {
            const { localDB } = await import('@/lib/db')
            const { TABLES } = await import('@/lib/db/schemas')

            await localDB.put(TABLES.EMPLOYEES, employee)
            logger.log('✅ IndexedDB employees 資料已同步')
          } catch (dbError) {
            logger.warn('⚠️ IndexedDB 同步失敗（不影響登入）:', dbError)
          }

          // 生成 JWT token
          const authPayload: AuthPayload = {
            id: employee.id,
            employee_number: employee.employee_number,
            permissions: employee.permissions || [],
            role: employee.permissions?.includes('admin') ? 'admin' : 'employee',
          }

          const token = generateToken(authPayload)

          // 設定安全 cookie
          setSecureCookie(token, false)

          // 更新 store 狀態
          set({
            user,
            isAuthenticated: true,
            currentProfile: profile,
          })

          // 初始化同步已改用 createStore 的 fetchAll 自動處理
          // 每個頁面載入時會自動從 Supabase 下載資料
          logger.log('✅ 登入成功，資料將在各頁面載入時自動同步')

          /* 舊的初始化同步程式碼（已廢棄）
      try {
        const { needsInitialSync, initialSync } = await import('@/lib/offline/initial-sync');
        const needsSync = await needsInitialSync();
        if (needsSync) {
          logger.log('📥 開始初始化同步...');
          initialSync((progress) => {
            logger.log(`📊 同步進度: ${progress.current}/${progress.total} - ${progress.table}`);
          }).then((result) => {
            if (result.success) {
              logger.log('✅ 初始化同步完成！');
            } else {
              logger.error('❌ 初始化同步失敗:', result.error);
            }
          });
        } else {
          logger.log('ℹ️ 本地資料正常，跳過初始化同步');
        }
      } catch (syncError) {
        logger.warn('⚠️ 同步檢查失敗，但不影響登入:', syncError);
      }
      */

          logger.log('✅ 登入成功:', employee.display_name)
          return { success: true }
        } catch (error) {
          logger.error('💥 登入驗證錯誤:', error)
          return { success: false, message: '系統錯誤，請稍後再試' }
        }
      },

      checkPermission: (permission: string) => {
        const profile = get().currentProfile
        if (!profile) return false
        return profile.permissions.includes(permission) || profile.permissions.includes('admin')
      },

      switchProfile: async (profileId: string) => {
        const success = OfflineAuthService.switchProfile(profileId)
        if (success) {
          const profile = useLocalAuthStore.getState().getProfileById(profileId)
          if (profile) {
            const user: User = {
              id: profile.id,
              employee_number: profile.employee_number,
              english_name: profile.english_name,
              display_name: profile.display_name,
              chinese_name: profile.display_name, // 從 profile 取得
              personal_info: (profile.personal_info as User['personal_info']) || {
                national_id: '',
                birthday: '',
                phone: '',
                email: '',
                address: '',
                emergency_contact: { name: '', relationship: '', phone: '' }
              },
              job_info: (profile.job_info as User['job_info']) || {
                hire_date: new Date().toISOString()
              },
              salary_info: (profile.salary_info as User['salary_info']) || {
                base_salary: 0,
                allowances: [],
                salary_history: []
              },
              permissions: profile.permissions || [],
              roles: profile.roles as User['roles'] || [],
              attendance: (profile.attendance as User['attendance']) || {
                leave_records: [],
                overtime_records: []
              },
              contracts: (profile.contracts as User['contracts']) || [],
              status: profile.status as 'active' | 'probation' | 'leave' | 'terminated',
              workspace_id: profile.workspace_id, // ✅ 從資料庫讀取 workspace_id
              created_at: profile.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            // 🔐 設定認證 cookie（快速登入也需要，使用帶簽名的 token）
            const token = await generateQuickLoginToken(profile.id)
            setSecureCookie(token, false)

            set({
              currentProfile: profile,
              user,
              isAuthenticated: true,
            })
          }
        }
        return success
      },

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: collapsed => set({ sidebarCollapsed: collapsed }),
      setHasHydrated: hasHydrated => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'auth-storage',
      skipHydration: true, // 🔥 避免 SSR 時讀取 localStorage
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentProfile: state.currentProfile,
        sidebarCollapsed: state.sidebarCollapsed,
        isOfflineMode: state.isOfflineMode,
      }),
      onRehydrateStorage: () => async state => {
        // Hydration 完成後設置標記
        if (state) {
          state._hasHydrated = true

          // 🔧 自動修復：如果 user 缺少 workspace_id，從 Supabase 即時查詢補上
          if (state.user && !state.user.workspace_id) {
            logger.warn('⚠️ [onRehydrate] user 缺少 workspace_id，從 Supabase 查詢...')
            try {
              const { supabase } = await import('@/lib/supabase/client')
              const { data: employee, error } = await supabase
                .from('employees')
                .select('workspace_id')
                .eq('id', state.user.id)
                .single()

              if (!error && employee?.workspace_id) {
                // 直接更新 store 狀態
                useAuthStore.setState({
                  user: {
                    ...state.user,
                    workspace_id: employee.workspace_id,
                  },
                })
                logger.log('✅ [onRehydrate] 已從 Supabase 補上 workspace_id:', employee.workspace_id)
              } else {
                logger.error('❌ [onRehydrate] 無法從 Supabase 取得 workspace_id:', error?.message)
              }
            } catch (err) {
              logger.error('❌ [onRehydrate] 查詢 workspace_id 失敗:', err)
            }
          }
        }
      },
    }
  )
)

// 🔄 客戶端自動 hydrate（恢復登入狀態）
// workspace_id 的自動修復已移至 onRehydrateStorage 中處理
if (typeof window !== 'undefined') {
  const store = useAuthStore as typeof useAuthStore & { persist: { rehydrate: () => void } }
  store.persist.rehydrate()
}
