// ============================
// 客戶群組型別定義
// ============================

/**
 * 群組類型
 */
export type CustomerGroupType = 'family' | 'company' | 'club' | 'other'

/**
 * 成員角色
 */
export type CustomerGroupMemberRole = 'leader' | 'member'

/**
 * 客戶群組
 */
export interface CustomerGroup {
  id: string
  workspace_id: string
  name: string
  type: CustomerGroupType
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // 關聯資料（join 查詢時）
  members?: CustomerGroupMember[]
  created_by_employee?: {
    display_name?: string
    chinese_name?: string
  }
}

/**
 * 客戶群組成員
 */
export interface CustomerGroupMember {
  id: string
  group_id: string
  customer_id: string
  role: CustomerGroupMemberRole
  created_at: string
  updated_at: string
  // 關聯資料（join 查詢時）
  customer?: {
    id: string
    name: string
    phone?: string
    passport_romanization?: string
  }
}

/**
 * 建立客戶群組的輸入資料
 */
export interface CreateCustomerGroupData {
  name: string
  type: CustomerGroupType
  note?: string
  created_by?: string
}

/**
 * 更新客戶群組的輸入資料
 */
export interface UpdateCustomerGroupData {
  name?: string
  type?: CustomerGroupType
  note?: string
}

/**
 * 建立客戶群組成員的輸入資料
 */
export interface CreateCustomerGroupMemberData {
  group_id: string
  customer_id: string
  role?: CustomerGroupMemberRole
}
