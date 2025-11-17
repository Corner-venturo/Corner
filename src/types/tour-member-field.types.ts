/**
 * 團員動態欄位型別定義
 */

export interface TourMemberField {
  id: string
  tour_id: string
  order_member_id: string
  field_name: string
  field_value: string | null
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 團員完整資料（含基本資料 + 動態欄位）
 */
export interface TourMemberWithFields {
  // 基本資料（來自 order_members）
  id: string
  order_id: string
  chinese_name: string | null
  passport_name: string | null
  birth_date: string | null
  gender: string | null
  id_number: string | null
  passport_number: string | null
  passport_expiry: string | null
  special_meal: string | null
  pnr: string | null

  // 動態欄位（key-value pairs）
  custom_fields: Record<string, string>

  // 拖曳排序用
  display_order: number
}

/**
 * 新增動態欄位請求
 */
export interface AddCustomFieldRequest {
  tour_id: string
  field_name: string
}

/**
 * 更新動態欄位值請求
 */
export interface UpdateCustomFieldRequest {
  tour_id: string
  order_member_id: string
  field_name: string
  field_value: string
}
