/**
 * Plugin System Types
 * 插件系統類型定義
 */

/**
 * 插件元資料
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  dependencies?: Record<string, string>
}

/**
 * 插件配置
 */
export interface PluginConfig {
  enabled: boolean
  settings?: Record<string, unknown>
}

/**
 * 插件上下文（傳給插件的環境資訊）
 */
export interface PluginContext {
  workspaceId: string
  userId?: string
  config: PluginConfig
  logger: {
    debug: (message: string, data?: unknown) => void
    info: (message: string, data?: unknown) => void
    warn: (message: string, data?: unknown) => void
    error: (message: string, data?: unknown) => void
  }
  storage: {
    get: <T>(key: string) => Promise<T | null>
    set: <T>(key: string, value: T) => Promise<void>
    delete: (key: string) => Promise<void>
  }
}

/**
 * Hook 類型
 */
export type PluginHookType =
  // 生命週期 hooks
  | 'plugin:init'
  | 'plugin:destroy'
  // Tour hooks
  | 'tour:beforeCreate'
  | 'tour:afterCreate'
  | 'tour:beforeUpdate'
  | 'tour:afterUpdate'
  | 'tour:beforeDelete'
  | 'tour:afterDelete'
  // Order hooks
  | 'order:beforeCreate'
  | 'order:afterCreate'
  | 'order:beforeUpdate'
  | 'order:afterUpdate'
  | 'order:beforePayment'
  | 'order:afterPayment'
  // Quote hooks
  | 'quote:beforeConfirm'
  | 'quote:afterConfirm'
  // Payment hooks
  | 'payment:beforeProcess'
  | 'payment:afterProcess'
  // UI hooks
  | 'ui:dashboard:widgets'
  | 'ui:sidebar:items'
  | 'ui:tour:tabs'
  | 'ui:order:tabs'

/**
 * Hook 處理器
 */
export interface PluginHook<T = unknown, R = void> {
  type: PluginHookType
  priority?: number // 數字越小優先級越高，預設 100
  handler: (data: T, context: PluginContext) => Promise<R> | R
}

/**
 * 插件介面
 */
export interface Plugin {
  metadata: PluginMetadata

  /**
   * 插件初始化
   */
  init?(context: PluginContext): Promise<void> | void

  /**
   * 插件銷毀
   */
  destroy?(context: PluginContext): Promise<void> | void

  /**
   * 註冊 hooks
   */
  hooks?: PluginHook[]

  /**
   * 提供的服務（可被其他插件使用）
   */
  services?: Record<string, unknown>

  /**
   * 提供的 UI 組件
   */
  components?: {
    dashboardWidgets?: React.ComponentType<unknown>[]
    sidebarItems?: React.ComponentType<unknown>[]
    tourTabs?: React.ComponentType<unknown>[]
    orderTabs?: React.ComponentType<unknown>[]
  }
}

/**
 * 插件狀態
 */
export type PluginStatus = 'inactive' | 'active' | 'error' | 'disabled'

/**
 * 已載入的插件資訊
 */
export interface LoadedPlugin {
  plugin: Plugin
  status: PluginStatus
  config: PluginConfig
  error?: string
  loadedAt: Date
}

/**
 * Hook 執行結果
 */
export interface HookResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  pluginId: string
}
