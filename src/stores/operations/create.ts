/**
 * Create 操作
 * 負責新增資料（FastIn 模式：本地先寫入 → 背景同步）
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig, CreateInput } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { generateCode } from '../utils/code-generator'
import { generateUUID } from '@/lib/utils/uuid'
import { isSyncableTable } from '@/lib/db/sync-schema-helper'
import { withSyncFields } from '@/lib/db/sync-utils'
import { logger } from '@/lib/utils/logger'

/**
 * 建立資料（FastIn 模式）
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
    // 生成 ID
    const id = generateUUID()

    // 如果有 codePrefix，生成編號
    let recordData = { ...data, id } as T
    if (codePrefix) {
      const existingCode = (data as Record<string, unknown>).code
      // 如果沒有 code 或 code 為空字串，直接生成正式編號
      if (!existingCode || (typeof existingCode === 'string' && existingCode.trim() === '')) {
        // 直接生成正式編號（例如：Q20250001）
        const code = generateCode({ prefix: codePrefix }, existingItems)
        recordData = { ...recordData, code } as T
        logger.log(`✨ [${tableName}] 生成編號: ${code}`)
      } else {
        // 使用自訂編號（如置頂範本的 JP-BASIC）
        logger.log(`✨ [${tableName}] 使用自訂編號: ${existingCode}`)
      }
    }

    // 檢查是否為可同步表
    const needsSyncFields = isSyncableTable(tableName)

    // FastIn Step 1: 立即寫入 IndexedDB
    recordData = needsSyncFields
      ? (withSyncFields(recordData, false) as T) // _needs_sync: true
      : recordData

    await indexedDB.put(recordData)
    logger.log(`💾 [${tableName}] FastIn: 已寫入本地 IndexedDB`)

    // FastIn Step 2: 背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined' && needsSyncFields) {
      setTimeout(async () => {
        try {
          logger.log(`☁️ [${tableName}] FastIn: 開始背景同步...`)
          await sync.uploadLocalChanges()
          logger.log(`✅ [${tableName}] FastIn: 背景同步完成`)
        } catch (syncError) {
          logger.warn(`⚠️ [${tableName}] FastIn: 背景同步失敗（不影響本地資料）`, syncError)
        }
      }, 0)
    }

    return recordData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '建立失敗'
    logger.error(`❌ [${tableName}] create 失敗:`, error)
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
