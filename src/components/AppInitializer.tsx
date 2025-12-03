/**
 * 應用初始化腳本
 * 在應用啟動時自動初始化本地資料庫
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store' // Import useAuthStore

// This function attempts to validate an auth token and update the store
async function validateAuthToken(token: string) {
  try {
    // In a real application, you would make an API call to validate the token
    // and fetch user details. For now, we'll simulate it.
    // const response = await fetch('/api/auth/validate-token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    // });
    // if (response.ok) {
    //   const data = await response.json();
    //   useAuthStore.getState().setUser(data.user);
    //   logger.log('✅ Auth token validated, user set.');
    // } else {
    //   logger.warn('⚠️ Auth token validation failed.');
    //   useAuthStore.getState().logout(); // Clear invalid token
    // }

    // Simulate validation success and setting a dummy user for now
    // Replace with actual API call
    const user = { id: 'dummy-user-id', name: 'Test User', email: 'test@example.com', role: 'admin', permissions: [] }; // Replace with actual user from API
    useAuthStore.getState().setUser(user);
    logger.log('✅ Auth token simulated validation, user set.');
  } catch (error) {
    logger.error('❌ Auth token validation error:', error);
    useAuthStore.getState().logout(); // Ensure user is logged out on error
  }
}

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化本地資料庫和關鍵資料
    const init = async () => {
      try {
        logger.log('🚀 AppInitializer: Starting initialization...')

        // 🔧 修復：等待 auth-store hydration 完成
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

        // --- AUTH INITIALIZATION ---
        // Load user from localStorage if token exists
        const savedAuthToken = localStorage.getItem('auth-token')
        if (savedAuthToken) {
          logger.log('Found auth-token in localStorage, validating...')
          await validateAuthToken(savedAuthToken)
        } else {
          logger.log('No auth-token found in localStorage.')
        }
        // --- END AUTH INITIALIZATION ---

        logger.log('✅ [PERF-OPTIMIZATION] Skipped global workspace fetch on startup.')
      } catch (error) {
        logger.error('❌ AppInitializer error:', error)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
