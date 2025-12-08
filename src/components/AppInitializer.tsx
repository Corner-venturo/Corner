/**
 * 應用初始化腳本
 * 在應用啟動時自動初始化本地資料庫並刷新使用者權限
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = async () => {
      try {
        logger.log('🚀 AppInitializer: Starting initialization...')

        // 等待 auth-store hydration 完成
        const authStore = useAuthStore.getState()

        if (!authStore._hasHydrated) {
          logger.log('⏳ Waiting for auth-store hydration...')

          await new Promise<void>(resolve => {
            const unsubscribe = useAuthStore.subscribe(state => {
              if (state._hasHydrated) {
                logger.log('✅ Auth-store hydrated')
                unsubscribe()
                resolve()
              }
            })

            // 安全超時（5 秒）
            setTimeout(() => {
              logger.warn('⚠️ Auth-store hydration timeout, continuing anyway')
              unsubscribe()
              resolve()
            }, 5000)
          })
        }

        // 如果使用者已登入，從 Supabase 刷新最新資料（權限、角色等）
        const currentUser = useAuthStore.getState().user
        if (currentUser?.id) {
          logger.log('🔄 Refreshing user data from Supabase...')
          await useAuthStore.getState().refreshUserData()
        }

        logger.log('✅ AppInitializer: Initialization complete')
      } catch (error) {
        logger.error('❌ AppInitializer error:', error)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
