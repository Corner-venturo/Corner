/**
 * 應用初始化腳本
 * 在應用啟動時自動初始化本地資料庫
 */

'use client';

import { useEffect } from 'react';
import { initLocalDatabase } from '@/lib/db/init-local-data';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化本地資料庫
    const init = async () => {
      try {
        console.log('🚀 應用啟動中...');
        
        // 初始化 IndexedDB
        await initLocalDatabase();
        
        console.log('✅ 應用初始化完成');
      } catch (error) {
        console.error('❌ 應用初始化失敗:', error);
      }
    };

    init();
  }, []);

  return <>{children}</>;
}
