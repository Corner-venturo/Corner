/**
 * 初始化員工密碼
 * 用於為現有員工資料加入預設密碼
 */

import { useUserStore, userStoreHelpers } from '@/stores/user-store';
import { PasswordUtils } from '@/lib/password-utils';
import { localDB } from '@/lib/db';
import { generateUUID } from '@/lib/utils/uuid';

// 引入正確的表名常數
import { TABLES } from '@/lib/db/schemas';

export async function initializeEmployeePasswords() {
  console.log('🔐 開始初始化員工密碼...');

  const userStore = useUserStore.getState();
  const users = userStore.items;

  if (users.length === 0) {
    console.log('⚠️ 沒有找到員工資料');
    
    // 建立預設管理員帳號
    const defaultAdminPassword = await PasswordUtils.hashPassword('admin123');
    const adminUser = {
      employee_number: 'admin',
      english_name: 'Administrator',
      display_name: '系統管理員',
      chinese_name: '系統管理員',
      password_hash: defaultAdminPassword,
      must_change_password: true,
      personal_info: {
        national_id: 'A123456789',
        birthday: '1990-01-01',
        phone: '0912-345-678',
        email: 'admin@venturo.com',
        address: '台北市信義區',
        emergency_contact: {
          name: '緊急聯絡人',
          relationship: '配偶',
          phone: '0923-456-789'
        }
      },
      job_info: {
        hire_date: new Date().toISOString().split('T')[0],
      },
      salary_info: {
        base_salary: 0,
        allowances: [],
        salary_history: []
      },
      permissions: ['admin'],
      attendance: {
        leave_records: [],
        overtime_records: []
      },
      contracts: [],
      status: 'active' as const
    };

    await userStore.create(adminUser as unknown);
    console.log('✅ 已建立預設管理員帳號');
    console.log('   帳號：admin');
    console.log('   密碼：admin123');
    console.log('   ⚠️ 請於首次登入後立即修改密碼！');

    // 同步到 IndexedDB（僅在瀏覽器環境）
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await localDB.init(); // 確保資料庫已初始化
        await localDB.put(TABLES.EMPLOYEES as unknown, {
          ...adminUser,
          id: generateUUID(),
          created_at: new Date().toISOString()
        });
        console.log('✅ 已同步到 IndexedDB');
      } catch (dbError) {
        console.warn('⚠️ IndexedDB 儲存失敗，但本地 store 已更新:', dbError);
      }
    } else {
      console.log('ℹ️ IndexedDB 不可用，僅更新本地 store');
    }

    return;
  }

  // 為現有員工設定預設密碼
  let updatedCount = 0;
  
  for (const user of users) {
    if (!user.password_hash) {
      // 生成預設密碼
      const defaultPassword = PasswordUtils.generateDefaultPassword(user.employee_number);
      const hashedPassword = await PasswordUtils.hashPassword(defaultPassword);

      // 更新員工資料
      await userStore.update(user.id, {
        password_hash: hashedPassword,
        must_change_password: true,
        last_password_change: new Date().toISOString()
      });

      // 同步到 IndexedDB（僅在瀏覽器環境）
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          await localDB.put(TABLES.EMPLOYEES as unknown, {
            ...user,
            password_hash: hashedPassword,
            must_change_password: true,
            last_password_change: new Date().toISOString()
          });
        } catch (dbError) {
          console.warn(`⚠️ IndexedDB 儲存失敗 (${user.employee_number}):`, dbError);
        }
      }

      console.log(`✅ 已為 ${user.display_name} (${user.employee_number}) 設定預設密碼`);
      console.log(`   預設密碼：${defaultPassword}`);
      
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`\n✅ 成功初始化 ${updatedCount} 位員工的密碼`);
    console.log('⚠️ 請通知員工於首次登入後修改密碼');
  } else {
    console.log('ℹ️ 所有員工都已有密碼設定');
  }
}

// 建立測試員工資料
export async function createTestEmployees() {
  console.log('🧪 建立測試員工資料...');

  const testEmployees = [
    {
      employee_number: 'john01',
      english_name: 'John',
      display_name: '約翰',
      password: 'john123',
      permissions: ['orders', 'quotes', 'customers']
    },
    {
      employee_number: 'mary01',
      english_name: 'Mary',
      display_name: '瑪麗',
      password: 'mary123',
      permissions: ['finance', 'payments']
    },
    {
      employee_number: 'peter01',
      english_name: 'Peter',
      display_name: '彼得',
      password: 'peter123',
      permissions: ['hr']
    }
  ];

  const userStore = useUserStore.getState();

  for (const emp of testEmployees) {
    // 檢查是否已存在
    const existing = userStore.items.find(u => u.employee_number === emp.employee_number);
    if (existing) {
      console.log(`⚠️ 員工 ${emp.employee_number} 已存在，跳過`);
      continue;
    }

    // 加密密碼
    const password_hash = await PasswordUtils.hashPassword(emp.password);

    // 建立員工資料
    const newEmployee = {
      employee_number: emp.employee_number,
      english_name: emp.english_name,
      display_name: emp.display_name,
      chinese_name: emp.display_name,
      password_hash,
      must_change_password: false, // 測試帳號不強制改密碼
      personal_info: {
        national_id: `TEST${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        birthday: '1990-01-01',
        phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `${emp.employee_number}@venturo.com`,
        address: '台北市',
        emergency_contact: {
          name: '緊急聯絡人',
          relationship: '家人',
          phone: '0900-000-000'
        }
      },
      job_info: {
        hire_date: new Date().toISOString().split('T')[0],
      },
      salary_info: {
        base_salary: 50000,
        allowances: [],
        salary_history: []
      },
      permissions: emp.permissions,
      attendance: {
        leave_records: [],
        overtime_records: []
      },
      contracts: [],
      status: 'active' as const
    };

    await userStore.create(newEmployee);

    // 同步到 IndexedDB（僅在瀏覽器環境）
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await localDB.init(); // 確保資料庫已初始化
        await localDB.put(TABLES.EMPLOYEES as unknown, {
          ...newEmployee,
          id: generateUUID(),
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.warn(`⚠️ IndexedDB 儲存失敗 (${emp.employee_number}):`, dbError);
      }
    }

    console.log(`✅ 已建立測試員工：${emp.display_name} (${emp.employee_number})`);
    console.log(`   密碼：${emp.password}`);
  }

  console.log('\n✅ 測試員工建立完成！');
}
