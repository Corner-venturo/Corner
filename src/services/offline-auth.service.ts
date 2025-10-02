import { verifyPassword } from '@/lib/auth';
import {
  useLocalAuthStore,
  LocalProfile,
  PasswordEncryption
} from '@/lib/auth/local-auth-manager';
import { useOfflineStore } from '@/lib/offline/sync-manager';

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
      console.log('🔐 純本地登入驗證...');
      console.log('輸入的帳號:', email);

      // ⚠️ 純本地模式 - 不使用 Supabase
      // 建立測試帳號資料
      const testUsers: Record<string, { password: string; data: any }> = {
        'admin': {
          password: 'admin123',
          data: {
            id: 'admin-001',
            employee_number: 'admin',
            chinese_name: '管理員',
            english_name: 'Admin',
            permissions: ['super_admin', 'admin'],
            status: 'active' as const
          }
        },
        'william01': {
          password: '123456',
          data: {
            id: 'william-001',
            employee_number: 'william01',
            chinese_name: '威廉',
            english_name: 'William',
            permissions: ['admin'],
            status: 'active' as const
          }
        },
        'test': {
          password: 'test',
          data: {
            id: 'test-001',
            employee_number: 'test',
            chinese_name: '測試員工',
            english_name: 'Test',
            permissions: [],
            status: 'active' as const
          }
        }
      };

      // 1. 檢查測試帳號
      const user = testUsers[email.toLowerCase()];

      if (!user) {
        return {
          success: false,
          message: '用戶名稱或密碼錯誤'
        };
      }

      // 2. 驗證密碼
      if (password !== user.password) {
        return {
          success: false,
          message: '用戶名稱或密碼錯誤'
        };
      }

      const employee = user.data;

      // 3. 建立本地 Profile
      console.log('開始加密密碼...');
      let encryptedPassword;
      try {
        encryptedPassword = await PasswordEncryption.encrypt(password);
        console.log('密碼加密成功');
      } catch (encErr) {
        console.error('密碼加密失敗:', encErr);
        throw encErr;
      }

      const profile: LocalProfile = {
        id: employee.id,
        email: employee.employee_number + '@venturo.local',
        employeeNumber: employee.employee_number,
        chineseName: employee.chinese_name,
        englishName: employee.english_name,
        role: this.determineRole(employee.permissions),
        permissions: employee.permissions || [],
        cachedPassword: encryptedPassword,
        personalInfo: employee.personal_info,
        jobInfo: employee.job_info,
        salaryInfo: employee.salary_info,
        contracts: employee.contracts,
        attendance: employee.attendance,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: employee.status
      };

      // 4. 儲存到本地
      console.log('準備儲存 Profile:', profile);
      try {
        useLocalAuthStore.getState().addProfile(profile);
        console.log('Profile 已加入');
        useLocalAuthStore.getState().setCurrentProfile(profile);
        console.log('Profile 已設為當前');
      } catch (storeErr) {
        console.error('儲存 Profile 失敗:', storeErr);
        throw storeErr;
      }

      console.log('✅ Profile 已建立並儲存到本地');

      return { success: true, profile };

    } catch (error) {
      console.error('初次登入失敗:', error);
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

      console.log('✅ 離線登入成功');

      // 背景嘗試刷新 Supabase session
      if (useOfflineStore.getState().isOnline && profile.cachedPassword) {
        this.refreshSupabaseSession(profile).catch(console.error);
      }

      return { success: true, profile };

    } catch (error) {
      console.error('離線登入失敗:', error);
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

      console.log('✅ PIN 碼設定成功');
      return true;

    } catch (error) {
      console.error('設定 PIN 碼失敗:', error);
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
        console.error('找不到 Profile:', profileId);
        return false;
      }

      useLocalAuthStore.getState().setCurrentProfile(profile);
      console.log('✅ 已切換到:', profile.chineseName);

      // 背景刷新 session
      if (useOfflineStore.getState().isOnline && profile.cachedPassword) {
        this.refreshSupabaseSession(profile).catch(console.error);
      }

      return true;

    } catch (error) {
      console.error('切換角色失敗:', error);
      return false;
    }
  }

  /**
   * 登出
   */
  static logout(): void {
    useLocalAuthStore.getState().setCurrentProfile(null);
    console.log('✅ 已登出');
  }

  /**
   * 背景刷新（純本地模式 - 已停用）
   */
  private static async refreshSupabaseSession(profile: LocalProfile): Promise<void> {
    console.log('📦 本地模式：無需刷新 session');
  }

  /**
   * 判斷用戶角色
   */
  private static determineRole(permissions: string[]): 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' {
    if (permissions?.includes('super_admin')) return 'SUPER_ADMIN';
    if (permissions?.includes('admin')) return 'ADMIN';
    return 'EMPLOYEE';
  }

  /**
   * 同步本地 Profile 與遠端
   */
  static async syncProfile(profileId: string): Promise<boolean> {
    try {
      const isOnline = useOfflineStore.getState().isOnline;

      if (!isOnline) {
        console.log('離線狀態，無法同步');
        return false;
      }

      const profile = useLocalAuthStore.getState().getProfileById(profileId);

      if (!profile) {
        return false;
      }

      // 從遠端獲取最新資料
      const { data: employee, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', profile.id)
        .is('deleted_at', null)
        .single();

      if (error || !employee) {
        console.error('無法同步 Profile:', error);
        return false;
      }

      // 更新本地 Profile
      useLocalAuthStore.getState().updateProfile(profileId, {
        permissions: employee.permissions,
        personalInfo: employee.personal_info,
        jobInfo: employee.job_info,
        salaryInfo: employee.salary_info,
        contracts: employee.contracts,
        attendance: employee.attendance,
        status: employee.status,
        lastSyncAt: new Date().toISOString()
      });

      console.log('✅ Profile 已同步');
      return true;

    } catch (error) {
      console.error('同步失敗:', error);
      return false;
    }
  }
}
