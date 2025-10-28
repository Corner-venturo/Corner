/**
 * 同步狀態服務（FastIn 架構版本）
 * 提供針對單一表的同步狀態檢查
 */

import { localDB, type TableName } from '@/lib/db';
import { TABLES } from '@/lib/db/schemas';
import { useState, useCallback } from 'react';

/**
 * 檢查指定表的待同步項目數量
 * @param tableName - 表名稱
 * @returns 待同步項目數量
 */
export async function checkPendingCount(tableName: TableName): Promise<number> {
  try {
    const items = await localDB.getAll(tableName);
    const pending = items.filter((item) =>
      item._needs_sync === true ||
      (item.code && item.code.endsWith('TBC'))
    );
    return pending.length;
  } catch (_error) {
    return 0;
  }
}

/**
 * 檢查當前是否在線
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * 同步狀態 Hook
 * 用於 React 組件中獲取同步狀態
 */
export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const updateStatus = useCallback(async () => {
    setOnline(isOnline());

    try {
      // 檢查所有表的待同步數量（動態讀取 TABLES）
      const tables = Object.values(TABLES);
      let total = 0;
      for (const table of tables) {
        const count = await checkPendingCount(table);
        total += count;
      }
      setPendingCount(total);
      setLastSyncTime(new Date());
    } catch (_error) {
          }
  }, []);

  return {
    pendingCount,
    isOnline: online,
    lastSyncTime,
    updateStatus
  };
}
