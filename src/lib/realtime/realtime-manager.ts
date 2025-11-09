/**
 * Supabase Realtime 統一管理器
 * 負責管理所有 Realtime 訂閱的生命週期
 */

import { supabase } from '@/lib/supabase/client'
import type {
  RealtimeSubscriptionConfig,
  RealtimeManagerConfig,
  SubscriptionState,
  RealtimeStatus,
  PostgresChangesPayload,
} from './types'

class RealtimeManager {
  private subscriptions = new Map<string, SubscriptionState>()
  private config: Required<RealtimeManagerConfig>

  constructor(config: RealtimeManagerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      autoReconnect: config.autoReconnect ?? true,
      maxRetries: config.maxRetries ?? 5,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? false,
    }

    this.log('Realtime Manager initialized', this.config)
  }

  /**
   * 訂閱資料表變更
   */
  subscribe<T = unknown>(config: RealtimeSubscriptionConfig<T>): string {
    if (!this.config.enabled) {
      this.log('Realtime is disabled, skipping subscription')
      return ''
    }

    const subscriptionId = config.subscriptionId || `${config.table}-${Date.now()}`

    // 防止重複訂閱
    if (this.subscriptions.has(subscriptionId)) {
      this.log(`Subscription ${subscriptionId} already exists`)
      return subscriptionId
    }

    this.log(`Creating subscription: ${subscriptionId}`, config)

    // 創建訂閱狀態
    const state: SubscriptionState = {
      id: subscriptionId,
      table: config.table,
      status: 'connecting',
      channel: null,
      error: null,
      retryCount: 0,
      lastConnectedAt: null,
    }

    this.subscriptions.set(subscriptionId, state)

    // 建立 Realtime 連線
    this.createChannel(subscriptionId, config)

    return subscriptionId
  }

  /**
   * 取消訂閱
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) {
      this.log(`Subscription ${subscriptionId} not found`)
      return
    }

    this.log(`Unsubscribing: ${subscriptionId}`)

    if (state.channel) {
      await supabase.removeChannel(state.channel)
    }

    this.subscriptions.delete(subscriptionId)
  }

  /**
   * 取消所有訂閱
   */
  async unsubscribeAll(): Promise<void> {
    this.log('Unsubscribing all channels')

    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(id =>
      this.unsubscribe(id)
    )

    await Promise.all(unsubscribePromises)
  }

  /**
   * 取得訂閱狀態
   */
  getSubscriptionState(subscriptionId: string): SubscriptionState | null {
    return this.subscriptions.get(subscriptionId) || null
  }

  /**
   * 取得所有訂閱狀態
   */
  getAllSubscriptions(): SubscriptionState[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * 創建 Realtime Channel
   */
  private createChannel<T>(subscriptionId: string, config: RealtimeSubscriptionConfig<T>): void {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) return

    try {
      // 創建唯一的 channel 名稱
      const channelName = `realtime:${config.table}:${subscriptionId}`
      const channel = supabase.channel(channelName)

      // 設定 Postgres 變更監聽
      channel.on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload: PostgresChangesPayload<T>) => {
          this.handleRealtimeChange(subscriptionId, config, payload)
        }
      )

      // 訂閱並處理狀態變更
      channel.subscribe(status => {
        this.handleSubscriptionStatus(subscriptionId, status)
      })

      // 更新狀態
      state.channel = channel
      this.updateSubscriptionState(subscriptionId, { channel })
    } catch (error) {
      this.handleError(subscriptionId, error as Error)
    }
  }

  /**
   * 處理 Realtime 變更事件
   */
  private handleRealtimeChange<T>(
    subscriptionId: string,
    config: RealtimeSubscriptionConfig<T>,
    payload: PostgresChangesPayload<T>
  ): void {
    this.log(`Realtime change [${subscriptionId}]:`, payload)

    const { eventType, new: newRecord, old: oldRecord } = payload

    try {
      switch (eventType) {
        case 'INSERT':
          if (config.handlers.onInsert && newRecord) {
            config.handlers.onInsert(newRecord as T)
          }
          break

        case 'UPDATE':
          if (config.handlers.onUpdate && newRecord) {
            config.handlers.onUpdate(newRecord as T, oldRecord as T)
          }
          break

        case 'DELETE':
          if (config.handlers.onDelete && oldRecord) {
            config.handlers.onDelete(oldRecord as T)
          }
          break
      }
    } catch (error) {
      this.log(`Error handling change for ${subscriptionId}:`, error)
    }
  }

  /**
   * 處理訂閱狀態變更
   */
  private handleSubscriptionStatus(subscriptionId: string, status: string): void {
    this.log(`Subscription status [${subscriptionId}]: ${status}`)

    let realtimeStatus: RealtimeStatus

    switch (status) {
      case 'SUBSCRIBED':
        realtimeStatus = 'connected'
        this.updateSubscriptionState(subscriptionId, {
          status: realtimeStatus,
          lastConnectedAt: new Date(),
          retryCount: 0,
          error: null,
        })
        break

      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        realtimeStatus = 'error'
        this.updateSubscriptionState(subscriptionId, {
          status: realtimeStatus,
          error: new Error(`Subscription error: ${status}`),
        })

        // 自動重連
        if (this.config.autoReconnect) {
          this.retrySubscription(subscriptionId)
        }
        break

      case 'CLOSED':
        realtimeStatus = 'disconnected'
        this.updateSubscriptionState(subscriptionId, {
          status: realtimeStatus,
        })
        break

      default:
        this.log(`Unknown status: ${status}`)
    }
  }

  /**
   * 重試訂閱
   */
  private retrySubscription(subscriptionId: string): void {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) return

    if (state.retryCount >= this.config.maxRetries) {
      this.log(`Max retries reached for ${subscriptionId}`)
      this.updateSubscriptionState(subscriptionId, {
        status: 'error',
        error: new Error('Max retries reached'),
      })
      return
    }

    const delay = this.config.retryDelay * (state.retryCount + 1)
    this.log(`Retrying ${subscriptionId} in ${delay}ms`)

    this.updateSubscriptionState(subscriptionId, {
      status: 'reconnecting',
      retryCount: state.retryCount + 1,
    })

    setTimeout(() => {
      this.log(`Reconnecting ${subscriptionId}...`)
      // 這裡需要重新創建訂閱的邏輯
      // 暫時先標記為 disconnected
      this.updateSubscriptionState(subscriptionId, {
        status: 'disconnected',
      })
    }, delay)
  }

  /**
   * 處理錯誤
   */
  private handleError(subscriptionId: string, error: Error): void {
    this.log(`Error in subscription ${subscriptionId}:`, error)

    this.updateSubscriptionState(subscriptionId, {
      status: 'error',
      error,
    })
  }

  /**
   * 更新訂閱狀態
   */
  private updateSubscriptionState(
    subscriptionId: string,
    updates: Partial<SubscriptionState>
  ): void {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) return

    Object.assign(state, updates)
    this.subscriptions.set(subscriptionId, state)
  }

  /**
   * 除錯日誌
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[RealtimeManager] ${message}`, ...args)
    }
  }
}

// 匯出單例
export const realtimeManager = new RealtimeManager({
  enabled: true,
  autoReconnect: true,
  maxRetries: 5,
  retryDelay: 1000,
  debug: process.env.NODE_ENV === 'development',
})

// 匯出類別供測試使用
export { RealtimeManager }
