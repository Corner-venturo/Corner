'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useLocalAuthStore } from '@/lib/auth/local-auth-manager';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import {
  STORAGE_KEY_LAST_VISITED,
  NO_SIDEBAR_PAGES,
  CUSTOM_LAYOUT_PAGES,
  HEADER_HEIGHT_PX,
  SIDEBAR_WIDTH_EXPANDED_PX,
  SIDEBAR_WIDTH_COLLAPSED_PX,
  LAYOUT_TRANSITION_DURATION,
} from '@/lib/constants';

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

  // 記錄使用者訪問的頁面（用於登出後重新登入時跳回）
  useEffect(() => {
    if (!isClient) return;
    if (pathname === '/login') return;

    // 儲存當前路徑到 localStorage
    localStorage.setItem(STORAGE_KEY_LAST_VISITED, pathname);
  }, [isClient, pathname]);

  // 簡化的認證檢查 - 暫時停用,使用 auth-store 的 user
  useEffect(() => {
    if (!isClient) return;
    if (pathname === '/login') return;

    // 給 Zustand persist 一點時間載入
    const checkTimeout = setTimeout(() => {
      const authUser = useAuthStore.getState().user;

      // 暫時停用檢查,避免無限循環
      // if (!_authUser) {
      //   router.push('/login');
      // }
    }, 50);

    return () => clearTimeout(checkTimeout);
  }, [isClient, pathname, currentProfile, router]);

  // 初始化離線資料庫和基礎資料
  useEffect(() => {
    if (!isClient) return;

    // 離線資料庫會在 sync-manager 中自動初始化

    // 載入基礎資料（只載入全域需要的資料）
    const loadInitialData = async () => {
      try {
        // 載入工作空間（全域需要）
        const { useChannelsStore } = await import('@/stores/workspace/channels-store');
        const workspaceState = useChannelsStore.getState();
        if (!workspaceState.currentWorkspace) {
          await workspaceState.loadWorkspaces();
          console.log('✅ 工作空間初始化完成');
        }
      } catch (error) {
        console.error('❌ 初始資料載入失敗:', error);
      }
    };

    loadInitialData();
  }, [isClient]);

  // 不需要側邊欄的頁面（支援完全匹配和前綴匹配）
  const shouldShowSidebar = !NO_SIDEBAR_PAGES.some(page =>
    pathname === page || pathname.startsWith(page + '/')
  );

  // 使用自定義 layout 的頁面
  const hasCustomLayout = CUSTOM_LAYOUT_PAGES.some(page => pathname.startsWith(page));

  // 登入頁或分享頁不需要側邊欄
  if (!shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // 使用自定義 layout 的頁面只需要側邊欄
  if (hasCustomLayout) {
    return (
      <div className="min-h-screen bg-background">
        {/* 左下象限 - 側邊欄 */}
        <Sidebar />
        {/* 內容由頁面自己的 layout 處理 */}
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
        'fixed bottom-0 right-0 transition-all',
        !isClient ? 'left-16' : (sidebarCollapsed ? 'left-16' : 'left-[190px]')
      )}
      style={{
        top: HEADER_HEIGHT_PX,
        transitionDuration: `${LAYOUT_TRANSITION_DURATION}ms`,
      }}>
        <div className="p-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}