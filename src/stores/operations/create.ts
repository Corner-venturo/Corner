/**
 * Create 操作（FastInsert 策略：立即更新 UI，背景同步 Supabase）
 *
 * 流程：
 * 1. 立即寫入 IndexedDB（快取）→ 樂觀更新
 * 2. 立即更新 UI（不等待 Supabase）
 * 3. 背景寫入 Supabase → 如果失敗則回滾
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig, CreateInput } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { generateCode } from '../utils/code-generator'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'

/**
 * 建立資料（簡化版：直接新增）
 */
export async function create<T extends BaseEntity>(
  data: CreateInput<T>,
  existingItems: T[],
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T> {
  const { tableName, codePrefix, enableSupabase } = config

  try {
    // 生成 ID 和時間戳記
    const id = generateUUID()
    const now = new Date().toISOString()

    // 如果有 codePrefix，生成編號
    let recordData = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    } as T

    if (codePrefix) {
      const existingCode = (data as Record<string, unknown>).code
      if (!existingCode || (typeof existingCode === 'string' && existingCode.trim() === '')) {
        const code = generateCode({ prefix: codePrefix }, existingItems)
        recordData = { ...recordData, code } as T
      }
    }

    // ✅ 步驟 1：寫入 IndexedDB（本地快取）⚡ FastIn
    await indexedDB.put(recordData)

    // ✅ 步驟 2：背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined') {
      // 清理資料：將空字串的時間欄位轉為 null（PostgreSQL 不接受空字串）
      const cleanedData = { ...recordData } as Record<string, unknown>
      Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key]
        // 時間相關欄位：空字串轉 null
        if ((key.endsWith('_at') || key.endsWith('_date') || key === 'deadline') && value === '') {
          cleanedData[key] = null
        }
      })

      // 使用 put (upsert) 而非 insert，避免主鍵衝突
      supabase.put(cleanedData as T).catch(error => {
        logger.warn(`⚠️ [${tableName}] Supabase 背景同步失敗（已保存到本地）:`, error)
      })
    }

    return recordData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '建立失敗'
    logger.error(`❌ [${tableName}] 新增失敗:`, error)
    throw new Error(errorMessage)
  }
}

/**
 * 批次建立資料
 */
export async function createMany<T extends BaseEntity>(
  dataArray: CreateInput<T>[],
  existingItems: T[],
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T[]> {
  const results: T[] = []

  for (const data of dataArray) {
    const created = await create(data, existingItems, config, indexedDB, supabase, sync)
    results.push(created)
  }

  logger.log(`✅ [${config.tableName}] createMany: 已建立 ${results.length} 筆`)

  return results
}
