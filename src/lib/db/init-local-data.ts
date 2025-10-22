/**
 * 初始化本地資料庫
 * 建立所有必要的預設資料
 */

import bcrypt from 'bcryptjs';
import { localDB } from '@/lib/db';
import { DB_NAME } from '@/lib/db/schemas';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * 產生 UUID（已移除，改用系統統一的 UUID 生成器）
 * 注意：此處改用 @/lib/utils/uuid 的 generateUUID
 */

/**
 * 產生編號
 */
function generateCode(prefix: string, index: number): string {
  const year = new Date().getFullYear();
  const number = (index + 1).toString().padStart(4, '0');
  return `${prefix}${year}${number}`;
}

/**
 * 初始化本地資料庫
 */
export async function initLocalDatabase(): Promise<void> {
  console.log('🔧 初始化本地資料庫...');

  try {
    // 初始化 IndexedDB
    await localDB.init();
    console.log('✅ IndexedDB 已初始化');

    // 檢查是否已有資料
    const employeeCount = await localDB.count('employees');

    if (employeeCount === 0) {
      console.log('📝 建立預設管理員...');

      // 只建立預設管理員（william01）
      await createDefaultAdmin();

      console.log('✅ 預設管理員建立完成');
      console.log('💡 其他資料請透過系統介面新增');
    } else {
      console.log('✅ 資料庫已有資料，跳過初始化');

      // 檢查預設管理員是否有密碼
      await checkDefaultAdminPassword();
    }
  } catch (error) {
    console.error('❌ 初始化資料庫失敗:', error);
    throw error;
  }
}

/**
 * 建立預設管理員
 */
async function createDefaultAdmin(): Promise<void> {
  const hashedPassword = await bcrypt.hash('Venturo2025!', 10);

  const adminData = {
    id: generateUUID(),
    employee_number: 'william01',
    english_name: 'William',
    display_name: '威廉',
    password_hash: hashedPassword,
    permissions: ['admin'], // 只要 admin 權限，移除 super_admin
    personal_info: {
      national_id: '',
      birthday: '1990-01-01',
      gender: 'male',
      phone: '',
      email: 'william@venturo.local',
      address: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    job_info: {
      department: 'Management',
      position: 'Administrator',
      supervisor: '',
      hire_date: new Date().toISOString().split('T')[0],
      probation_end_date: '',
      employment_type: 'fulltime'
    },
    salary_info: {
      base_salary: 0,
      allowances: [],
      salary_history: [{
        effective_date: new Date().toISOString().split('T')[0],
        base_salary: 0,
        reason: '初始設定'
      }]
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

  // 同步到 Supabase + IndexedDB
  try {
    console.log('☁️ 同步管理員資料到 Supabase...');
    const { supabase } = await import('@/lib/supabase/client');

    const result: any = await (supabase as any)
      .from('employees')
      .insert([adminData]);

    const { error } = result;

    if (error) {
      console.error('❌ Supabase 同步失敗:', error);
      console.log('💾 改為只儲存到 IndexedDB');
      await localDB.create('employees', adminData);
    } else {
      console.log('✅ Supabase 同步成功');
      // 同步到 IndexedDB
      await localDB.create('employees', adminData);
      console.log('✅ IndexedDB 快取成功');
    }
  } catch (error) {
    console.error('⚠️ 同步失敗，僅儲存到 IndexedDB:', error);
    await localDB.create('employees', adminData);
  }

  console.log('✅ 管理員已建立 (william01 / Venturo2025!)');
}

/**
 * 檢查預設管理員密碼
 */
async function checkDefaultAdminPassword(): Promise<void> {
  const admins = await localDB.filter('employees', [
    { field: 'employee_number', operator: 'eq', value: 'william01' }
  ]);
  
  if (admins.length > 0 && !(admins[0] as any).password_hash) {
    // 如果沒有密碼，設定預設密碼
    const hashedPassword = await bcrypt.hash('Venturo2025!', 10);
    await localDB.update('employees', (admins[0] as any).id, {
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    } as any);
    console.log('✅ 已為預設管理員設定密碼');
  }
}


// ========================================
// 測試資料函數已移除
// 根據 STORE_UNIFICATION_FINAL.md 定案：
// - 只保留 william01 管理員帳號
// - 其他資料透過系統介面新增
// ========================================

/**
 * 清空所有資料（危險操作）
 */
export async function clearAllData(): Promise<void> {
  const tables = [
    'employees', 'tours', 'orders', 'customers',
    'members', 'payments', 'todos', 'visas',
    'suppliers', 'quotes', 'quote_items',
    'payment_requests', 'disbursement_orders', 'receipt_orders'
  ];
  
  for (const table of tables) {
    try {
      await localDB.clear(table as any);
      console.log(`✅ 已清空 ${table} 表`);
    } catch (error) {
      console.error(`❌ 清空 ${table} 表失敗:`, error);
    }
  }
}

/**
 * 匯出所有資料
 */
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  return await localDB.export();
}

/**
 * 匯入資料
 */
export async function importData(data: Record<string, unknown[]>): Promise<void> {
  await localDB.import(data);
}

// 自動初始化（在瀏覽器環境）
if (typeof window !== 'undefined') {
  // 檢查是否需要初始化
  const initKey = `${DB_NAME}-initialized`;
  const needsInit = localStorage.getItem(initKey) !== 'true';

  if (needsInit) {
    initLocalDatabase().then(() => {
      localStorage.setItem(initKey, 'true');
    }).catch(error => {
      console.error('自動初始化失敗:', error);
    });
  }
}
