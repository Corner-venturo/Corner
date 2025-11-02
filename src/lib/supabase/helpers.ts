/**
 * Supabase 型別輔助函數
 * 用於處理自動生成型別的問題
 *
 * Note: These functions intentionally use type assertions to work around
 * Supabase's complex generated types that can't always be properly inferred
 */

/**
 * 安全的 insert 輔助函數
 * 解決 Supabase insert 型別推斷為 never 的問題
 *
 * @param data - The data to insert
 * @returns The data in a format compatible with Supabase insert
 *
 * ⚠️ 必須保留 `as unknown`：
 * Supabase 自動生成的型別系統在 insert 操作時會推斷為 never[]，
 * 這是 Supabase 型別定義的已知限制，需要透過 unknown 繞過。
 * 參考：https://github.com/supabase/supabase/issues/type-inference
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeInsert<T = any>(data: T): any {
  // Type assertion needed for Supabase insert compatibility
  // DO NOT REMOVE: This is required due to Supabase's generated type limitations
  return data as unknown
}

/**
 * 安全的 update 輔助函數
 * 解決 Supabase update 型別推斷為 never 的問題
 *
 * @param data - The partial data to update
 * @returns The data in a format compatible with Supabase update
 *
 * ⚠️ 必須保留 `as unknown`：
 * Supabase 自動生成的型別系統在 update 操作時會推斷為 never[]，
 * 這是 Supabase 型別定義的已知限制，需要透過 unknown 繞過。
 * 參考：https://github.com/supabase/supabase/issues/type-inference
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeUpdate<T = any>(data: Partial<T>): any {
  // Type assertion needed for Supabase update compatibility
  // DO NOT REMOVE: This is required due to Supabase's generated type limitations
  return data as unknown
}

/**
 * 安全的資料讀取
 * 處理 Supabase 查詢結果的型別問題
 *
 * @param data - The raw data from Supabase
 * @returns The data cast to the expected type T
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeData<T = any>(data: unknown): T {
  return data as T
}
