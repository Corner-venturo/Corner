/**
 * 初始化本地資料庫
 * 建立所有必要的預設資料
 */

import _bcrypt from 'bcryptjs'
import { localDB } from '@/lib/db'
import { DB_NAME } from '@/lib/db/schemas'
import { generateUUID as _generateUUID } from '@/lib/utils/uuid'

/**
 * 產生 UUID（已移除，改用系統統一的 UUID 生成器）
 * 注意：此處改用 @/lib/utils/uuid 的 generateUUID
 */

/**
 * 產生編號
 */
function _generateCode(prefix: string, index: number): string {
  const year = new Date().getFullYear()
  const number = (index + 1).toString().padStart(4, '0')
  return `${prefix}${year}${number}`
}

/**
 * 初始化本地資料庫
 */
export async function initLocalDatabase(): Promise<void> {
  try {
    // 初始化 IndexedDB
    await localDB.init()

    // 檢查是否已有資料
    const employeeCount = await localDB.count('employees')

    if (employeeCount === 0) {
      // 🔄 優先從 Supabase 同步資料（如果有網路）
      const syncedFromSupabase = await syncFromSupabase()

      if (!syncedFromSupabase) {
        // Supabase 也沒資料或無網路 → 不自動建立管理員
      } else {
      }
    } else {
    }
  } catch (error) {
    throw error
  }
}

/**
 * 從 Supabase 同步資料到本地
 * @returns true 表示成功同步，false 表示無資料或失敗
 */
async function syncFromSupabase(): Promise<boolean> {
  try {
    // 檢查是否有網路
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false
    }

    const { supabase } = await import('@/lib/supabase/client')

    // 下載 employees 資料
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active')

    if (error) {
      return false
    }

    if (!employees || employees.length === 0) {
      return false
    }

    // 寫入到 IndexedDB（使用 put 允許更新現有資料）
    for (const employee of employees) {
      await localDB.put('employees', employee)
    }

    return true
  } catch (_error) {
    return false
  }
}

/**
 * 建立預設管理員（已停用）
 * 此函數已不再使用，請透過系統介面建立管理員
 */
// async function createDefaultAdmin(): Promise<void> {
//   ... 已移除
// }

/**
 * 檢查預設管理員密碼（已停用）
 * 此函數已不再使用
 */
// async function checkDefaultAdminPassword(): Promise<void> {
//   ... 已移除
// }

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
    'employees',
    'tours',
    'orders',
    'customers',
    'members',
    'payments',
    'todos',
    'visas',
    'suppliers',
    'quotes',
    'quote_items',
    'payment_requests',
    'disbursement_orders',
    'receipt_orders',
  ] as const

  for (const table of tables) {
    try {
      await localDB.clear(table)
    } catch (_error) {}
  }
}

/**
 * 匯出所有資料
 */
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  return await localDB.export()
}

/**
 * 匯入資料
 */
export async function importData(data: Record<string, unknown[]>): Promise<void> {
  await localDB.import(data)
}

// 自動初始化（在瀏覽器環境）
if (typeof window !== 'undefined') {
  // 檢查是否需要初始化
  const initKey = `${DB_NAME}-initialized`
  const needsInit = localStorage.getItem(initKey) !== 'true'

  if (needsInit) {
    initLocalDatabase()
      .then(() => {
        localStorage.setItem(initKey, 'true')
      })
      .catch(_error => {})
  }
}
