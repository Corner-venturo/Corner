/**
 * 型別輔助工具
 *
 * 提供型別安全的轉換函數，取代散落各處的 `as unknown as T` 斷言
 */

/**
 * Supabase 查詢結果轉換為應用型別
 *
 * Supabase 自動產生的型別不包含 join/computed 欄位，
 * 所以需要型別斷言。此函數將常見的 `data as unknown as T[]`
 * 模式集中管理，方便追蹤和未來改善。
 *
 * @example
 * const tours = castArray<Tour>(data)
 */
export function castArray<T>(data: unknown): T[] {
  return (data || []) as T[]
}

/**
 * 單筆 Supabase 查詢結果轉換
 *
 * @example
 * const tour = castOne<Tour>(data)
 */
export function castOne<T>(data: unknown): T {
  return data as T
}

/**
 * 可能為 null 的單筆轉換
 */
export function castOneOrNull<T>(data: unknown): T | null {
  return (data ?? null) as T | null
}

/**
 * JSON 欄位轉換為具體型別
 *
 * Supabase 的 JSONB 欄位回傳 `Json` 型別，
 * 需要斷言成實際的結構。
 *
 * @example
 * const daily = castJson<DailyItineraryDay[]>(itinerary.daily_itinerary)
 */
export function castJson<T>(json: unknown): T {
  return json as T
}

/**
 * JSON 欄位轉換，帶預設值
 */
export function castJsonOr<T>(json: unknown, defaultValue: T): T {
  return (json ?? defaultValue) as T
}
