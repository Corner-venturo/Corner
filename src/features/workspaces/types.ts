/**
 * Workspace Management Types
 */

export type WorkspaceType = 'travel_agency' | 'vehicle_supplier' | 'guide_supplier'

export interface WorkspaceWithDetails {
  id: string
  name: string
  code: string
  type: string | null
  is_active: boolean | null
  description: string | null
  created_at: string | null
  updated_at: string | null
  employee_number_prefix: string | null
  default_password: string | null
}

export interface CreateWorkspaceData {
  name: string
  code: string
  type: WorkspaceType
  // 第一個管理員資料
  admin_name: string
  admin_employee_number: string
  admin_password: string
}

export const WORKSPACE_TYPE_LABELS: Record<WorkspaceType, string> = {
  travel_agency: '旅行社',
  vehicle_supplier: '車行',
  guide_supplier: '領隊公司',
}
