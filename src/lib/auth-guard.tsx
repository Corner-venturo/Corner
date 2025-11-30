'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocalAuthStore } from '@/lib/auth/local-auth-manager'
import { useAuthStore } from '@/stores/auth-store'
import { hasPermissionForRoute } from '@/lib/permissions'
import { logger } from '@/lib/utils/logger'

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentProfile, setCurrentProfile, profiles } = useLocalAuthStore()
  const { user, _hasHydrated, isAuthenticated } = useAuthStore()
  const redirectingRef = useRef(false) // 防止重複跳轉

  useEffect(() => {
    const checkAuth = async () => {
      // 如果在登入頁面或 unauthorized 頁面，跳過檢查
      if (pathname === '/login' || pathname === '/unauthorized') {
        redirectingRef.current = false
        return
      }

      // 🔧 修正：如果已認證（剛登入），不需要等待 hydration
      // isAuthenticated 在 switchProfile/login 中會立即設定
      if (isAuthenticated && user?.id) {
        logger.debug('AuthGuard: 已認證，跳過 hydration 等待')
        redirectingRef.current = false
        return
      }

      // 等待 Zustand 完成 hydration（只有未認證時才需要等待）
      if (!_hasHydrated) {
        return
      }

      // 防止重複跳轉
      if (redirectingRef.current) {
        return
      }

      logger.debug('AuthGuard 檢查', {
        hasCurrentProfile: !!currentProfile,
        hasUser: !!user,
        pathname,
        _hasHydrated,
        isAuthenticated,
      })

      // 1. 優先檢查 auth-store 的 user（持久化的）
      if (user && user.id) {
        logger.info(`從 auth-store 找到用戶: ${user.display_name}`)
        // 如果 currentProfile 沒有，同步一下
        if (!currentProfile) {
          const profile = profiles.find(p => p.id === user.id)
          if (profile) {
            setCurrentProfile(profile)
          }
        }
        // 繼續檢查權限
      } else if (!currentProfile) {
        // 沒有登入，跳轉到登入頁
        logger.warn('沒有 currentProfile 和 user，跳轉登入頁')
        redirectingRef.current = true
        router.push('/login')
        return
      }

      // 取得當前用戶的權限
      const permissions = currentProfile?.permissions || user?.permissions || []

      // 2. 檢查指定權限
      if (requiredPermission) {
        const hasPermission = permissions.includes(requiredPermission) ||
                             permissions.includes('admin') ||
                             permissions.includes('super_admin')

        if (!hasPermission) {
          logger.warn(`用戶無權限訪問 ${pathname}（需要 ${requiredPermission}）`)
          redirectingRef.current = true
          router.push('/unauthorized')
          return
        }
      }

      // 3. 檢查路由權限
      const hasRoutePermission = hasPermissionForRoute(permissions, pathname)
      if (!hasRoutePermission && pathname !== '/') {
        logger.warn(`用戶無權限訪問路由 ${pathname}`)
        redirectingRef.current = true
        router.push('/unauthorized')
        return
      }
    }

    checkAuth()
  }, [
    currentProfile,
    user,
    _hasHydrated,
    isAuthenticated,
    requiredPermission,
    pathname,
    router,
    setCurrentProfile,
    profiles,
  ])


  // 登入頁面不顯示載入畫面，直接渲染
  if (pathname === '/login') {
    return <>{children}</>
  }

  // 🔧 如果已認證，直接渲染（優先檢查，避免閃爍）
  if (isAuthenticated && user?.id) {
    return <>{children}</>
  }

  // 如果有 user（持久化的狀態），直接渲染
  if (user && user.id) {
    return <>{children}</>
  }

  // 如果有 currentProfile，直接渲染
  if (currentProfile) {
    return <>{children}</>
  }

  // 如果都沒有，顯示載入畫面（很快就會跳轉到登入頁）
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold/20 mx-auto mb-4"></div>
        <p className="text-morandi-secondary">載入中...</p>
      </div>
    </div>
  )
}

/**
 * 權限檢查 Hook
 */
export function usePermissionCheck(requiredRoute?: string) {
  const pathname = usePathname()
  const { currentProfile } = useLocalAuthStore()

  const checkRoute = requiredRoute || pathname
  const hasPermission = currentProfile
    ? hasPermissionForRoute(currentProfile.permissions, checkRoute)
    : false

  return {
    hasPermission,
    userPermissions: currentProfile?.permissions || [],
    isAdmin:
      currentProfile?.permissions.includes('admin') ||
      currentProfile?.permissions.includes('super_admin'),
    isSuperAdmin: currentProfile?.permissions.includes('super_admin'),
  }
}
