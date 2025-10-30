'use client'

import { useEffect } from 'react'
import { networkMonitor } from '@/lib/sync/network-monitor'

/**
 * 網路監聽器初始化器
 * 在應用程式啟動時啟動網路狀態監聽
 */
export function NetworkMonitorInitializer() {
  useEffect(() => {
    // networkMonitor 已經是單例，這裡只是確保它被載入
    // 實際的監聽器會在 import 時自動啟動

    return () => {
      // 清理（雖然通常不會執行到這裡）
      networkMonitor?.destroy()
    }
  }, [])

  // 不渲染任何 UI
  return null
}
