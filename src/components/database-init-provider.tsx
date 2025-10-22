'use client';

/**
 * 資料庫初始化 Provider
 *
 * 在應用啟動時自動檢查並初始化 IndexedDB
 * 確保 William 管理員帳號存在
 */

import { useEffect, useState } from 'react';
import { DatabaseInitializer } from '@/lib/db/database-initializer';

interface DatabaseInitProviderProps {
  children: React.ReactNode;
}

export function DatabaseInitProvider({ children }: DatabaseInitProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeDatabase() {
      try {
        await DatabaseInitializer.ensureInitialized();
        setIsInitialized(true);

        // 載入驗證工具到 window（開發用）
        if (process.env.NODE_ENV === 'development') {
          try {
            await import('@/lib/db/verify-and-fix');
          } catch (e) {
            // 忽略錯誤
          }
        }
      } catch (error) {
        console.error('❌ 資料庫初始化失敗:', error);
        // 即使失敗也讓應用繼續運行
        setIsInitialized(true);
      }
    }

    initializeDatabase();
  }, []);

  // 不顯示 loading 畫面，讓應用立即渲染
  // 初始化在背景執行
  return <>{children}</>;
}
