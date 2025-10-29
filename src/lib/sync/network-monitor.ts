/**
 * 網路狀態監聽器
 * 自動同步機制：
 * 1. 首次載入時自動檢查並同步
 * 2. 定期檢查（每 5 分鐘）
 * 3. 網路恢復時自動同步
 */

import { logger } from '@/lib/utils/logger';
import { backgroundSyncService } from './background-sync-service';

export class NetworkMonitor {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;
  private periodicCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // 監聽網路狀態變化
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      logger.log(`🌐 NetworkMonitor 已啟動，當前狀態: ${this.isOnline ? '在線' : '離線'}`);

      // 首次載入時延遲 3 秒後檢查並同步（避免與頁面初始化衝突）
      setTimeout(() => {
        this.checkAndSync('首次載入');
      }, 3000);

      // 啟動定期檢查（每 5 分鐘）
      this.startPeriodicCheck();
    }
  }

  private handleOnline = async () => {
    this.isOnline = true;
    logger.log('🌐 網路已連線');
    await this.checkAndSync('網路恢復');
  };

  /**
   * 檢查並同步待處理資料
   * @param trigger - 觸發來源（用於日誌記錄）
   */
  private async checkAndSync(trigger: string): Promise<void> {
    // 離線時跳過
    if (!this.isOnline) {
      logger.log(`⏭️ [${trigger}] 目前離線，跳過同步`);
      return;
    }

    // 防止重複同步
    if (this.syncInProgress) {
      logger.log(`⏭️ [${trigger}] 同步已在進行中，跳過`);
      return;
    }

    try {
      this.syncInProgress = true;
      logger.log(`🔄 [${trigger}] 開始檢查待同步資料...`);

      // 檢查是否有待同步資料
      const hasPending = await this.hasPendingSync();

      if (!hasPending) {
        logger.log(`✅ [${trigger}] 無待同步資料`);
        return;
      }

      logger.log(`📤 [${trigger}] 發現待同步資料，開始上傳...`);

      // 上傳待同步資料
      await backgroundSyncService.syncAllTables();
      logger.log(`✅ [${trigger}] 待同步資料已上傳`);

      // 通知所有 Store 重新載入資料
      logger.log('📥 觸發資料重新載入...');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('venturo:sync-completed'));
      }

      logger.log(`✅ [${trigger}] 同步完成`);
    } catch (err) {
      logger.warn(`⚠️ [${trigger}] 同步失敗:`, err);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 檢查是否有待同步資料
   */
  private async hasPendingSync(): Promise<boolean> {
    try {
      // 檢查 IndexedDB 是否有 _needs_sync: true 的資料
      const { localDB } = await import('@/lib/db');
      const { TABLES } = await import('@/lib/db/schemas');

      // 檢查所有表格
      for (const tableName of Object.values(TABLES)) {
        try {
          const items = await localDB.getAll(tableName);
          // 檢查是否有待同步的項目
          const hasPending = items.some((item: any) => item._needs_sync === true);
          if (hasPending) {
            return true;
          }
        } catch {
          // 表格不存在或讀取失敗，跳過
          continue;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private handleOffline = () => {
    this.isOnline = false;
    logger.log('📴 網路已斷線 - 切換到離線模式');
  };

  /**
   * 啟動定期檢查（每 5 分鐘）
   */
  private startPeriodicCheck(): void {
    // 每 5 分鐘檢查一次
    this.periodicCheckInterval = setInterval(() => {
      this.checkAndSync('定期檢查');
    }, 5 * 60 * 1000); // 5 分鐘

    logger.log('⏰ 定期檢查已啟動（每 5 分鐘）');
  }

  /**
   * 取得當前網路狀態
   */
  public getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * 手動觸發同步（例如使用者按重新整理按鈕）
   */
  public async triggerSync(): Promise<void> {
    await this.checkAndSync('手動觸發');
  }

  /**
   * 清理事件監聽器
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      // 清理定期檢查
      if (this.periodicCheckInterval) {
        clearInterval(this.periodicCheckInterval);
        this.periodicCheckInterval = null;
      }

      logger.log('🔌 NetworkMonitor 已停止');
    }
  }
}

// 單例模式：全域只有一個實例
export const networkMonitor = typeof window !== 'undefined' ? new NetworkMonitor() : null;
