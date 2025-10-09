/**
 * Supabase 型別輔助函數
 * 用於處理自動生成型別的問題
 */

/**
 * 安全的 insert 輔助函數
 * 解決 Supabase insert 型別推斷為 never 的問題
 */
export function safeInsert<T = any>(data: T): any {
  return data as any;
}

/**
 * 安全的 update 輔助函數
 * 解決 Supabase update 型別推斷為 never 的問題
 */
export function safeUpdate<T = any>(data: Partial<T>): any {
  return data as any;
}

/**
 * 安全的資料讀取
 * 處理 Supabase 查詢結果的型別問題
 */
export function safeData<T = any>(data: unknown): T {
  return data as T;
}
