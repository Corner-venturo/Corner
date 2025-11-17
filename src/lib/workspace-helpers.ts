/**
 * Workspace Helper Functions
 *
 * 提供與 workspace 相關的輔助函數
 */

import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStoreData } from '@/stores/workspace/workspace-store'

/**
 * 取得當前使用者的 workspace_id
 *
 * @returns workspace_id (UUID) 或 null（super_admin）
 */
export function getCurrentWorkspaceId(): string | null {
  const { user } = useAuthStore.getState()

  if (!user) {
    return null
  }

  // super_admin 沒有固定的 workspace_id
  if (user.permissions?.includes('super_admin')) {
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
  const { items: workspaces } = useWorkspaceStoreData.getState()

  if (!user) {
    return null
  }

  // super_admin 需要從前端選擇的 workspace 取得 code
  if (user.permissions?.includes('super_admin')) {
    // 如果有選擇的 workspace，從 store 取得
    const selectedWorkspaceId = user.selected_workspace_id
    if (selectedWorkspaceId) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId)
      return workspace ? workspace.name.substring(0, 2).toUpperCase() : null
    }
    return null
  }

  // 一般使用者從自己的 workspace_id 找到對應的 code
  const workspaceId = user.workspace_id
  if (!workspaceId) {
    return null
  }

  const workspace = workspaces.find(w => w.id === workspaceId)
  return workspace ? workspace.name.substring(0, 2).toUpperCase() : null
}

/**
 * 取得當前使用者的 workspace 完整資訊
 *
 * @returns workspace 物件或 null
 */
export function getCurrentWorkspace() {
  const { user } = useAuthStore.getState()
  const { items: workspaces } = useWorkspaceStoreData.getState()

  if (!user) {
    return null
  }

  // super_admin 從選擇的 workspace 取得
  if (user.permissions?.includes('super_admin')) {
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
  return user?.permissions?.includes('super_admin') || false
}

/**
 * 檢查當前使用者是否為 admin（包含 super_admin）
 *
 * @returns boolean
 */
export function isAdmin(): boolean {
  const { user } = useAuthStore.getState()
  const permissions = user?.permissions || []
  return permissions.includes('super_admin') || permissions.includes('admin')
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

  // super_admin 可以管理任何 workspace
  if (user.permissions?.includes('super_admin')) {
    return true
  }

  // 一般 admin 只能管理自己的 workspace
  if (user.permissions?.includes('admin')) {
    return user.workspace_id === targetWorkspaceId
  }

  return false
}

/**
 * 取得所有可用的 workspaces（根據權限）
 *
 * @returns workspace 陣列
 */
export function getAvailableWorkspaces() {
  const { user } = useAuthStore.getState()
  const { items: workspaces } = useWorkspaceStoreData.getState()

  if (!user) {
    return []
  }

  // super_admin 可以看到所有 workspaces
  if (user.permissions?.includes('super_admin')) {
    return workspaces
  }

  // 一般使用者只能看到自己的 workspace
  const workspaceId = user.workspace_id
  if (!workspaceId) {
    return []
  }

  return workspaces.filter(w => w.id === workspaceId)
}
