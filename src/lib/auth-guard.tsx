'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const { user, _hasHydrated, isAuthenticated } = useAuthStore()
  const redirectingRef = useRef(false) // 防止重複跳轉

  useEffect(() => {
    const checkAuth = async () => {
      // 如果在登入頁面或 unauthorized 頁面，跳過檢查
      if (pathname === '/login' || pathname === '/unauthorized') {
        redirectingRef.current = false
        return
      }

      // 如果已認證（剛登入），不需要等待 hydration
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
        hasUser: !!user,
        pathname,
        _hasHydrated,
        isAuthenticated,
      })

      // 1. 檢查 auth-store 的 user
      if (!user || !user.id) {
        // 沒有登入，跳轉到登入頁
        logger.warn('沒有 user，跳轉登入頁')
        redirectingRef.current = true
        router.push('/login')
        return
      }

      // 取得當前用戶的權限
      const permissions = user?.permissions || []

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
    user,
    _hasHydrated,
    isAuthenticated,
    requiredPermission,
    pathname,
    router,
  ])


  // 登入頁面不顯示載入畫面，直接渲染
  if (pathname === '/login') {
    return <>{children}</>
  }

  // 如果已認證，直接渲染（優先檢查，避免閃爍）
  if (isAuthenticated && user?.id) {
    return <>{children}</>
  }

  // 如果有 user（持久化的狀態），直接渲染
  if (user && user.id) {
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
  const { user } = useAuthStore()

  const checkRoute = requiredRoute || pathname
  const hasPermission = user
    ? hasPermissionForRoute(user.permissions || [], checkRoute)
    : false

  return {
    hasPermission,
    userPermissions: user?.permissions || [],
    isAdmin:
      user?.permissions?.includes('admin') ||
      user?.permissions?.includes('super_admin'),
    isSuperAdmin: user?.permissions?.includes('super_admin'),
  }
}
