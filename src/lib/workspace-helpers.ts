/**
 * Workspace Helper Functions
 *
 * 提供與 workspace 相關的輔助函數
 */

import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStoreData } from '@/stores/workspace/workspace-store'
import { logger } from '@/lib/utils/logger'
import { canCrossWorkspace, canManageWorkspace as canManageWorkspaceByRole, type UserRole } from './rbac-config'

/**
 * 取得當前使用者的 workspace_id
 *
 * @returns workspace_id (UUID) 或 null（可跨 workspace 的角色）
 */
export function getCurrentWorkspaceId(): string | null {
  const { user } = useAuthStore.getState()

  if (!user) {
    return null
  }

  // 檢查是否為可跨 workspace 的角色
  const userRole = user.roles?.[0] as UserRole
  if (canCrossWorkspace(userRole)) {
    return null
  }

  // 從 employees 資料取得 workspace_id
  return user.workspace_id || null
}

/**
 * 取得當前使用者的 workspace code (TP, TC)
 * 由於資料庫沒有 code 欄位，從 name 取前兩個字元作為代碼
 *
 * @returns workspace code 或 null
 */
export function getCurrentWorkspaceCode(): string | null {
  const { user } = useAuthStore.getState()
  const workspaceStore = useWorkspaceStoreData.getState()
  const workspaces = workspaceStore.items || []

  if (!user) {
    logger.warn('[getCurrentWorkspaceCode] No user found')
    return null
  }

  // 檢查 workspaces 是否已載入
  if (workspaces.length === 0) {
    logger.error('[getCurrentWorkspaceCode] ❌ Workspaces not loaded! Store state:', {
      hasItems: !!workspaceStore.items,
      itemsLength: workspaceStore.items?.length,
      hasFetchAll: !!workspaceStore.fetchAll
    })
    // 嘗試載入 workspaces
    if (workspaceStore.fetchAll) {
      logger.log('[getCurrentWorkspaceCode] Triggering fetchAll()...')
      workspaceStore.fetchAll().catch((err: any) => logger.error('fetchAll failed:', err))
    }
    return null
  }

  // 可跨 workspace 的角色需要從前端選擇的 workspace 取得 code
  const userRole = user.roles?.[0] as UserRole
  if (canCrossWorkspace(userRole)) {
    // 如果有選擇的 workspace，從 store 取得
    const selectedWorkspaceId = user.selected_workspace_id
    if (selectedWorkspaceId) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId)
      if (workspace) {
        // ✅ 使用 workspace.code 欄位（如 TP, TC）
        interface WorkspaceWithCode {
          id: string
          name: string
          code?: string
        }
        return (workspace as WorkspaceWithCode).code || workspace.name.substring(0, 2).toUpperCase()
      }
      logger.warn(`[getCurrentWorkspaceCode] Cross-workspace user selected workspace ${selectedWorkspaceId} not found`)
    }

    // ✅ 沒有選擇 workspace 時，使用第一個 workspace
    if (!selectedWorkspaceId && workspaces.length > 0) {
      const defaultWorkspace = workspaces[0]
      logger.warn(`[getCurrentWorkspaceCode] Cross-workspace user has no selected workspace, using default: ${defaultWorkspace.name}`)
      // ✅ 使用 workspace.code 欄位（如 TP, TC）
      interface WorkspaceWithCode {
        id: string
        name: string
        code?: string
      }
      return (defaultWorkspace as WorkspaceWithCode).code || defaultWorkspace.name.substring(0, 2).toUpperCase()
    }

    logger.warn('[getCurrentWorkspaceCode] Cross-workspace user has no workspace available')
    return null
  }

  // 一般使用者從自己的 workspace_id 找到對應的 code
  const workspaceId = user.workspace_id
  if (!workspaceId) {
    logger.warn('[getCurrentWorkspaceCode] User has no workspace_id')
    return null
  }

  const workspace = workspaces.find(w => w.id === workspaceId)
  if (workspace) {
    // ✅ 使用 workspace.code 欄位（如 TP, TC）
    interface WorkspaceWithCode {
      id: string
      name: string
      code?: string
    }
    return (workspace as WorkspaceWithCode).code || workspace.name.substring(0, 2).toUpperCase()
  }

  logger.warn(`[getCurrentWorkspaceCode] Workspace ${workspaceId} not found in store`)
  return null
}

/**
 * 取得當前使用者的 workspace 完整資訊
 *
 * @returns workspace 物件或 null
 */
export function getCurrentWorkspace() {
  const { user } = useAuthStore.getState()
  const workspaceStore = useWorkspaceStoreData.getState()
  const workspaces = workspaceStore.items || []

  if (!user) {
    return null
  }

  // 檢查 workspaces 是否已載入
  if (workspaces.length === 0) {
    logger.warn('[getCurrentWorkspace] Workspaces not loaded yet')
    workspaceStore.fetchAll?.().catch((err: any) => logger.error('fetchAll failed:', err))
    return null
  }

  // 可跨 workspace 的角色從選擇的 workspace 取得
  const userRole = user.roles?.[0] as UserRole
  if (canCrossWorkspace(userRole)) {
    const selectedWorkspaceId = user.selected_workspace_id
    if (selectedWorkspaceId) {
      return workspaces.find(w => w.id === selectedWorkspaceId) || null
    }
    return null
  }

  // 一般使用者從自己的 workspace_id 取得
  const workspaceId = user.workspace_id
  if (!workspaceId) {
    return null
  }

  return workspaces.find(w => w.id === workspaceId) || null
}

/**
 * 檢查當前使用者是否為 super_admin
 *
 * @returns boolean
 */
export function isSuperAdmin(): boolean {
  const { user } = useAuthStore.getState()
  if (!user) return false

  const userRole = user.roles?.[0] as UserRole
  return userRole === 'super_admin'
}

/**
 * 檢查當前使用者是否為 admin（包含 super_admin）
 *
 * @returns boolean
 */
export function isAdmin(): boolean {
  const { user } = useAuthStore.getState()
  if (!user) return false

  const userRole = user.roles?.[0] as UserRole
  return userRole === 'super_admin' || userRole === 'admin'
}

/**
 * 檢查當前使用者是否可以管理指定的 workspace
 *
 * @param targetWorkspaceId - 目標 workspace ID
 * @returns boolean
 */
export function canManageWorkspace(targetWorkspaceId: string): boolean {
  const { user } = useAuthStore.getState()

  if (!user) {
    return false
  }

  const userRole = user.roles?.[0] as UserRole

  // 檢查是否有管理 workspace 的權限
  if (!canManageWorkspaceByRole(userRole)) {
    return false
  }

  // super_admin 可以管理任何 workspace
  if (canCrossWorkspace(userRole)) {
    return true
  }

  // 一般 admin 只能管理自己的 workspace
  return user.workspace_id === targetWorkspaceId
}

/**
 * 取得所有可用的 workspaces（根據權限）
 *
 * @returns workspace 陣列
 */
export function getAvailableWorkspaces() {
  const { user } = useAuthStore.getState()
  const workspaceStore = useWorkspaceStoreData.getState()
  const workspaces = workspaceStore.items || []

  if (!user) {
    return []
  }

  const userRole = user.roles?.[0] as UserRole

  // 可跨 workspace 的角色可以看到所有 workspaces
  if (canCrossWorkspace(userRole)) {
    return workspaces
  }

  // 一般使用者只能看到自己的 workspace
  const workspaceId = user.workspace_id
  if (!workspaceId) {
    return []
  }

  return workspaces.filter(w => w.id === workspaceId)
}
