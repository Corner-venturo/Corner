/**
 * Plugin Registry
 * 內建插件註冊表
 *
 * 注意：插件系統為計畫中的功能。
 * 相關資料表 (plugin_storage, plugin_configs) 尚未建立。
 * 以下為插件架構定義與占位實作。
 */

import type { Plugin } from './types'
import { logger } from '@/lib/utils/logger'

/**
 * 內建插件清單
 */
export const PluginRegistry: Record<string, () => Plugin> = {
  /**
   * 通知插件 - 發送各種通知
   */
  'venturo-notifications': () => ({
    metadata: {
      id: 'venturo-notifications',
      name: 'Venturo Notifications',
      version: '1.0.0',
      description: '提供電子郵件、LINE、簡訊等通知功能',
      author: 'Venturo',
    },
    hooks: [
      {
        type: 'tour:afterCreate',
        handler: async (data, context) => {
          context.logger.info('Tour created, sending notifications...')
          // [Planned] 整合通知服務 (Email, LINE, SMS)
          logger.debug('[Plugin] venturo-notifications: tour:afterCreate triggered')
        },
      },
      {
        type: 'order:afterPayment',
        handler: async (data, context) => {
          context.logger.info('Payment received, sending confirmation...')
          // [Planned] 發送付款確認通知
          logger.debug('[Plugin] venturo-notifications: order:afterPayment triggered')
        },
      },
    ],
  }),

  /**
   * 自動化插件 - 自動執行常見任務
   */
  'venturo-automation': () => ({
    metadata: {
      id: 'venturo-automation',
      name: 'Venturo Automation',
      version: '1.0.0',
      description: '自動化工作流程，如自動建立頻道、自動分配團控等',
      author: 'Venturo',
    },
    hooks: [
      {
        type: 'tour:afterCreate',
        priority: 50, // 高優先級
        handler: async (data, context) => {
          context.logger.info('Auto-creating tour channel...')
          // [Planned] 自動建立團聊天頻道
          logger.debug('[Plugin] venturo-automation: tour:afterCreate triggered')
        },
      },
    ],
  }),

  /**
   * 報表插件 - 進階報表功能
   */
  'venturo-reports': () => ({
    metadata: {
      id: 'venturo-reports',
      name: 'Venturo Reports',
      version: '1.0.0',
      description: '進階報表與匯出功能',
      author: 'Venturo',
    },
    services: {
      generatePDF: async (data: unknown) => {
        // [Planned] PDF 生成服務 (整合 Puppeteer)
        logger.debug('[Plugin] venturo-reports: generatePDF called', { data })
        return { success: true, message: 'PDF generation pending implementation' }
      },
      generateExcel: async (data: unknown) => {
        // [Planned] Excel 生成服務 (整合 ExcelJS)
        logger.debug('[Plugin] venturo-reports: generateExcel called', { data })
        return { success: true, message: 'Excel generation pending implementation' }
      },
    },
  }),

  /**
   * 整合插件 - 第三方服務整合
   */
  'venturo-integrations': () => ({
    metadata: {
      id: 'venturo-integrations',
      name: 'Venturo Integrations',
      version: '1.0.0',
      description: '第三方服務整合（Google Calendar, LINE 等）',
      author: 'Venturo',
    },
    init: async (context) => {
      context.logger.info('Initializing integrations...')
      // [Planned] 初始化第三方服務連接 (OAuth tokens, API keys)
      logger.debug('[Plugin] venturo-integrations: initialized')
    },
    services: {
      syncToGoogleCalendar: async (tourId: string) => {
        // [Planned] Google Calendar API 整合
        logger.debug('[Plugin] venturo-integrations: syncToGoogleCalendar', { tourId })
        return { success: true, message: 'Google Calendar sync pending implementation' }
      },
      sendLineMessage: async (userId: string, message: string) => {
        // [Planned] LINE Messaging API 整合
        logger.debug('[Plugin] venturo-integrations: sendLineMessage', { userId, message })
        return { success: true, message: 'LINE messaging pending implementation' }
      },
    },
  }),

  /**
   * 審計插件 - 操作記錄與審計
   */
  'venturo-audit': () => ({
    metadata: {
      id: 'venturo-audit',
      name: 'Venturo Audit',
      version: '1.0.0',
      description: '完整的操作記錄與審計追蹤',
      author: 'Venturo',
    },
    hooks: [
      {
        type: 'tour:afterCreate',
        handler: async (data, context) => {
          await context.storage.set(`audit:tour:${Date.now()}`, {
            action: 'create',
            entity: 'tour',
            data,
            timestamp: new Date().toISOString(),
          })
        },
      },
      {
        type: 'tour:afterUpdate',
        handler: async (data, context) => {
          await context.storage.set(`audit:tour:${Date.now()}`, {
            action: 'update',
            entity: 'tour',
            data,
            timestamp: new Date().toISOString(),
          })
        },
      },
      {
        type: 'order:afterCreate',
        handler: async (data, context) => {
          await context.storage.set(`audit:order:${Date.now()}`, {
            action: 'create',
            entity: 'order',
            data,
            timestamp: new Date().toISOString(),
          })
        },
      },
    ],
  }),
}

/**
 * 取得所有可用插件
 */
export function getAvailablePlugins(): Plugin[] {
  return Object.values(PluginRegistry).map(factory => factory())
}

/**
 * 取得特定插件
 */
export function getPlugin(pluginId: string): Plugin | undefined {
  const factory = PluginRegistry[pluginId]
  return factory ? factory() : undefined
}
