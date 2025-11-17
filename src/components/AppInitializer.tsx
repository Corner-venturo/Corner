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
        // 初始化 IndexedDB
        await initLocalDatabase()

        // 載入 workspaces 資料（用於編號生成等核心功能）
        const { useWorkspaceStoreData } = await import('@/stores/workspace/workspace-store')
        await useWorkspaceStoreData.getState().fetchAll()
      } catch (error) {
        logger.error('AppInitializer error:', error)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
