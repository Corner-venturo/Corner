/**
 * Plugin Manager
 * 插件管理器
 */

import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import type {
  Plugin,
  PluginContext,
  PluginConfig,
  PluginHookType,
  LoadedPlugin,
  HookResult,
} from './types'

// Generic hook handler type for plugin system
// Plugin system is a planned feature; tables (plugin_storage, plugin_configs) not yet in database
type HookHandler = (data: unknown, context: PluginContext) => Promise<unknown> | unknown

export class PluginManager {
  private plugins: Map<string, LoadedPlugin> = new Map()
  private hooks: Map<PluginHookType, { pluginId: string; handler: HookHandler; priority: number }[]> = new Map()
  private workspaceId: string

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * 註冊插件
   */
  async register(plugin: Plugin, config?: Partial<PluginConfig>): Promise<boolean> {
    const { metadata } = plugin

    if (this.plugins.has(metadata.id)) {
      logger.warn(`Plugin already registered: ${metadata.id}`)
      return false
    }

    const pluginConfig: PluginConfig = {
      enabled: true,
      settings: {},
      ...config,
    }

    const loadedPlugin: LoadedPlugin = {
      plugin,
      status: 'inactive',
      config: pluginConfig,
      loadedAt: new Date(),
    }

    this.plugins.set(metadata.id, loadedPlugin)
    logger.info(`Plugin registered: ${metadata.name} v${metadata.version}`)

    // 如果啟用，自動初始化
    if (pluginConfig.enabled) {
      await this.activate(metadata.id)
    }

    return true
  }

  /**
   * 啟用插件
   */
  async activate(pluginId: string): Promise<boolean> {
    const loadedPlugin = this.plugins.get(pluginId)

    if (!loadedPlugin) {
      logger.error(`Plugin not found: ${pluginId}`)
      return false
    }

    if (loadedPlugin.status === 'active') {
      return true
    }

    try {
      const context = this.createContext(loadedPlugin)

      // 呼叫 init
      if (loadedPlugin.plugin.init) {
        await loadedPlugin.plugin.init(context)
      }

      // 註冊 hooks
      if (loadedPlugin.plugin.hooks) {
        for (const hook of loadedPlugin.plugin.hooks) {
          this.registerHook(pluginId, hook.type, hook.handler, hook.priority)
        }
      }

      loadedPlugin.status = 'active'
      logger.info(`Plugin activated: ${pluginId}`)
      return true
    } catch (error) {
      loadedPlugin.status = 'error'
      loadedPlugin.error = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Failed to activate plugin: ${pluginId}`, { error: loadedPlugin.error })
      return false
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId: string): Promise<boolean> {
    const loadedPlugin = this.plugins.get(pluginId)

    if (!loadedPlugin) {
      logger.error(`Plugin not found: ${pluginId}`)
      return false
    }

    if (loadedPlugin.status !== 'active') {
      return true
    }

    try {
      const context = this.createContext(loadedPlugin)

      // 呼叫 destroy
      if (loadedPlugin.plugin.destroy) {
        await loadedPlugin.plugin.destroy(context)
      }

      // 移除 hooks
      this.unregisterPluginHooks(pluginId)

      loadedPlugin.status = 'inactive'
      logger.info(`Plugin deactivated: ${pluginId}`)
      return true
    } catch (error) {
      logger.error(`Failed to deactivate plugin: ${pluginId}`, { error })
      return false
    }
  }

  /**
   * 移除插件
   */
  async unregister(pluginId: string): Promise<boolean> {
    await this.deactivate(pluginId)
    this.plugins.delete(pluginId)
    logger.info(`Plugin unregistered: ${pluginId}`)
    return true
  }

  /**
   * 執行 hook
   */
  async executeHook<T = unknown, R = unknown>(
    hookType: PluginHookType,
    data: T
  ): Promise<HookResult<R>[]> {
    const hookHandlers = this.hooks.get(hookType) || []
    const results: HookResult<R>[] = []

    // 按優先級排序
    const sortedHandlers = [...hookHandlers].sort((a, b) => a.priority - b.priority)

    for (const { pluginId, handler } of sortedHandlers) {
      const loadedPlugin = this.plugins.get(pluginId)

      if (!loadedPlugin || loadedPlugin.status !== 'active') {
        continue
      }

      try {
        const context = this.createContext(loadedPlugin)
        const result = await handler(data, context)

        results.push({
          success: true,
          data: result as R,
          pluginId,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Hook execution failed: ${hookType} in ${pluginId}`, { error: errorMessage })

        results.push({
          success: false,
          error: errorMessage,
          pluginId,
        })
      }
    }

    return results
  }

  /**
   * 取得所有已載入的插件
   */
  getPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 取得特定插件
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 取得插件提供的服務
   */
  getService<T>(pluginId: string, serviceName: string): T | undefined {
    const loadedPlugin = this.plugins.get(pluginId)

    if (!loadedPlugin || loadedPlugin.status !== 'active') {
      return undefined
    }

    return loadedPlugin.plugin.services?.[serviceName] as T
  }

  /**
   * 更新插件設定
   */
  async updateConfig(pluginId: string, settings: Record<string, unknown>): Promise<boolean> {
    const loadedPlugin = this.plugins.get(pluginId)

    if (!loadedPlugin) {
      return false
    }

    loadedPlugin.config.settings = {
      ...loadedPlugin.config.settings,
      ...settings,
    }

    // 儲存到資料庫
    await this.savePluginConfig(pluginId, loadedPlugin.config)

    return true
  }

  // ==================== Private Methods ====================

  private registerHook(
    pluginId: string,
    hookType: PluginHookType,
    handler: HookHandler,
    priority = 100
  ): void {
    if (!this.hooks.has(hookType)) {
      this.hooks.set(hookType, [])
    }

    this.hooks.get(hookType)!.push({ pluginId, handler, priority })
  }

  private unregisterPluginHooks(pluginId: string): void {
    for (const [hookType, handlers] of this.hooks) {
      this.hooks.set(
        hookType,
        handlers.filter(h => h.pluginId !== pluginId)
      )
    }
  }

  private createContext(loadedPlugin: LoadedPlugin): PluginContext {
    const pluginId = loadedPlugin.plugin.metadata.id

    return {
      workspaceId: this.workspaceId,
      config: loadedPlugin.config,
      logger: {
        debug: (message, data) => logger.debug(`[${pluginId}] ${message}`, data),
        info: (message, data) => logger.info(`[${pluginId}] ${message}`, data),
        warn: (message, data) => logger.warn(`[${pluginId}] ${message}`, data),
        error: (message, data) => logger.error(`[${pluginId}] ${message}`, data),
      },
      storage: {
        get: async <T>(key: string) => this.getPluginStorage<T>(pluginId, key),
        set: async <T>(key: string, value: T) => this.setPluginStorage(pluginId, key, value),
        delete: async (key: string) => this.deletePluginStorage(pluginId, key),
      },
    }
  }

  private async getPluginStorage<T>(pluginId: string, key: string): Promise<T | null> {
    // plugin_storage 表尚未加入 Supabase 型別定義（需先執行 migration）
    const { data, error } = await dynamicFrom('plugin_storage')
      .select('value')
      .eq('workspace_id', this.workspaceId)
      .eq('plugin_id', pluginId)
      .eq('key', key)
      .single()

    if (error || !data) return null
    return data.value as T
  }

  private async setPluginStorage<T>(pluginId: string, key: string, value: T): Promise<void> {
    // plugin_storage 表尚未加入 Supabase 型別定義（需先執行 migration）
    await dynamicFrom('plugin_storage')
      .upsert({
        workspace_id: this.workspaceId,
        plugin_id: pluginId,
        key,
        value,
        updated_at: new Date().toISOString(),
      })
  }

  private async deletePluginStorage(pluginId: string, key: string): Promise<void> {
    // plugin_storage 表尚未加入 Supabase 型別定義（需先執行 migration）
    await dynamicFrom('plugin_storage')
      .delete()
      .eq('workspace_id', this.workspaceId)
      .eq('plugin_id', pluginId)
      .eq('key', key)
  }

  private async savePluginConfig(pluginId: string, config: PluginConfig): Promise<void> {
    // plugin_configs 表尚未加入 Supabase 型別定義（需先執行 migration）
    await dynamicFrom('plugin_configs')
      .upsert({
        workspace_id: this.workspaceId,
        plugin_id: pluginId,
        config,
        updated_at: new Date().toISOString(),
      })
  }
}

// 工廠函數
export function pluginManager(workspaceId: string): PluginManager {
  return new PluginManager(workspaceId)
}
