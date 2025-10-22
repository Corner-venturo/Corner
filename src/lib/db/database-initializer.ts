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
      console.log('🔍 檢查資料庫初始化狀態...');

      // 1. 檢查 users 表
      const userCount = await this.checkUsersTable();

      if (userCount === 0) {
        console.log('📦 資料庫為空，開始初始化...');
        await this.initializeDatabase();
      } else {
        console.log(`✅ 資料庫已有 ${userCount} 位使用者，無需初始化`);
      }

    } catch (error) {
      console.error('❌ 資料庫初始化失敗:', error);
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
      console.warn('⚠️ 無法檢查 employees 表:', error);
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
      console.log(`✅ 從 LocalProfile 遷移了 ${migratedCount} 位使用者`);
      return;
    }

    // Step 2: 沒有 LocalProfile，建立預設管理員
    console.log('➕ 建立預設管理員帳號...');
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
        console.log('📝 沒有找到 LocalProfile 資料');
        return 0;
      }

      const authStore = JSON.parse(authStoreRaw);
      const profiles = authStore?.state?.profiles || [];

      if (profiles.length === 0) {
        console.log('📝 LocalProfile 為空');
        return 0;
      }

      console.log(`🔄 發現 ${profiles.length} 個 LocalProfile，開始遷移...`);

      let migratedCount = 0;

      for (const profile of profiles) {
        try {
          // 將 LocalProfile 轉換為完整 User
          const user: User = {
            id: profile.id || crypto.randomUUID(),
            employee_number: profile.employee_number,
            display_name: profile.display_name || '',
            english_name: profile.english_name || '',
            permissions: profile.permissions || [],
            personal_info: {
              national_id: '',
              birthday: '',
              gender: 'male',
              phone: '',
              email: profile.email || '',
              address: '',
              emergency_contact: { name: '', relationship: '', phone: '' }
            },
            job_info: {
              department: profile.department || '未分類',
              position: profile.position || '員工',
              hire_date: new Date().toISOString(),
              employment_type: 'fulltime'
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
          console.log(`  ✅ 遷移: ${user.employee_number} - ${user.display_name}`);

        } catch (error) {
          console.warn(`  ⚠️ 遷移失敗: ${profile.employee_number}`, error);
        }
      }

      return migratedCount;

    } catch (error) {
      console.warn('⚠️ LocalProfile 遷移失敗:', error);
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
        console.log('✅ william01 已存在，跳過建立');
        return;
      }

      const adminUser: User = {
        id: crypto.randomUUID(),
        employee_number: 'william01',
        display_name: 'William Chien',
        english_name: 'William Chien',
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
          gender: 'male',
          phone: '',
          email: 'william@venturo.com',
          address: '',
          emergency_contact: { name: '', relationship: '', phone: '' }
        },
        job_info: {
          department: '管理部',
          position: '系統管理員',
          hire_date: new Date().toISOString(),
          employment_type: 'fulltime'
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
      console.log(`✅ 建立預設管理員: william01`);
      console.log(`   密碼: Venturo2025!`);
    } catch (error) {
      console.warn('⚠️ 建立預設管理員時發生錯誤:', error);
      // 不拋出錯誤，可能已經存在
    }
  }

  /**
   * 手動觸發初始化（用於測試或修復）
   */
  static async forceInitialize(): Promise<void> {
    console.log('🔧 強制初始化資料庫...');
    await this.initializeDatabase();
  }
}

// 瀏覽器環境中提供全域訪問
if (typeof window !== 'undefined') {
  (window as any).DatabaseInitializer = DatabaseInitializer;
  console.log('💡 DatabaseInitializer 已載入');
}
