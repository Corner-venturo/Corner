import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';
import { generateToken, verifyPassword, type AuthPayload } from '@/lib/auth';
import { useLocalAuthStore, LocalProfile } from '@/lib/auth/local-auth-manager';
import { OfflineAuthService } from '@/services/offline-auth.service';

interface AuthState {
  // 保持向下相容的屬性
  user: User | null;
  isAuthenticated: boolean;
  sidebarCollapsed: boolean;
  loginAttempts: Map<string, { count: number; lastAttempt: Date }>;

  // 新增屬性
  currentProfile: LocalProfile | null;
  isOfflineMode: boolean;

  // 方法
  login: (user: User) => void;
  logout: () => void;
  validateLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  checkPermission: (permission: string) => boolean;
  switchProfile: (profileId: string) => boolean;
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

function setSecureCookie(token: string, rememberMe: boolean = false): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30天 or 8小時
  const secure = window.location.protocol === 'https:' ? 'Secure; ' : '';

  // 在 localhost 開發環境中，不使用 Secure 和 SameSite=Strict
  if (window.location.hostname === 'localhost') {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; ${secure}`;
  }
}

export const useAuthStore = create<AuthState>(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: true,
      loginAttempts: new Map(),
      currentProfile: null,
      isOfflineMode: false,

      login: (user) => {
        // 同時更新 user 和 currentProfile
        const profile = useLocalAuthStore.getState().currentProfile;
        set({
          user,
          isAuthenticated: true,
          currentProfile: profile
        });
      },

      logout: () => {
        // 使用離線認證服務登出
        OfflineAuthService.logout();

        // 安全清除認證 cookie
        if (typeof window !== 'undefined') {
          if (window.location.hostname === 'localhost') {
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
          } else {
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict; Secure';
          }
        }

        set({
          user: null,
          isAuthenticated: false,
          currentProfile: null
        });
      },

  validateLogin: async (username: string, password: string) => {
        try {
          // 使用離線認證服務進行初次登入
          const result = await OfflineAuthService.initialLogin(username, password);

          if (result.success && result.profile) {
            // 建立用戶對象（向下相容）
            const user: User = {
              id: result.profile.id,
              employeeNumber: result.profile.employeeNumber,
              englishName: result.profile.englishName,
              chineseName: result.profile.chineseName,
              personalInfo: result.profile.personalInfo || {},
              jobInfo: result.profile.jobInfo || {},
              salaryInfo: result.profile.salaryInfo || {},
              permissions: result.profile.permissions || [],
              attendance: result.profile.attendance || { leaveRecords: [], overtimeRecords: [] },
              contracts: result.profile.contracts || [],
              status: result.profile.status
            };

            // 生成 JWT token
            const authPayload: AuthPayload = {
              id: result.profile.id,
              employeeNumber: result.profile.employeeNumber,
              permissions: result.profile.permissions || [],
              role: result.profile.permissions?.includes('super_admin') ? 'super_admin' :
                    result.profile.permissions?.includes('admin') ? 'admin' : 'employee'
            };

            const token = generateToken(authPayload);

            // 設定安全 cookie
            setSecureCookie(token, false);

            set({
              user,
              isAuthenticated: true,
              currentProfile: result.profile
            });

            return { success: true };
          }

          return { success: false, message: result.message || '登入失敗' };

        } catch (error) {
          console.error('💥 登入驗證錯誤:', error);
          return { success: false, message: '系統錯誤，請稍後再試' };
        }
      },

      checkPermission: (permission: string) => {
        const profile = get().currentProfile;
        if (!profile) return false;
        return profile.permissions.includes(permission) ||
               profile.permissions.includes('super_admin') ||
               profile.permissions.includes('admin');
      },

      switchProfile: (profileId: string) => {
        const success = OfflineAuthService.switchProfile(profileId);
        if (success) {
          const profile = useLocalAuthStore.getState().getProfileById(profileId);
          if (profile) {
            const user: User = {
              id: profile.id,
              employeeNumber: profile.employeeNumber,
              englishName: profile.englishName,
              chineseName: profile.chineseName,
              personalInfo: profile.personalInfo || {},
              jobInfo: profile.jobInfo || {},
              salaryInfo: profile.salaryInfo || {},
              permissions: profile.permissions || [],
              attendance: profile.attendance || { leaveRecords: [], overtimeRecords: [] },
              contracts: profile.contracts || [],
              status: profile.status
            };

            set({
              currentProfile: profile,
              user,
              isAuthenticated: true
            });
          }
        }
        return success;
      },

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'auth-storage',
      skipHydration: true, // 🔥 避免 SSR 時讀取 localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentProfile: state.currentProfile,
        sidebarCollapsed: state.sidebarCollapsed,
        isOfflineMode: state.isOfflineMode
      })
    }
  )
);