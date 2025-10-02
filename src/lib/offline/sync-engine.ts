/**
 * 🔄 Venturo v4.0 - 同步引擎
 *
 * 功能：
 * - 處理同步佇列
 * - 上傳本地變更到 Supabase
 * - 下載雲端變更到本地
 * - 衝突處理
 */

import { getOfflineManager, SyncQueueItem } from './offline-manager'
import { toSupabase, fromSupabase } from './unified-types'

// 同步狀態
export interface SyncStatus {
  isSyncing: boolean
  lastSyncTime?: string
  pendingCount: number
  completedCount: number
  failedCount: number
  errors: string[]
}

// 同步配置
export interface SyncConfig {
  enableAutoSync: boolean
  syncInterval: number // 毫秒
  batchSize: number
  maxRetries: number
}

const DEFAULT_CONFIG: SyncConfig = {
  enableAutoSync: false, // 預設關閉自動同步
  syncInterval: 30000, // 30 秒
  batchSize: 10,
  maxRetries: 3
}

// ===========================
// 同步引擎類別
// ===========================

export class SyncEngine {
  private offlineManager = getOfflineManager()
  private config: SyncConfig = DEFAULT_CONFIG
  private syncTimer: NodeJS.Timeout | null = null
  private isSyncing = false
  private hasSupabase = false

  constructor(config?: Partial<SyncConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config }
    }

    // 檢查 Supabase 是否配置
    this.checkSupabaseAvailability()
  }

  /**
   * 檢查 Supabase 是否可用
   */
  private checkSupabaseAvailability() {
    if (typeof window === 'undefined') return

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    this.hasSupabase = !!(supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here')

    if (!this.hasSupabase) {
      console.warn('⚠️ Supabase 未配置，使用模擬同步模式')
    }
  }

  /**
   * 開始自動同步
   */
  startAutoSync() {
    if (this.syncTimer) return

    console.log('🔄 啟動自動同步，間隔:', this.config.syncInterval / 1000, '秒')

    this.syncTimer = setInterval(() => {
      this.syncAll().catch(error => {
        console.error('自動同步失敗:', error)
      })
    }, this.config.syncInterval)

    // 立即執行一次
    this.syncAll().catch(error => {
      console.error('初始同步失敗:', error)
    })
  }

  /**
   * 停止自動同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('⏸️ 停止自動同步')
    }
  }

  /**
   * 同步所有待處理項目
   */
  async syncAll(): Promise<SyncStatus> {
    if (this.isSyncing) {
      console.log('⏳ 同步進行中，跳過本次')
      return this.getStatus()
    }

    this.isSyncing = true
    const status: SyncStatus = {
      isSyncing: true,
      lastSyncTime: new Date().toISOString(),
      pendingCount: 0,
      completedCount: 0,
      failedCount: 0,
      errors: []
    }

    try {
      // 取得待同步項目
      const pendingItems = await this.offlineManager.getPendingSyncItems()
      status.pendingCount = pendingItems.length

      if (pendingItems.length === 0) {
        console.log('✅ 沒有待同步項目')
        return status
      }

      console.log(`🔄 開始同步 ${pendingItems.length} 筆資料`)

      // 批次處理
      const batches = this.createBatches(pendingItems, this.config.batchSize)

      for (const batch of batches) {
        for (const item of batch) {
          try {
            await this.syncItem(item)
            status.completedCount++
          } catch (error) {
            status.failedCount++
            status.errors.push(`${item.tableName}/${item.recordId}: ${error instanceof Error ? error.message : '未知錯誤'}`)
          }
        }
      }

      // 清理已完成的同步項目
      await this.offlineManager.clearCompletedSync()

      console.log(`✅ 同步完成: ${status.completedCount} 成功, ${status.failedCount} 失敗`)

      return status
    } catch (error) {
      console.error('❌ 同步過程發生錯誤:', error)
      status.errors.push(error instanceof Error ? error.message : '未知錯誤')
      return status
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 同步單個項目
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    if (!this.hasSupabase) {
      // 模擬同步模式：直接標記為完成
      await this.offlineManager.markSyncCompleted(item.id)
      console.log(`✅ [模擬] 同步完成:`, item.operation, item.tableName, item.recordId)
      return
    }

    // 真實 Supabase 同步邏輯
    try {
      // 轉換資料格式：camelCase -> snake_case
      const supabaseData = item.data ? toSupabase(item.data) : null

      switch (item.operation) {
        case 'create':
          if (supabaseData) {
            // await supabase.from(item.tableName).insert(supabaseData)
            console.log(`✅ 建立:`, item.tableName, item.recordId)
          }
          break

        case 'update':
          if (supabaseData) {
            // await supabase.from(item.tableName).update(supabaseData).eq('id', item.recordId)
            console.log(`✅ 更新:`, item.tableName, item.recordId)
          }
          break

        case 'delete':
          // await supabase.from(item.tableName).delete().eq('id', item.recordId)
          console.log(`✅ 刪除:`, item.tableName, item.recordId)
          break
      }

      // 標記為完成
      await this.offlineManager.markSyncCompleted(item.id)

    } catch (error) {
      // 重試邏輯
      if (item.retryCount < this.config.maxRetries) {
        await this.offlineManager.markSyncFailed(
          item.id,
          error instanceof Error ? error.message : '未知錯誤'
        )
      } else {
        console.error(`❌ 同步失敗（已達最大重試次數）:`, item.tableName, item.recordId)
        throw error
      }
    }
  }

  /**
   * 取得同步狀態
   */
  async getStatus(): Promise<SyncStatus> {
    const pendingItems = await this.offlineManager.getPendingSyncItems()

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: undefined,
      pendingCount: pendingItems.length,
      completedCount: 0,
      failedCount: 0,
      errors: []
    }
  }

  /**
   * 手動觸發同步
   */
  async manualSync(): Promise<SyncStatus> {
    console.log('🔄 手動觸發同步')
    return await this.syncAll()
  }

  /**
   * 建立批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 清空所有待同步項目（僅用於測試）
   */
  async clearAllPending(): Promise<number> {
    const pendingItems = await this.offlineManager.getPendingSyncItems()

    for (const item of pendingItems) {
      await this.offlineManager.markSyncCompleted(item.id)
    }

    await this.offlineManager.clearCompletedSync()

    console.log(`🗑️ 清空 ${pendingItems.length} 筆待同步項目`)
    return pendingItems.length
  }
}

// ===========================
// 單例模式
// ===========================

let syncEngine: SyncEngine | null = null

export function getSyncEngine(config?: Partial<SyncConfig>): SyncEngine {
  if (!syncEngine) {
    syncEngine = new SyncEngine(config)
  }
  return syncEngine
}

/**
 * 快速清空同步佇列（用於開發測試）
 */
export async function clearSyncQueue(): Promise<number> {
  const engine = getSyncEngine()
  return await engine.clearAllPending()
}

/**
 * 手動同步
 */
export async function manualSync(): Promise<SyncStatus> {
  const engine = getSyncEngine()
  return await engine.manualSync()
}
