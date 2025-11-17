import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logger } from '@/lib/utils/logger'

// ============= 1. 類型定義 =============
export interface LocalProfile {
  id: string
  email: string
  employee_number: string
  display_name: string
  english_name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE'
  permissions: string[]
  roles?: ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant')[] // 附加身份標籤（支援多重角色）
  workspace_id?: string // 所屬 workspace ID（如果有的話）

  // 離線認證相關
  cachedPassword?: string // 加密的密碼快取（用於背景同步）
  pinHash?: string // PIN 碼的雜湊值

  // 個人資訊
  personal_info?: unknown
  job_info?: unknown
  salary_info?: unknown
  contracts?: unknown[]
  attendance?: unknown

  // 元資料
  lastLoginAt: string
  lastSyncAt?: string
  created_at: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface ProfileCard {
  id: string
  display_name: string
  english_name: string
  role: string
  avatarUrl?: string
  lastLoginAt: string
}

// ============= 2. 本地認證狀態管理 =============
interface LocalAuthState {
  profiles: LocalProfile[]
  currentProfile: LocalProfile | null
  lastSelectedProfileId: string | null

  // Profile 管理
  addProfile: (profile: LocalProfile) => void
  removeProfile: (profileId: string) => void
  updateProfile: (profileId: string, updates: Partial<LocalProfile>) => void
  getProfileById: (profileId: string) => LocalProfile | null
  getProfileCards: () => ProfileCard[]

  // 當前登入
  setCurrentProfile: (profile: LocalProfile | null) => void
  getCurrentProfile: () => LocalProfile | null

  // PIN 碼管理
  setPinForProfile: (profileId: string, pinHash: string) => void
  verifyPin: (profileId: string, pin: string) => Promise<boolean>

  // 清理
  clearAll: () => void
}

export const useLocalAuthStore = create<LocalAuthState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfile: null,
      lastSelectedProfileId: null,

      addProfile: profile => {
        set(state => {
          // 檢查是否已存在
          const exists = state.profiles.some(p => p.id === profile.id)
          if (exists) {
            // 更新現有的
            return {
              profiles: state.profiles.map(p =>
                p.id === profile.id
                  ? { ...p, ...profile, lastLoginAt: new Date().toISOString() }
                  : p
              ),
            }
          }
          // 添加新的
          return {
            profiles: [...state.profiles, { ...profile, lastLoginAt: new Date().toISOString() }],
          }
        })
      },

      removeProfile: profileId => {
        set(state => ({
          profiles: state.profiles.filter(p => p.id !== profileId),
          currentProfile: state.currentProfile?.id === profileId ? null : state.currentProfile,
        }))
      },

      updateProfile: (profileId, updates) => {
        set(state => ({
          profiles: state.profiles.map(p => (p.id === profileId ? { ...p, ...updates } : p)),
          currentProfile:
            state.currentProfile?.id === profileId
              ? { ...state.currentProfile, ...updates }
              : state.currentProfile,
        }))
      },

      getProfileById: profileId => {
        return get().profiles.find(p => p.id === profileId) || null
      },

      getProfileCards: () => {
        return get().profiles.map(profile => ({
          id: profile.id,
          display_name: profile.display_name,
          english_name: profile.english_name,
          role: profile.role,
          lastLoginAt: profile.lastLoginAt,
        }))
      },

      setCurrentProfile: profile => {
        // 同時儲存到 localStorage
        if (profile) {
          localStorage.setItem('current-profile-id', profile.id)
        } else {
          localStorage.removeItem('current-profile-id')
        }

        set({
          currentProfile: profile,
          lastSelectedProfileId: profile?.id || null,
        })

        // 更新最後登入時間
        if (profile) {
          get().updateProfile(profile.id, {
            lastLoginAt: new Date().toISOString(),
          })
        }
      },

      getCurrentProfile: () => get().currentProfile,

      setPinForProfile: (profileId, pinHash) => {
        get().updateProfile(profileId, { pinHash })
      },

      verifyPin: async (profileId, pin) => {
        const profile = get().getProfileById(profileId)
        if (!profile || !profile.pinHash) {
          return false
        }

        // 使用 bcrypt 驗證 PIN
        try {
          const bcrypt = (await import('bcryptjs')).default
          return await bcrypt.compare(pin, profile.pinHash)
        } catch (error) {
          logger.error('PIN 驗證失敗', error)
          return false
        }
      },

      clearAll: () => {
        localStorage.removeItem('current-profile-id')
        set({ profiles: [], currentProfile: null, lastSelectedProfileId: null })
      },
    }),
    {
      name: 'local-auth-storage',
      version: 1,
      partialize: state => ({
        profiles: state.profiles,
        currentProfile: state.currentProfile, // 重要！確保持久化
        lastSelectedProfileId: state.lastSelectedProfileId,
      }),
    }
  )
)

// ============= 3. 密碼加密工具 =============
export class PasswordEncryption {
  private static readonly ENCRYPTION_KEY = 'venturo-offline-auth-2024'

  /**
   * 簡單的密碼加密（用於本地快取）
   * 注意：這不是高強度加密，僅用於防止明文儲存
   */
  static async encrypt(password: string): Promise<string> {
    try {
      // 使用 Web Crypto API
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const key = encoder.encode(this.ENCRYPTION_KEY)

      // 簡單的 XOR 加密
      const encrypted = new Uint8Array(data.length)
      for (let i = 0; i < data.length; i++) {
        encrypted[i] = data[i] ^ key[i % key.length]
      }

      return btoa(String.fromCharCode(...encrypted))
    } catch (error) {
      logger.error('加密失敗', error)
      return btoa(password) // 降級方案
    }
  }

  /**
   * 解密密碼
   */
  static async decrypt(encryptedPassword: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const key = encoder.encode(this.ENCRYPTION_KEY)
      const encrypted = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0))

      // XOR 解密
      const decrypted = new Uint8Array(encrypted.length)
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ key[i % key.length]
      }

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      logger.error('解密失敗', error)
      return atob(encryptedPassword) // 降級方案
    }
  }

  /**
   * 生成 PIN 碼雜湊
   */
  static async hashPin(pin: string): Promise<string> {
    const bcrypt = (await import('bcryptjs')).default
    return bcrypt.hash(pin, 10)
  }
}
