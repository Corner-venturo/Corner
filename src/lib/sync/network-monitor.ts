/**
 * 網路狀態監聽器
 * 自動同步機制：
 * 1. 首次載入時自動檢查並同步
 * 2. 智能定期檢查（每 5 分鐘，但只在有變更時同步）
 * 3. 網路恢復時自動同步
 */

import { logger } from '@/lib/utils/logger'
import { backgroundSyncService } from './background-sync-service'

export class NetworkMonitor {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncInProgress = false
  private periodicCheckInterval: NodeJS.Timeout | null = null

  // 快取機制：記錄待同步狀態，避免重複檢查
  private lastCheckTime = 0
  private cachedHasPending = false
  private cacheValidDuration = 30000 // 快取有效期 30 秒

  // 統計資訊
  private stats = {
    totalChecks: 0,
    successfulSyncs: 0,
    skippedChecks: 0,
    failedSyncs: 0,
  }

  constructor() {
    if (typeof window !== 'undefined') {
      // 監聽網路狀態變化
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)

      logger.log(`🌐 NetworkMonitor 已啟動，當前狀態: ${this.isOnline ? '在線' : '離線'}`)

      // 首次載入時延遲 3 秒後檢查並同步（避免與頁面初始化衝突）
      setTimeout(() => {
        this.checkAndSync('首次載入')
      }, 3000)

      // 啟動定期檢查（每 5 分鐘）
      this.startPeriodicCheck()
    }
  }

  private handleOnline = async () => {
    this.isOnline = true
    logger.log('🌐 網路已連線')
    await this.checkAndSync('網路恢復')
  }

  /**
   * 檢查並同步待處理資料（智能版本）
   * @param trigger - 觸發來源（用於日誌記錄）
   * @param forceCheck - 強制檢查，忽略快取
   */
  private async checkAndSync(trigger: string, forceCheck = false): Promise<void> {
    this.stats.totalChecks++

    // 離線時跳過
    if (!this.isOnline) {
      logger.log(`⏭️ [${trigger}] 目前離線，跳過同步`)
      this.stats.skippedChecks++
      return
    }

    // 防止重複同步
    if (this.syncInProgress) {
      logger.log(`⏭️ [${trigger}] 同步已在進行中，跳過`)
      this.stats.skippedChecks++
      return
    }

    try {
      this.syncInProgress = true

      // 智能檢查：使用快取避免頻繁掃描
      const hasPending = await this.hasPendingSyncWithCache(forceCheck)

      if (!hasPending) {
        logger.log(
          `✅ [${trigger}] 無待同步資料（快取命中: ${!forceCheck && this.isCacheValid()}）`
        )
        this.stats.skippedChecks++
        return
      }

      logger.log(`🔄 [${trigger}] 發現待同步資料，開始上傳...`)

      // 上傳待同步資料
      await backgroundSyncService.syncAllTables()
      this.stats.successfulSyncs++
      logger.log(`✅ [${trigger}] 待同步資料已上傳`)

      // 清除快取（因為已完成同步）
      this.invalidateCache()

      // 通知所有 Store 重新載入資料
      logger.log('📥 觸發資料重新載入...')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('venturo:sync-completed'))
      }

      logger.log(`✅ [${trigger}] 同步完成`)
    } catch (err) {
      this.stats.failedSyncs++
      logger.warn(`⚠️ [${trigger}] 同步失敗:`, err)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(): boolean {
    const now = Date.now()
    return now - this.lastCheckTime < this.cacheValidDuration
  }

  /**
   * 清除快取
   */
  private invalidateCache(): void {
    this.lastCheckTime = 0
    this.cachedHasPending = false
  }

  /**
   * 智能檢查待同步資料（帶快取）
   */
  private async hasPendingSyncWithCache(forceCheck = false): Promise<boolean> {
    // 如果快取有效且不是強制檢查，直接返回快取結果
    if (!forceCheck && this.isCacheValid()) {
      return this.cachedHasPending
    }

    // 執行實際檢查
    const hasPending = await this.hasPendingSync()

    // 更新快取
    this.lastCheckTime = Date.now()
    this.cachedHasPending = hasPending

    return hasPending
  }

  /**
   * 檢查是否有待同步資料（實際掃描）
   */
  private async hasPendingSync(): Promise<boolean> {
    try {
      // 檢查 IndexedDB 是否有 _needs_sync: true 的資料
      const { localDB } = await import('@/lib/db')
      const { TABLES } = await import('@/lib/db/schemas')

      // 檢查所有表格
      for (const tableName of Object.values(TABLES)) {
        try {
          const items = await localDB.getAll(tableName)
          // 檢查是否有待同步的項目（包含 TBC、_needs_sync、_deleted）
          const hasPending = items.some((item: any) => {
            return (
              item._needs_sync === true ||
              (item.code && String(item.code).startsWith('TBC')) ||
              item._deleted === true
            )
          })
          if (hasPending) {
            logger.log(`🔍 發現待同步資料於表格: ${tableName}`)
            return true
          }
        } catch {
          // 表格不存在或讀取失敗，跳過
          continue
        }
      }

      return false
    } catch {
      return false
    }
  }

  private handleOffline = () => {
    this.isOnline = false
    logger.log('📴 網路已斷線 - 切換到離線模式')
  }

  /**
   * 啟動定期檢查（每 5 分鐘）
   */
  private startPeriodicCheck(): void {
    // 每 5 分鐘檢查一次
    this.periodicCheckInterval = setInterval(
      () => {
        this.checkAndSync('定期檢查')
      },
      5 * 60 * 1000
    ) // 5 分鐘

    logger.log('⏰ 定期檢查已啟動（每 5 分鐘）')
  }

  /**
   * 取得當前網路狀態
   */
  public getStatus(): boolean {
    return this.isOnline
  }

  /**
   * 手動觸發同步（例如使用者按重新整理按鈕）
   */
  public async triggerSync(): Promise<void> {
    // 手動觸發時強制檢查，忽略快取
    await this.checkAndSync('手動觸發', true)
  }

  /**
   * 標記有資料變更（用於 Store 呼叫）
   * 當有新增/修改/刪除操作時，清除快取
   */
  public markDataChanged(): void {
    this.invalidateCache()
    logger.log('🔄 資料已變更，快取已清除')
  }

  /**
   * 取得同步統計資訊
   */
  public getStats() {
    return {
      ...this.stats,
      cacheHitRate:
        this.stats.totalChecks > 0
          ? ((this.stats.skippedChecks / this.stats.totalChecks) * 100).toFixed(1) + '%'
          : '0%',
    }
  }

  /**
   * 清理事件監聽器
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)

      // 清理定期檢查
      if (this.periodicCheckInterval) {
        clearInterval(this.periodicCheckInterval)
        this.periodicCheckInterval = null
      }

      logger.log('🔌 NetworkMonitor 已停止')
    }
  }
}

// 單例模式：全域只有一個實例
export const networkMonitor = typeof window !== 'undefined' ? new NetworkMonitor() : null
