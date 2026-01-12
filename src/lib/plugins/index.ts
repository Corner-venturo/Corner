/**
 * Plugin System
 * 插件系統入口
 */

export { PluginManager, pluginManager } from './plugin-manager'
export { PluginRegistry } from './plugin-registry'
export type {
  Plugin,
  PluginMetadata,
  PluginContext,
  PluginHook,
  PluginHookType,
  PluginConfig,
} from './types'
