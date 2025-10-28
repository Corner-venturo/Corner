/**
 * VENTURO 5.0 - 記憶體管理工具
 *
 * 核心概念：
 * - 自動清理未使用的快取
 * - 監控記憶體使用量
 * - 提供記憶體壓力警告
 * - 支援手動回收
 */

import { cacheStrategy } from '@/lib/cache/cache-strategy';

interface MemoryStats {
  /** 使用的記憶體（MB） */
  usedMemory: number;
  /** 總記憶體限制（MB） */
  totalMemory: number;
  /** 使用率（%） */
  usagePercent: number;
  /** 是否處於記憶體壓力狀態 */
  isUnderPressure: boolean;
}

interface CleanupOptions {
  /** 清理熱快取 */
  clearHot?: boolean;
  /** 清理溫快取 */
  clearWarm?: boolean;
  /** 強制清理（即使沒有壓力） */
  force?: boolean;
}

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private pressureThreshold = 0.8; // 80% 記憶體使用率視為壓力
  private autoCleanupInterval = 5 * 60 * 1000; // 5 分鐘自動清理一次
  private visibilityChangeHandler: (() => void) | null = null;

  private constructor() {
    // 啟動自動清理
    this.startAutoCleanup();

    // 監聽頁面隱藏事件（用戶切換分頁時清理）
    if (typeof window !== 'undefined') {
      this.visibilityChangeHandler = () => {
        if (document.hidden) {
          this.cleanup({ clearHot: true });
        }
      };
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 獲取記憶體統計資訊
   */
  getMemoryStats(): MemoryStats | null {
    if (typeof window === 'undefined' || !(performance as unknown).memory) {
      return null;
    }

    const memory = (performance as unknown).memory;
    const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // 轉換為 MB
    const totalMemory = memory.jsHeapSizeLimit / 1024 / 1024;
    const usagePercent = (usedMemory / totalMemory) * 100;

    return {
      usedMemory: Math.round(usedMemory * 100) / 100,
      totalMemory: Math.round(totalMemory * 100) / 100,
      usagePercent: Math.round(usagePercent * 100) / 100,
      isUnderPressure: usagePercent / 100 > this.pressureThreshold
    };
  }

  /**
   * 清理記憶體
   */
  async cleanup(options: CleanupOptions = {}): Promise<void> {
    const { clearHot = false, clearWarm = false, force = false } = options;

    // 檢查是否需要清理
    if (!force) {
      const stats = this.getMemoryStats();
      if (!stats?.isUnderPressure) {
        return; // 記憶體充足，不需清理
      }
    }


    // 清理熱快取（記憶體）
    if (clearHot) {
      await cacheStrategy.clear('hot');
    }

    // 清理溫快取（SessionStorage）
    if (clearWarm) {
      await cacheStrategy.clear('warm');
    }

    // 觸發垃圾回收（如果瀏覽器支援）
    if (typeof window !== 'undefined' && (window as unknown).gc) {
      try {
        (window as unknown).gc();
      } catch {
        // 忽略錯誤
      }
    }

    const afterStats = this.getMemoryStats();
    if (afterStats) {
    }
  }

  /**
   * 啟動自動清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanup({ clearHot: true });
    }, this.autoCleanupInterval);
  }

  /**
   * 停止自動清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 清理所有資源（記憶體洩漏防護）
   */
  destroy(): void {
    this.stopAutoCleanup();

    if (this.visibilityChangeHandler && typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * 監控記憶體（開發模式）
   */
  startMonitoring(interval: number = 10000): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const stats = this.getMemoryStats();
      if (stats) {
        const emoji = stats.isUnderPressure ? '⚠️' : '✅';
        console.log(
          `${emoji} 記憶體使用: ${stats.usedMemory} MB / ${stats.totalMemory} MB (${stats.usagePercent}%)`
        );

        if (stats.isUnderPressure) {
          console.warn('⚠️ 記憶體壓力過高，建議清理');
        }
      }
    }, interval);
  }

  /**
   * 獲取快取統計
   */
  getCacheStats() {
    return cacheStrategy.getStats();
  }
}

// 匯出單例
export const memoryManager = MemoryManager.getInstance();

// 匯出類型
export type { MemoryStats, CleanupOptions };
