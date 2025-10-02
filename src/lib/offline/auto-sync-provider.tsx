'use client'

/**
 * 🔄 Venturo v4.0 - 自動同步 Provider
 *
 * 功能：
 * - 在應用啟動時自動初始化同步引擎
 * - 監聽網路狀態，網路恢復時自動同步
 * - 定期背景同步（可配置）
 * - 提供同步狀態給整個應用
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSyncEngine, SyncStatus } from './sync-engine'
import { getOfflineManager } from './offline-manager'

interface AutoSyncContextValue {
  syncStatus: SyncStatus | null
  isOnline: boolean
  triggerSync: () => Promise<void>
  enableAutoSync: () => void
  disableAutoSync: () => void
}

const AutoSyncContext = createContext<AutoSyncContextValue>({
  syncStatus: null,
  isOnline: true,
  triggerSync: async () => {},
  enableAutoSync: () => {},
  disableAutoSync: () => {}
})

export function useAutoSync() {
  return useContext(AutoSyncContext)
}

interface AutoSyncProviderProps {
  children: ReactNode
  enabled?: boolean // 是否啟用自動同步，預設 true
  interval?: number // 同步間隔（毫秒），預設 30000 (30秒)
}

export function AutoSyncProvider({
  children,
  enabled = true,
  interval = 30000
}: AutoSyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(enabled)
  const [syncEngine] = useState(() => getSyncEngine({
    enableAutoSync: enabled,
    syncInterval: interval
  }))

  // 監聽網路狀態
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = async () => {
      console.log('🌐 網路已恢復，準備同步...')
      setIsOnline(true)

      // 網路恢復時立即同步
      try {
        const status = await syncEngine.manualSync()
        setSyncStatus(status)
      } catch (error) {
        console.error('網路恢復後同步失敗:', error)
      }
    }

    const handleOffline = () => {
      console.log('📴 網路已斷線，切換到離線模式')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始狀態
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncEngine])

  // 自動同步機制
  useEffect(() => {
    if (!autoSyncEnabled) return

    console.log('🔄 啟動自動同步機制')
    syncEngine.startAutoSync()

    return () => {
      console.log('⏸️ 停止自動同步機制')
      syncEngine.stopAutoSync()
    }
  }, [autoSyncEnabled, syncEngine])

  // 定期更新同步狀態
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await syncEngine.getStatus()
        setSyncStatus(status)
      } catch (error) {
        console.error('更新同步狀態失敗:', error)
      }
    }

    // 初始化時載入狀態
    updateStatus()

    // 每 5 秒更新一次狀態
    const statusInterval = setInterval(updateStatus, 5000)

    return () => clearInterval(statusInterval)
  }, [syncEngine])

  const triggerSync = async () => {
    try {
      const status = await syncEngine.manualSync()
      setSyncStatus(status)
    } catch (error) {
      console.error('手動同步失敗:', error)
      throw error
    }
  }

  const enableAutoSync = () => {
    setAutoSyncEnabled(true)
  }

  const disableAutoSync = () => {
    setAutoSyncEnabled(false)
  }

  const contextValue: AutoSyncContextValue = {
    syncStatus,
    isOnline,
    triggerSync,
    enableAutoSync,
    disableAutoSync
  }

  return (
    <AutoSyncContext.Provider value={contextValue}>
      {children}
    </AutoSyncContext.Provider>
  )
}
