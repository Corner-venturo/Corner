/**
 * 背景同步服務
 *
 * 負責處理離線時的資料同步，包括：
 * 1. TBC 編號轉換（離線建立的項目）
 * 2. 待同步的新增/修改項目
 * 3. 待刪除的項目
 *
 * 架構：同步邏輯與資料讀取分離
 */

import { supabase } from '@/lib/supabase/client';
import { localDB } from '@/lib/db';
import { TABLES, TableName } from '@/lib/db/schemas';
import { logger } from '@/lib/utils/logger';

export class BackgroundSyncService {
  private syncInProgress: Set<string> = new Set();

  /**
   * 同步單一表格的所有待處理項目
   */
  async syncTable(tableName: TableName): Promise<void> {
    // 防止重複同步
    if (this.syncInProgress.has(tableName)) {
      logger.log(`⏳ [${tableName}] 同步進行中，跳過`);
      return;
    }

    try {
      this.syncInProgress.add(tableName);
      logger.log(`🔄 [${tableName}] 開始背景同步...`);

      // 1. 同步 TBC 編號轉換
      await this.syncTbcCodes(tableName);

      // 2. 同步待上傳項目
      await this.syncPendingUpserts(tableName);

      // 3. 同步待刪除項目
      await this.syncPendingDeletes(tableName);

      logger.log(`✅ [${tableName}] 背景同步完成`);
    } catch (error) {
      logger.error(`❌ [${tableName}] 背景同步失敗:`, error);
      // 不拋出錯誤，靜默失敗
    } finally {
      this.syncInProgress.delete(tableName);
    }
  }

  /**
   * 同步所有表格
   */
  async syncAllTables(): Promise<void> {
    const tables = Object.values(TABLES);

    logger.log('🌍 開始同步所有表格...');

    // 並行同步所有表格
    await Promise.allSettled(
      tables.map(tableName => this.syncTable(tableName))
    );

    logger.log('✅ 所有表格同步完成');
  }

  /**
   * 1. 同步 TBC 編號轉換
   *
   * 將離線建立的項目（TBC 編號）轉換為正式編號
   */
  private async syncTbcCodes(tableName: TableName): Promise<void> {
    try {
      const allLocalItems = await localDB.getAll(tableName);
      const tbcItems = allLocalItems.filter((item: unknown) => {
        const typedItem = item as any;
        // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
        return typedItem.code && typedItem.code.endsWith('TBC');
      });

      if (tbcItems.length === 0) return;

      logger.log(`🔧 [${tableName}] 發現 ${tbcItems.length} 筆 TBC 編號，準備轉換...`);

      for (const item of tbcItems) {
        try {
          const typedItem = item as any;
          const itemData = { ...typedItem };
          delete itemData.code; // 移除 TBC code

          // 上傳到 Supabase（會自動生成正式編號）
          // @ts-ignore
          const { data: supabaseData, error } = await supabase.from(tableName).insert([itemData]).select().single();

          if (error) throw error;
          if (!supabaseData) throw new Error('No data returned from insert');

          // 更新 IndexedDB（用新的正式編號）
          await localDB.delete(tableName, typedItem.id);
          // @ts-ignore
          await localDB.put(tableName, {
            ...supabaseData,
            sync_status: 'synced',
            synced_at: new Date().toISOString()
          });

          logger.log(`✅ [${tableName}] TBC 編號已轉換: ${typedItem.code} → ${(supabaseData as any).code}`);
        } catch (error) {
          logger.error(`❌ [${tableName}] TBC 編號轉換失敗:`, (item as any).code, error);
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncTbcCodes 失敗:`, error);
    }
  }

  /**
   * 2. 同步待上傳項目（新增/修改）
   *
   * 同步標記為 sync_status: 'pending' 的項目
   */
  private async syncPendingUpserts(tableName: TableName): Promise<void> {
    try {
      const allLocalItems = await localDB.getAll(tableName);
      const pendingUpserts = allLocalItems.filter((item: unknown) => {
        const typedItem = item as any;
        // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
        return typedItem.sync_status === 'pending' && !(typedItem.code && typedItem.code.endsWith('TBC'));
      });

      if (pendingUpserts.length === 0) return;

      logger.log(`📤 [${tableName}] 發現 ${pendingUpserts.length} 筆待同步項目，開始上傳...`);

      for (const item of pendingUpserts) {
        try {
          const typedItem = item as any;
          // 移除同步標記欄位
          const { sync_status, synced_at, temp_code, ...syncData } = typedItem;

          // 檢查是否已存在（update）或新建（insert）
          const { data: existing } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', typedItem.id)
            .single();

          if (existing) {
            // 更新
            // @ts-ignore
            const { error } = await supabase.from(tableName).update(syncData).eq('id', typedItem.id);

            if (error) throw error;
            logger.log(`✅ [${tableName}] 更新成功: ${typedItem.id}`);
          } else {
            // 新增
            // @ts-ignore
            const { error } = await supabase.from(tableName).insert([syncData]);

            if (error) throw error;
            logger.log(`✅ [${tableName}] 新增成功: ${typedItem.id}`);
          }

          // 更新 IndexedDB（標記為已同步）
          // @ts-ignore
          await localDB.put(tableName, {
            ...(item as any),
            sync_status: 'synced',
            synced_at: new Date().toISOString()
          });
        } catch (error) {
          logger.error(`❌ [${tableName}] 同步失敗:`, (item as any).id, error);
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncPendingUpserts 失敗:`, error);
    }
  }

  /**
   * 3. 同步待刪除項目
   *
   * 處理 syncQueue 表中的刪除操作
   */
  private async syncPendingDeletes(tableName: TableName): Promise<void> {
    try {
      // 從 syncQueue 表中取得該表的刪除操作
      const allQueueItems = await localDB.getAll('syncQueue');
      const pendingDeletes = allQueueItems.filter((item: unknown) => {
        const typedItem = item as any;
        return typedItem.table_name === tableName && typedItem.operation === 'delete';
      });

      if (pendingDeletes.length === 0) return;

      logger.log(`🗑️ [${tableName}] 發現 ${pendingDeletes.length} 筆待刪除項目，開始刪除...`);

      for (const queueItem of pendingDeletes) {
        try {
          const typedItem = queueItem as any;
          // 從 Supabase 刪除
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', typedItem.record_id);

          // 刪除成功或資料已不存在，清除隊列記錄
          await localDB.delete('syncQueue', typedItem.id);

          if (error) {
            logger.warn(`⚠️ [${tableName}] Supabase 刪除失敗（已清除隊列）:`, typedItem.record_id, error);
          } else {
            logger.log(`✅ [${tableName}] 刪除成功: ${typedItem.record_id}`);
          }
        } catch (error) {
          logger.error(`❌ [${tableName}] 刪除失敗:`, (queueItem as any).record_id, error);
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncPendingDeletes 失敗:`, error);
    }
  }

  /**
   * 檢查是否有待同步項目
   */
  async hasPendingSync(tableName: TableName): Promise<boolean> {
    try {
      const allLocalItems = await localDB.getAll(tableName);
      const hasLocalPending = allLocalItems.some((item: unknown) => {
        const typedItem = item as any;
        return typedItem.sync_status === 'pending' || (typedItem.code && typedItem.code.endsWith('TBC'));
      });

      // 檢查是否有刪除隊列
      const allQueueItems = await localDB.getAll('syncQueue');
      const hasDeletePending = allQueueItems.some((item: unknown) => {
        const typedItem = item as any;
        return typedItem.table_name === tableName && typedItem.operation === 'delete';
      });

      return hasLocalPending || hasDeletePending;
    } catch (error) {
      logger.error(`❌ [${tableName}] 檢查待同步項目失敗:`, error);
      return false;
    }
  }

  /**
   * 取得待同步項目數量
   */
  async getPendingCount(tableName: TableName): Promise<number> {
    try {
      const allLocalItems = await localDB.getAll(tableName);
      const localPendingCount = allLocalItems.filter((item: unknown) => {
        const typedItem = item as any;
        return typedItem.sync_status === 'pending' || (typedItem.code && typedItem.code.endsWith('TBC'));
      }).length;

      // 計算刪除隊列數量
      const allQueueItems = await localDB.getAll('syncQueue');
      const deletePendingCount = allQueueItems.filter((item: unknown) => {
        const typedItem = item as any;
        return typedItem.table_name === tableName && typedItem.operation === 'delete';
      }).length;

      return localPendingCount + deletePendingCount;
    } catch (error) {
      logger.error(`❌ [${tableName}] 取得待同步數量失敗:`, error);
      return 0;
    }
  }
}

// 單例模式
export const backgroundSyncService = new BackgroundSyncService();
