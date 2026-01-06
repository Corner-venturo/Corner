/**
 * 提案系統類型定義
 * Venturo ERP - Proposal System Types
 */

// ============================================
// 狀態類型
// ============================================

export type ProposalStatus = 'draft' | 'negotiating' | 'converted' | 'archived'

export type ArchiveReason = 'not_interested' | 'competitor' | 'price' | 'date' | 'other'

// ============================================
// 人數結構
// ============================================

export interface ParticipantCounts {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
}

// ============================================
// 提案 (Proposal)
// ============================================

export interface Proposal {
  id: string
  code: string                            // P000001

  // 客戶資訊（選填）
  customer_id?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null

  // 提案基本資訊
  title: string
  description?: string | null
  notes?: string | null

  // 目的地
  country_id?: string | null
  main_city_id?: string | null
  destination?: string | null

  // 日期
  expected_start_date?: string | null
  expected_end_date?: string | null
  flexible_dates?: boolean

  // 人數
  group_size?: number | null
  participant_counts?: ParticipantCounts | null

  // 狀態
  status: ProposalStatus

  // 選定的套件與轉團
  selected_package_id?: string | null
  converted_tour_id?: string | null
  converted_at?: string | null
  converted_by?: string | null

  // 審計
  workspace_id: string
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string

  // 封存
  archived_at?: string | null
  archive_reason?: ArchiveReason | null

  // 關聯資料（查詢時 JOIN）
  packages?: ProposalPackage[]
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  selected_package?: ProposalPackage
}

// ============================================
// 團體套件 (ProposalPackage)
// ============================================

export interface ProposalPackage {
  id: string
  proposal_id: string

  // 版本識別
  version_name: string                    // 「方案A - 標準版」
  version_number: number                  // 1, 2, 3...

  // 目的地
  country_id?: string | null
  main_city_id?: string | null
  destination?: string | null

  // 日期
  start_date?: string | null
  end_date?: string | null
  days?: number | null
  nights?: number | null

  // 人數
  group_size?: number | null
  participant_counts?: ParticipantCounts | null

  // 關聯資料（外鍵）
  quote_id?: string | null                // 關聯報價單
  itinerary_id?: string | null            // 關聯行程表
  handbook_id?: string | null             // 關聯手冊（未來）

  // 狀態
  is_selected: boolean
  is_active: boolean

  // 備註
  notes?: string | null

  // 審計
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string

  // 關聯資料（查詢時 JOIN）
  quote?: {
    id: string
    code?: string
    total_amount?: number
    status?: string
  }
  itinerary?: {
    id: string
    title?: string
    status?: string
  }
}

// ============================================
// 建立與更新
// ============================================

export interface CreateProposalData {
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  title?: string                            // 選填，轉開團時補填
  description?: string
  notes?: string
  country_id?: string
  main_city_id?: string
  destination?: string
  expected_start_date?: string              // 預計出發日期
  expected_end_date?: string
  flexible_dates?: boolean
  group_size?: number
  participant_counts?: ParticipantCounts
}

export interface UpdateProposalData extends Partial<CreateProposalData> {
  status?: ProposalStatus
  selected_package_id?: string
  archived_at?: string
  archive_reason?: ArchiveReason
}

export interface CreatePackageData {
  proposal_id: string
  version_name: string
  country_id?: string
  main_city_id?: string
  destination?: string
  start_date?: string
  end_date?: string
  days?: number
  nights?: number
  group_size?: number
  participant_counts?: ParticipantCounts
  quote_id?: string
  itinerary_id?: string
  notes?: string
}

export interface UpdatePackageData extends Partial<Omit<CreatePackageData, 'proposal_id'>> {
  is_selected?: boolean
  is_active?: boolean
}

// ============================================
// 轉開團
// ============================================

export interface ConvertToTourData {
  proposal_id: string
  package_id: string
  city_code: string                       // 用於生成團號
  departure_date: string                  // 確定的出發日期
  tour_name?: string                      // 團名（選填，預設用提案標題）
  contact_person?: string                 // 聯絡人
  contact_phone?: string                  // 聯絡電話
}

export interface ConvertToTourResult {
  tour_id: string
  tour_code: string
  quote_id?: string
  itinerary_id?: string
  order_id?: string
}

// ============================================
// 篩選與查詢
// ============================================

export interface ProposalFilters {
  status?: ProposalStatus | 'all'
  customer_id?: string
  country_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface ProposalListItem extends Proposal {
  package_count?: number
  latest_package?: ProposalPackage
}

// ============================================
// 狀態配置
// ============================================

export const PROPOSAL_STATUS_CONFIG = {
  draft: {
    label: '草稿',
    color: 'secondary',
    description: '初始狀態，尚未提交給客戶',
  },
  negotiating: {
    label: '洽談中',
    color: 'info',
    description: '已與客戶開始討論',
  },
  converted: {
    label: '已轉團',
    color: 'success',
    description: '已確認並轉為正式旅遊團',
  },
  archived: {
    label: '已封存',
    color: 'muted',
    description: '已結束但未成團',
  },
} as const

export const ARCHIVE_REASON_CONFIG = {
  not_interested: { label: '客戶無興趣' },
  competitor: { label: '選擇競爭對手' },
  price: { label: '價格問題' },
  date: { label: '日期不合' },
  other: { label: '其他原因' },
} as const
