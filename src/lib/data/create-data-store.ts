/**
 * 🏗️ Venturo v5.0 - 資料工具函數
 *
 * 功能：
 * - 提供 ID 和時間戳生成工具
 * - 簡化資料處理
 */

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return crypto.randomUUID()
}

/**
 * 生成時間戳
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString()
}
