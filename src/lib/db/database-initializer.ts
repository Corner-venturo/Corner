/**
 * 資料庫初始化系統
 *
 * 確保 IndexedDB 在應用啟動時有必要的資料
 * 處理從舊版 LocalProfile 遷移到新版 IndexedDB
 */

import { localDB } from '@/lib/db';
import { Employee as User } from '@/stores/types';

export class DatabaseInitializer {
  /**
   * 主入口：確保資料庫已初始化
   */
  static async ensureInitialized(): Promise<void> {
    try {

      // 1. 檢查 users 表
      const userCount = await this.checkUsersTable();

      if (userCount === 0) {
        await this.initializeDatabase();
      } else {
      }

    } catch (error) {
            // 不拋出錯誤，讓應用繼續運行
    }
  }

  /**
   * 檢查 employees 表狀態
   */
  private static async checkUsersTable(): Promise<number> {
    try {
      const users = await localDB.getAll<User>('employees');
      return Array.isArray(users) ? users.length : 0;
    } catch (error) {
            return 0;
    }
  }

  /**
   * 初始化資料庫
   *
   * 優先順序：
   * 1. 嘗試從 LocalProfile 遷移
   * 2. 如果沒有 LocalProfile，建立預設管理員
   */
  private static async initializeDatabase(): Promise<void> {
    // Step 1: 嘗試從 LocalProfile 遷移
    const migratedCount = await this.migrateFromLocalProfile();

    if (migratedCount > 0) {
      return;
    }

    // Step 2: 沒有 LocalProfile，建立預設管理員
    await this.createDefaultAdmin();
  }

  /**
   * 從 LocalProfile (localStorage) 遷移到 IndexedDB
   */
  private static async migrateFromLocalProfile(): Promise<number> {
    try {
      // 讀取 localStorage 中的 LocalProfile
      const authStoreRaw = localStorage.getItem('venturo-local-auth-store');
      if (!authStoreRaw) {
        return 0;
      }

      const authStore = JSON.parse(authStoreRaw);
      const profiles = authStore?.state?.profiles || [];

      if (profiles.length === 0) {
        return 0;
      }


      let migratedCount = 0;

      for (const profile of profiles) {
        try {
          // 將 LocalProfile 轉換為完整 User
          const user: User = {
            id: profile.id || crypto.randomUUID(),
            employee_number: profile.employee_number,
            display_name: profile.display_name || '',
            english_name: profile.english_name || '',
            chinese_name: profile.display_name || '',
            permissions: profile.permissions || [],
            personal_info: {
              national_id: '',
              birthday: '',
              phone: '',
              email: profile.email || '',
              address: '',
              emergency_contact: { name: '', relationship: '', phone: '' }
            },
            job_info: {
              hire_date: new Date().toISOString()
            },
            salary_info: {
              base_salary: 0,
              allowances: [],
              salary_history: []
            },
            attendance: {
              leave_records: [],
              overtime_records: []
            },
            contracts: [],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await localDB.create<User>('employees', user);
          migratedCount++;

        } catch (error) {
                  }
      }

      return migratedCount;

    } catch (error) {
            return 0;
    }
  }

  /**
   * 建立預設管理員帳號 (William)
   */
  private static async createDefaultAdmin(): Promise<void> {
    try {
      // 先檢查是否已經存在
      const existing = await localDB.getAll<User>('employees');
      const hasWilliam = existing?.some(u => u.employee_number === 'william01');

      if (hasWilliam) {
        return;
      }

      const adminUser: User = {
        id: crypto.randomUUID(),
        employee_number: 'william01',
        display_name: 'William Chien',
        english_name: 'William Chien',
        chinese_name: '簡威廉',
        permissions: [
          'super_admin',
          'admin',
          'tours',
          'orders',
          'quotes',
          'finance',
          'hr',
          'database',
          'reports',
          'settings'
        ],
        personal_info: {
          national_id: '',
          birthday: '',
          phone: '',
          email: 'william@venturo.com',
          address: '',
          emergency_contact: { name: '', relationship: '', phone: '' }
        },
        job_info: {
          hire_date: new Date().toISOString()
        },
        salary_info: {
          base_salary: 0,
          allowances: [],
          salary_history: []
        },
        attendance: {
          leave_records: [],
          overtime_records: []
        },
        contracts: [],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await localDB.create<User>('employees', adminUser);
    } catch (error) {
            // 不拋出錯誤，可能已經存在
    }
  }

  /**
   * 手動觸發初始化（用於測試或修復）
   */
  static async forceInitialize(): Promise<void> {
    await this.initializeDatabase();
  }
}

// 瀏覽器環境中提供全域訪問
if (typeof window !== 'undefined') {
  (window as unknown).DatabaseInitializer = DatabaseInitializer;
}
