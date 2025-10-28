import { _verifyPassword } from '@/lib/auth';
import {
  useLocalAuthStore,
  LocalProfile,
  PasswordEncryption
} from '@/lib/auth/local-auth-manager';
import { localDB } from '@/lib/db';
import { TABLES } from '@/lib/db/schemas';
import bcrypt from 'bcryptjs';

// ============= 離線認證服務 =============
export class OfflineAuthService {
  /**
   * 初次登入（需要網路）
   * 從 Supabase 驗證並建立本地 Profile
   */
  static async initialLogin(
    email: string,
    password: string
  ): Promise<{ success: boolean; profile?: LocalProfile; message?: string }> {
    try {
      // 🚀 TODO: [上線修改] 改成 Supabase 優先，IndexedDB 備援
      // 參考：docs/PRODUCTION_TODO.md

      // 🚀 TODO: [上線修改] 這裡要改成：
      // 1. 先嘗試從 Supabase 讀取
      // 2. 成功則同步到 IndexedDB
      // 3. 失敗則使用 IndexedDB 離線登入
      // 從 IndexedDB 讀取真實使用者
      await localDB.init(); // 確保資料庫已初始化
      const users = await localDB.getAll<unknown>(TABLES.EMPLOYEES as unknown);
      const employee = users.find(u => u.employee_number === email || u.employee_number === email);

      if (!employee) {
        return {
          success: false,
          message: '用戶名稱或密碼錯誤'
        };
      }

      // 驗證密碼 - 支援多種欄位名稱
      const password_hash = employee.password_hash || employee.password_hash;
      if (!password_hash) {
                return {
          success: false,
          message: '帳號尚未設定密碼'
        };
      }

      const isValidPassword = await bcrypt.compare(password, password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          message: '用戶名稱或密碼錯誤'
        };
      }


      // 3. 建立本地 Profile
      let encryptedPassword;
      try {
        encryptedPassword = await PasswordEncryption.encrypt(password);
      } catch (encErr) {
                throw encErr;
      }

      // 支援多種屬性名稱格式
      const profile: LocalProfile = {
        id: employee.id,
        email: employee.email || employee.employee_number + '@venturo.local',
        employee_number: employee.employee_number || employee.employee_number,
        display_name: employee.name || employee.display_name || employee.display_name,
        english_name: employee.english_name || employee.english_name || employee.name,
        role: this.determineRole(employee.permissions),
        permissions: employee.permissions || [],
        cachedPassword: encryptedPassword,
        personal_info: employee.personal_info || employee.personal_info,
        job_info: employee.job_info || employee.job_info || {
          department: employee.department,
          position: employee.position,
          salary: employee.salary
        },
        salary_info: employee.salary_info || employee.salary_info,
        contracts: employee.contracts,
        attendance: employee.attendance,
        lastLoginAt: new Date().toISOString(),
        created_at: employee.created_at || employee.created_at || new Date().toISOString(),
        status: (employee.is_active || employee.is_active) ? 'active' : 'inactive'
      };

      // 4. 儲存到本地
      try {
        useLocalAuthStore.getState().addProfile(profile);
        useLocalAuthStore.getState().setCurrentProfile(profile);
      } catch (storeErr) {
                throw storeErr;
      }


      return { success: true };

    } catch (error) {
            return {
        success: false,
        message: '登入失敗，請稍後再試'
      };
    }
  }

  /**
   * 離線登入（使用 PIN 碼或密碼）
   */
  static async offlineLogin(
    profileId: string,
    credential: string,
    usePin: boolean = true
  ): Promise<{ success: boolean; profile?: LocalProfile; message?: string }> {
    try {
      const profile = useLocalAuthStore.getState().getProfileById(profileId);

      if (!profile) {
        return {
          success: false,
          message: '找不到此用戶資料'
        };
      }

      let isValid = false;

      if (usePin) {
        // 使用 PIN 碼驗證
        if (!profile.pinHash) {
          return {
            success: false,
            message: '此帳號尚未設定 PIN 碼'
          };
        }

        isValid = await useLocalAuthStore.getState().verifyPin(profileId, credential);
      } else {
        // 使用密碼驗證（離線）
        if (!profile.cachedPassword) {
          return {
            success: false,
            message: '此帳號無法使用離線登入'
          };
        }

        const decryptedPassword = await PasswordEncryption.decrypt(profile.cachedPassword);
        isValid = credential === decryptedPassword;
      }

      if (!isValid) {
        return {
          success: false,
          message: usePin ? 'PIN 碼錯誤' : '密碼錯誤'
        };
      }

      // 設定為當前登入
      useLocalAuthStore.getState().setCurrentProfile(profile);


      // 背景嘗試刷新 Supabase session
      if (typeof navigator !== 'undefined' && navigator.onLine && profile.cachedPassword) {
        this.refreshSupabaseSession(profile).catch(() => {
          // Silent fail - Supabase refresh is optional
        });
      }

      return { success: true };

    } catch (error) {
            return {
        success: false,
        message: '登入失敗，請稍後再試'
      };
    }
  }

  /**
   * 設定 PIN 碼
   */
  static async setupPin(profileId: string, pin: string): Promise<boolean> {
    try {
      if (pin.length < 4 || pin.length > 6) {
        throw new Error('PIN 碼長度必須是 4-6 位數字');
      }

      if (!/^\d+$/.test(pin)) {
        throw new Error('PIN 碼只能包含數字');
      }

      const pinHash = await PasswordEncryption.hashPin(pin);
      useLocalAuthStore.getState().setPinForProfile(profileId, pinHash);

      return true;

    } catch (error) {
            return false;
    }
  }

  /**
   * 切換角色
   */
  static switchProfile(profileId: string): boolean {
    try {
      const profile = useLocalAuthStore.getState().getProfileById(profileId);

      if (!profile) {
                return false;
      }

      useLocalAuthStore.getState().setCurrentProfile(profile);

      // 背景刷新 session
      if (typeof navigator !== 'undefined' && navigator.onLine && profile.cachedPassword) {
        this.refreshSupabaseSession(profile).catch(() => {
          // Silent fail - Supabase refresh is optional
        });
      }

      return true;

    } catch (error) {
            return false;
    }
  }

  /**
   * 登出
   */
  static logout(): void {
    useLocalAuthStore.getState().setCurrentProfile(null);
  }

  /**
   * 背景刷新（純本地模式 - 已停用）
   */
  private static async refreshSupabaseSession(profile: LocalProfile): Promise<void> {
  }

  /**
   * 判斷用戶角色
   */
  private static determineRole(permissions: string[]): 'ADMIN' | 'EMPLOYEE' {
    if (permissions?.includes('admin')) return 'ADMIN';
    return 'EMPLOYEE';
  }

  /**
   * 同步本地 Profile 與遠端
   */
  static async syncProfile(profileId: string): Promise<boolean> {
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

      if (!isOnline) {
        return false;
      }

      const profile = useLocalAuthStore.getState().getProfileById(profileId);

      if (!profile) {
        return false;
      }

      // 🚀 TODO: [上線修改] 這裡需要實作 Supabase 同步
      // 目前暫時返回 false
      return false;

    } catch (error) {
            return false;
    }
  }
}
