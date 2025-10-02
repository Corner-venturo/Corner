'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useLocalAuthStore } from '@/lib/auth/local-auth-manager';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed } = useAuthStore();
  const { currentProfile } = useLocalAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 簡化的認證檢查 - 暫時停用,使用 auth-store 的 user
  useEffect(() => {
    if (!isClient) return;
    if (pathname === '/login') return;

    // 給 Zustand persist 一點時間載入
    const checkTimeout = setTimeout(() => {
      const authUser = useAuthStore.getState().user;

      // 暫時停用檢查,避免無限循環
      // if (!authUser) {
      //   router.push('/login');
      // }
    }, 50);

    return () => clearTimeout(checkTimeout);
  }, [isClient, pathname, currentProfile, router]);

  // 初始化離線資料庫
  useEffect(() => {
    // 離線資料庫會在 sync-manager 中自動初始化
  }, [isClient]);

  // 不需要側邊欄的頁面
  const noSidebarPages = ['/login', '/unauthorized'];
  const shouldShowSidebar = !noSidebarPages.includes(pathname);

  // 登入頁不需要側邊欄
  if (!shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 左下象限 - 側邊欄 */}
      <Sidebar />

      {/* 右下象限 - 主內容區域 */}
      <main className={cn(
        'transition-all duration-300 pt-18',
        !isClient ? 'ml-16' : (sidebarCollapsed ? 'ml-16' : 'ml-64')
      )}>
        <div className="h-[calc(100vh-72px)] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}