/**
 * 應用初始化腳本
 * 在應用啟動時自動初始化本地資料庫
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { initLocalDatabase } from '@/lib/db/init-local-data'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化本地資料庫和關鍵資料
    const init = async () => {
      try {
        logger.log('🚀 AppInitializer: Starting initialization...')

        // 🔧 修復：等待 auth-store hydration 完成
        const { useAuthStore } = await import('@/stores/auth-store')
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

        // 初始化 IndexedDB
        await initLocalDatabase()
        logger.log('✅ IndexedDB initialized')

        // ⚠️ 只在登入後才載入 workspaces（避免登入頁面卡住）
        if (authStore.user) {
          // 載入 workspaces 資料（用於編號生成等核心功能）
          const { useWorkspaceStore } = await import('@/stores')
          logger.log('📦 Loading workspaces...')

          // 確保 workspaces 完全載入
          await useWorkspaceStore.getState().fetchAll()

          const workspaces = useWorkspaceStore.getState().items
          logger.log(`✅ Workspaces loaded: ${workspaces?.length || 0} items`)

          if (!workspaces || workspaces.length === 0) {
            logger.warn('⚠️  No workspaces found! This may cause issues with tour code generation.')
          }
        } else {
          logger.log('⏭️ User not logged in, skipping workspaces loading')
        }
      } catch (error) {
        logger.error('❌ AppInitializer error:', error)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
