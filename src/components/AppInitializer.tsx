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

        // 初始化 IndexedDB
        await initLocalDatabase()
        logger.log('✅ IndexedDB initialized')

        // 載入 workspaces 資料（用於編號生成等核心功能）
        const { useWorkspaceStoreData } = await import('@/stores/workspace/workspace-store')
        logger.log('📦 Loading workspaces...')

        // 確保 workspaces 完全載入
        await useWorkspaceStoreData.getState().fetchAll()

        const workspaces = useWorkspaceStoreData.getState().items
        logger.log(`✅ Workspaces loaded: ${workspaces?.length || 0} items`)

        if (!workspaces || workspaces.length === 0) {
          logger.warn('⚠️  No workspaces found! This may cause issues with tour code generation.')
        }
      } catch (error) {
        logger.error('❌ AppInitializer error:', error)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
