'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocalAuthStore } from '@/lib/auth/local-auth-manager';
import { useAuthStore } from '@/stores/auth-store';
// ⚠️ Supabase 已停用 - 純本地模式
// import { supabase } from '@/lib/supabase/client';
import { hasPermissionForRoute } from '@/lib/permissions';
import { logger } from '@/lib/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentProfile, setCurrentProfile, profiles } = useLocalAuthStore();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // 監聽網路狀態變化
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // 如果在登入頁面，跳過檢查
      if (pathname === '/login') {
        return;
      }

      logger.debug('AuthGuard 檢查', {
        hasCurrentProfile: !!currentProfile,
        hasUser: !!user,
        pathname
      });

      // 1. 優先檢查 auth-store 的 user（持久化的）
      if (user && user.id) {
        logger.info(`從 auth-store 找到用戶: ${user.display_name}`);
        // 如果 currentProfile 沒有，同步一下
        if (!currentProfile) {
          const profile = profiles.find(p => p.id === user.id);
          if (profile) {
            setCurrentProfile(profile);
          }
        }
        return;
      }

      // 2. 檢查本地是否有登入的角色
      if (!currentProfile) {
        // 📦 純本地模式 - 沒有登入就導向登入頁
        logger.warn('沒有 currentProfile，應該跳轉登入');
        // 暫時停用自動跳轉，避免無限循環
        // router.push('/login');
        return;
      }

      // 2. 檢查權限
      if (requiredPermission) {
        const hasPermission = currentProfile.permissions.includes(requiredPermission);

        if (!hasPermission) {
          logger.warn(`用戶 ${currentProfile.display_name} 無權限訪問 ${pathname}`);
          router.push('/unauthorized');
          return;
        }
      }

      // 2.1 檢查路由權限
      const hasRoutePermission = hasPermissionForRoute(currentProfile.permissions, pathname);
      if (!hasRoutePermission && pathname !== '/') {
        logger.warn(`用戶 ${currentProfile.display_name} 無權限訪問路由 ${pathname}`);
        // 暫時停用路由權限檢查
        // router.push('/');
        return;
      }

      // 3. 如果在線，嘗試刷新 Supabase session（背景執行）
      if (isOnline && currentProfile.cachedPassword) {
        refreshSupabaseSession(currentProfile);
      }
    };

    checkAuth();
  }, [currentProfile, user, isOnline, requiredPermission, pathname, router, setCurrentProfile, profiles]);

  // 📦 純本地模式 - 無需刷新 session
  const refreshSupabaseSession = async (profile: any) => {
    logger.debug('本地模式：無需刷新 session');
  };

  // 登入頁面不顯示載入畫面，直接渲染
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 如果有 user（持久化的狀態），直接渲染
  if (user && user.id) {
    return <>{children}</>;
  }

  // 如果有 currentProfile，直接渲染
  if (currentProfile) {
    return <>{children}</>;
  }

  // 如果都沒有，顯示載入畫面（很快就會跳轉到登入頁）
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold mx-auto mb-4"></div>
        <p className="text-morandi-secondary">載入中...</p>
      </div>
    </div>
  );
}

/**
 * 權限檢查 Hook
 */
export function usePermissionCheck(requiredRoute?: string) {
  const pathname = usePathname();
  const { currentProfile } = useLocalAuthStore();

  const checkRoute = requiredRoute || pathname;
  const hasPermission = currentProfile ? hasPermissionForRoute(currentProfile.permissions, checkRoute) : false;

  return {
    hasPermission,
    userPermissions: currentProfile?.permissions || [],
    isAdmin: currentProfile?.permissions.includes('admin') || currentProfile?.permissions.includes('super_admin'),
    isSuperAdmin: currentProfile?.permissions.includes('super_admin'),
  };
}
