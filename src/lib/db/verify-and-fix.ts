/**
 * 驗證和修復工具
 *
 * 使用方式：
 * 1. 在瀏覽器 Console 執行：
 *    const { verifyAndFix } = await import('/src/lib/db/verify-and-fix')
 *    await verifyAndFix()
 *
 * 2. 或直接在任何頁面執行（已自動掛載到 window）
 */

import { localDB } from '@/lib/db';
import { Employee as User } from '@/stores/types';

export async function verifyAndFix() {

  try {
    // 1. 檢查 IndexedDB
    const users = await localDB.getAll<User>('employees');

    if (users.length > 0) {
      users.forEach(u => { [${u.status}]`);
      });
    }

    // 2. 檢查 William
    const william = users.find(u => u.employee_number === 'william01');

    if (william) {

      return { status: 'ok', user: william };
    }

    // 3. William 不存在，需要建立

    const newWilliam: User = {
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

    await localDB.create<User>('employees', newWilliam);

    // 4. 驗證建立結果
    const verify = await localDB.getAll<User>('employees');


    return { status: 'fixed', user: newWilliam };

  } catch (error) {
        return { status: 'error', error };
  }
}

/**
 * 快速檢查（不修復）
 */
export async function quickCheck() {

  try {
    const users = await localDB.getAll<User>('employees');
    const william = users.find(u => u.employee_number === 'william01');


    if (william) {
    }

    // 檢查 LocalStorage
    const authStore = localStorage.getItem('auth-storage');
    const localAuthStore = localStorage.getItem('venturo-local-auth-store');


    if (authStore) {
      const parsed = JSON.parse(authStore);
    }

    return { users, william, hasAuth: !!authStore };

  } catch (error) {
        return { error };
  }
}

/**
 * 清除並重建（謹慎使用）
 */
export async function clearAndRebuild() {
  const confirm = window.confirm(
    '⚠️ 這會刪除所有員工資料並重新建立 William 帳號。\n\n確定要繼續嗎？'
  );

  if (!confirm) {
    return;
  }


  try {
    // 清除所有員工
    await localDB.clear('employees');

    // 重新建立 William
    const result = await verifyAndFix();
    return result;

  } catch (error) {
        return { status: 'error', error };
  }
}

// 自動掛載到 window（方便 Console 使用）
if (typeof window !== 'undefined') {
  (window as unknown).verifyAndFix = verifyAndFix;
  (window as unknown).quickCheck = quickCheck;
  (window as unknown).clearAndRebuild = clearAndRebuild;

}
