'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme, initTheme } = useThemeStore();

  useEffect(() => {
    // 初始化主題（從 localStorage 讀取）
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    // 當主題改變時更新 HTML 屬性
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return <>{children}</>;
}
