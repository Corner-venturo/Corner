/**
 * Workspace 跨分公司權限型別定義
 */

export interface WorkspacePermission {
  id: string
  user_id: string
  workspace_id: string

  // 權限類型
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_manage_finance: boolean

  // 審計欄位
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean

  // 備註
  notes: string | null

  created_at: string
  updated_at: string
}

export interface WorkspacePermissionWithDetails extends WorkspacePermission {
  workspace_name: string
  user_name: string
  granted_by_name: string | null
}

export interface GrantWorkspaceAccessParams {
  target_user_id: string
  workspace_id: string
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
  can_manage_finance?: boolean
  expires_at?: string | null
  notes?: string | null
}

export interface UserWorkspaceAccess {
  workspace_id: string
  workspace_name: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_manage_finance: boolean
  granted_by_name: string | null
  granted_at: string
  expires_at: string | null
}
