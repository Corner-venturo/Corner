/**
 * IndexedDB 本地資料庫管理器（型別安全版本）
 * 提供完整的 CRUD 操作和查詢功能
 */

// 匯出核心類別
export { LocalDatabase } from './database'

// 匯出型別
export type { TableName } from './schemas'
export type { QueryOptions, FilterCondition, WithTimestamps } from './types'

// 匯出單例實例
import { LocalDatabase } from './database'
export const localDB = new LocalDatabase()
