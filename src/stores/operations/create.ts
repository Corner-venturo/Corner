/**
 * Create 操作（簡化版：直接新增到 Supabase + IndexedDB）
 */

import type { BaseEntity } from '@/types';
import type { StoreConfig, CreateInput } from '../core/types';
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter } from '../adapters/supabase-adapter';
import { SyncCoordinator } from '../sync/coordinator';
import { generateCode } from '../utils/code-generator';
import { generateUUID } from '@/lib/utils/uuid';
import { logger } from '@/lib/utils/logger';

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
  const { tableName, codePrefix, enableSupabase } = config;

  try {
    // 生成 ID
    const id = generateUUID();

    // 如果有 codePrefix，生成編號
    let recordData = { ...data, id } as T;
    if (codePrefix) {
      const existingCode = (data as Record<string, unknown>).code;
      if (!existingCode || (typeof existingCode === 'string' && existingCode.trim() === '')) {
        const code = generateCode({ prefix: codePrefix }, existingItems);
        recordData = { ...recordData, code } as T;
      }
    }

    // ✅ 步驟 1：先新增到 Supabase（確保雲端同步）
    if (enableSupabase && typeof window !== 'undefined') {
      const supabaseData = await supabase.create(recordData);
      recordData = supabaseData;
    }

    // ✅ 步驟 2：寫入 IndexedDB（本地快取）
    await indexedDB.put(recordData);

    return recordData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '建立失敗';
    logger.error(`❌ [${tableName}] 新增失敗:`, error);
    throw new Error(errorMessage);
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
  const results: T[] = [];

  for (const data of dataArray) {
    const created = await create(data, existingItems, config, indexedDB, supabase, sync);
    results.push(created);
  }

  logger.log(`✅ [${config.tableName}] createMany: 已建立 ${results.length} 筆`);

  return results;
}
