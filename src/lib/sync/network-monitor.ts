/**
 * 網路狀態監聽器
 * 當網路恢復時自動觸發背景同步
 */

import { logger } from '@/lib/utils/logger';
import { backgroundSyncService } from './background-sync-service';

export class NetworkMonitor {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      logger.log(`🌐 NetworkMonitor 已啟動，當前狀態: ${this.isOnline ? '在線' : '離線'}`);
    }
  }

  private handleOnline = async () => {
    this.isOnline = true;
    logger.log('🌐 網路已連線');

    // 防止重複同步
    if (this.syncInProgress) {
      logger.log('⏭️ 同步已在進行中，跳過');
      return;
    }

    try {
      this.syncInProgress = true;
      logger.log('🔄 開始背景同步所有待處理資料...');

      // Step 1: 上傳待同步資料
      await backgroundSyncService.syncAllTables();
      logger.log('✅ 待同步資料已上傳');

      // Step 2: 通知所有 Store 重新載入資料
      logger.log('📥 觸發資料重新載入...');
      if (typeof window !== 'undefined') {
        // 發出自訂事件，讓各 Store 重新載入
        window.dispatchEvent(new CustomEvent('venturo:sync-completed'));
      }

      logger.log('✅ 背景同步完成');
    } catch (err) {
      logger.warn('⚠️ 背景同步失敗:', err);
    } finally {
      this.syncInProgress = false;
    }
  };

  private handleOffline = () => {
    this.isOnline = false;
    logger.log('📴 網路已斷線 - 切換到離線模式');
  };

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
    if (!this.isOnline) {
      logger.warn('⚠️ 目前離線，無法同步');
      return;
    }

    if (this.syncInProgress) {
      logger.warn('⏭️ 同步已在進行中');
      return;
    }

    await this.handleOnline();
  }

  /**
   * 清理事件監聽器
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      logger.log('🔌 NetworkMonitor 已停止');
    }
  }
}

// 單例模式：全域只有一個實例
export const networkMonitor = typeof window !== 'undefined' ? new NetworkMonitor() : null;
