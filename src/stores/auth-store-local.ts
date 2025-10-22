import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { LocalAuthService } from '@/services/local-auth-service';
import { generateToken, type AuthPayload } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

import { User } from './types';

interface AuthState {
  // 核心屬性
  user: User | null;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  lastVisitedPath: string;

  // 方法
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLastVisitedPath: (path: string) => void;
}

// 防暴力破解的失敗記錄
const loginAttemptsMap = new Map<string, { count: number; lastAttempt: Date }>();

function checkLoginAttempts(username: string): { allowed: boolean; message?: string } {
  const attempts = loginAttemptsMap.get(username);

  if (!attempts) {
    loginAttemptsMap.set(username, { count: 1, lastAttempt: new Date() });
    return { allowed: true };
  }

  // 15 分鐘後重置
  const timeDiff = Date.now() - attempts.lastAttempt.getTime();
  if (timeDiff > 15 * 60 * 1000) {
    loginAttemptsMap.set(username, { count: 1, lastAttempt: new Date() });
    return { allowed: true };
  }

  // 超過 5 次嘗試
  if (attempts.count >= 5) {
    const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / (60 * 1000));
    return {
      allowed: false,
      message: `登入失敗次數過多，請 ${remainingTime} 分鐘後再試`
    };
  }

  attempts.count++;
  attempts.lastAttempt = new Date();
  return { allowed: true };
}

function recordLoginAttempt(username: string, success: boolean): void {
  if (success) {
    // 登入成功，清除失敗記錄
    loginAttemptsMap.delete(username);
  }
  // 失敗記錄已在 checkLoginAttempts 中處理
}

function setLocalToken(user: User): void {
  // 生成本地 token（用於 session 管理）
  const authPayload: AuthPayload = {
    id: user.id,
    employee_number: user.employee_number,
    permissions: user.permissions || [],
    role: user.permissions?.includes('super_admin') ? 'super_admin' :
          user.permissions?.includes('admin') ? 'admin' : 'employee'
  };

  const token = generateToken(authPayload);
  
  // 儲存到 sessionStorage（關閉瀏覽器就清除）
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth-token', token);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: true,
      lastVisitedPath: '/workspace',

      login: async (username: string, password: string) => {
        try {
          // 檢查登入次數限制
          const attemptsCheck = checkLoginAttempts(username);
          if (!attemptsCheck.allowed) {
            return { success: false, message: attemptsCheck.message };
          }

          // 使用純本地認證服務
          const result = await LocalAuthService.login(username, password);

          if (result.success && result.user) {
            // 記錄成功登入
            recordLoginAttempt(username, true);

            // 設定本地 token
            setLocalToken(result.user);

            // 更新 Store
            set({
              user: result.user,
              isAuthenticated: true
            });

            return { success: true };
          }

          // 記錄失敗登入
          recordLoginAttempt(username, false);
          return { success: false, message: result.message || '登入失敗' };

        } catch (error) {
          logger.error('登入錯誤:', error);
          return { success: false, message: '系統錯誤，請稍後再試' };
        }
      },

      logout: () => {
        // 清除 sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-token');
          localStorage.removeItem('auth-storage');
        }

        set({
          user: null,
          isAuthenticated: false,
          lastVisitedPath: '/workspace'
        });
      },

      checkPermission: (permission: string) => {
        const user = get().user;
        return LocalAuthService.hasPermission(user, permission);
      },

      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ 
        sidebarCollapsed: collapsed 
      }),
      
      setLastVisitedPath: (path) => {
        set({ lastVisitedPath: path });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
        lastVisitedPath: state.lastVisitedPath
      })
    }
  )
);
