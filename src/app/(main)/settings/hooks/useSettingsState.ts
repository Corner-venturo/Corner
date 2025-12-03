import { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { PasswordData, CacheInfo } from '../types'

export function useSettingsState() {
  const [isPageReady, setIsPageReady] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false)
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null)
  const [clearingCache, setClearingCache] = useState(false)

  // 快速載入頁面（不等待任何非同步操作）
  useEffect(() => {
    setIsPageReady(true)
  }, [])

  // 檢查快取狀態
  const checkCacheStatus = async () => {
    try {
      const { DB_NAME, TABLE_SCHEMAS } = await import('@/lib/db/schemas')

      // 檢查資料庫是否存在
      const databases = await indexedDB.databases?.()
      const dbExists = databases?.some(db => db.name === DB_NAME) ?? false

      setCacheInfo({
        dbExists,
        tableCount: TABLE_SCHEMAS.length,
      })
    } catch (error) {
      logger.error('檢查快取狀態失敗:', error)
      setCacheInfo({ dbExists: false, tableCount: 0 })
    }
  }

  // 頁面載入時檢查快取狀態
  useEffect(() => {
    if (isPageReady) {
      checkCacheStatus()
    }
  }, [isPageReady])

  return {
    isPageReady,
    showPasswordSection,
    setShowPasswordSection,
    passwordData,
    setPasswordData,
    showPassword,
    setShowPassword,
    passwordUpdateLoading,
    setPasswordUpdateLoading,
    cacheInfo,
    setCacheInfo,
    clearingCache,
    setClearingCache,
    checkCacheStatus,
  }
}
