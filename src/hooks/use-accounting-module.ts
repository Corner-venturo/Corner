/**
 * 會計模組權限檢查 Hook
 * 建立日期：2025-01-17
 */

import { useMemo } from 'react'
import { useWorkspaceModuleStore } from '@/stores/workspace-module-store'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 檢查當前 workspace 是否啟用會計模組
 *
 * @example
 * ```tsx
 * function AccountingPage() {
 *   const { hasAccounting, isExpired, loading } = useAccountingModule()
 *
 *   if (loading) return <div>載入中...</div>
 *   if (!hasAccounting) return <div>未啟用會計模組</div>
 *   if (isExpired) return <div>會計模組已過期</div>
 *
 *   return <div>會計功能...</div>
 * }
 * ```
 */
export function useAccountingModule() {
  const user = useAuthStore((state) => state.user)
  const modules = useWorkspaceModuleStore((state) => state.items)
  const loading = useWorkspaceModuleStore((state) => state.loading)

  const result = useMemo(() => {
    if (!user?.workspace_id) {
      return {
        hasAccounting: false,
        isExpired: false,
        expiresAt: null,
        module: null,
      }
    }

    // 查找會計模組
    const accountingModule = modules.find(
      (m) =>
        m.workspace_id === user.workspace_id &&
        m.module_name === 'accounting' &&
        m.is_enabled
    )

    if (!accountingModule) {
      return {
        hasAccounting: false,
        isExpired: false,
        expiresAt: null,
        module: null,
      }
    }

    // 檢查是否過期
    const isExpired = accountingModule.expires_at
      ? new Date(accountingModule.expires_at) < new Date()
      : false

    return {
      hasAccounting: true,
      isExpired,
      expiresAt: accountingModule.expires_at,
      module: accountingModule,
    }
  }, [user?.workspace_id, modules])

  return {
    ...result,
    loading,
  }
}

/**
 * 檢查當前 workspace 是否啟用指定模組
 *
 * @example
 * ```tsx
 * const { hasModule } = useModule('inventory')
 * if (hasModule) {
 *   // 顯示庫存功能
 * }
 * ```
 */
export function useModule(moduleName: 'accounting' | 'inventory' | 'bi_analytics') {
  const user = useAuthStore((state) => state.user)
  const modules = useWorkspaceModuleStore((state) => state.items)
  const loading = useWorkspaceModuleStore((state) => state.loading)

  const result = useMemo(() => {
    if (!user?.workspace_id) {
      return {
        hasModule: false,
        isExpired: false,
        expiresAt: null,
        module: null,
      }
    }

    const targetModule = modules.find(
      (m) =>
        m.workspace_id === user.workspace_id &&
        m.module_name === moduleName &&
        m.is_enabled
    )

    if (!targetModule) {
      return {
        hasModule: false,
        isExpired: false,
        expiresAt: null,
        module: null,
      }
    }

    const isExpired = targetModule.expires_at
      ? new Date(targetModule.expires_at) < new Date()
      : false

    return {
      hasModule: true,
      isExpired,
      expiresAt: targetModule.expires_at,
      module: targetModule,
    }
  }, [user?.workspace_id, modules, moduleName])

  return {
    ...result,
    loading,
  }
}
