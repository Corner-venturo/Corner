/**
 * 工作空間模組授權 Store
 * 建立日期：2025-01-17
 */

import { createStore } from './core/create-store'
import type { WorkspaceModule } from '@/types/accounting-pro.types'

/**
 * 工作空間模組授權 Store
 *
 * 使用方式：
 * ```tsx
 * const modules = useWorkspaceModuleStore(state => state.items)
 * const fetchAll = useWorkspaceModuleStore(state => state.fetchAll)
 *
 * // 檢查會計模組是否已啟用
 * const accountingModule = modules.find(m =>
 *   m.workspace_id === workspaceId &&
 *   m.module_name === 'accounting' &&
 *   m.is_enabled
 * )
 *
 * const hasAccounting = !!accountingModule
 * const isExpired = accountingModule?.expires_at &&
 *   new Date(accountingModule.expires_at) < new Date()
 * ```
 */
export const useWorkspaceModuleStore = createStore<WorkspaceModule>({
   
  tableName: 'workspace_modules' as any,
  enableSupabase: true,
  fastInsert: true,
})
