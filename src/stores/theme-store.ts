import { create } from 'zustand';

export type ThemeType = 'morandi' | 'modern-dark';

interface ThemeState {
  // 當前主題
  currentTheme: ThemeType;
  
  // 初始化主題
  initTheme: () => void;
  
  // 切換主題
  setTheme: (theme: ThemeType) => void;
  
  // 切換主題（toggle）
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: 'morandi',
  
  initTheme: () => {
    // 從 localStorage 讀取主題
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('venturo-theme') as ThemeType;
      if (savedTheme && ['morandi', 'modern-dark'].includes(savedTheme)) {
        set({ currentTheme: savedTheme });
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    }
  },
  
  setTheme: (theme) => {
    set({ currentTheme: theme });
    // 更新 HTML 元素的 data-theme 屬性
    document.documentElement.setAttribute('data-theme', theme);
    // 儲存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('venturo-theme', theme);
    }
  },
  
  toggleTheme: () => {
    const newTheme = get().currentTheme === 'morandi' ? 'modern-dark' : 'morandi';
    get().setTheme(newTheme);
  },
}));
