/**
 * 成本分類與項目型別定義
 * 用於報價單、旅遊團等模組
 */

import { BaseEntity } from './base.types'

/**
 * 成本項目
 */
export interface CostItem {
  id: string
  name: string
  description?: string
  unit_price: number
  quantity: number
  total: number
  notes?: string
  supplier_id?: string
  supplier_name?: string
  date?: string
}

/**
 * 成本分類
 */
export interface CostCategory {
  id: string
  name: string
  items: CostItem[]
  total: number
}

/**
 * 參與人數統計
 */
export interface ParticipantCounts {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
}

/**
 * 銷售價格
 */
export interface SellingPrices {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
}

/**
 * 版本記錄
 */
export interface VersionRecord {
  version: number
  timestamp: string
  changes: string
  created_by?: string
  snapshot?: {
    categories: CostCategory[]
    total_cost: number
    group_size: number
    participant_counts: ParticipantCounts
    selling_prices: SellingPrices
  }
}

/**
 * 擴展的報價單資料（包含成本分類）
 */
export interface QuoteWithCategories extends BaseEntity {
  code: string
  customer_id?: string
  customer_name?: string
  name?: string
  destination: string
  start_date: string
  end_date: string
  days: number
  nights: number
  number_of_people: number
  group_size?: number
  status: string
  total_amount: number
  total_cost?: number
  version: number
  categories?: CostCategory[]
  versions?: VersionRecord[]
  participant_counts?: ParticipantCounts
  selling_prices?: SellingPrices
  tour_id?: string
  converted_to_tour?: boolean
  is_active: boolean
}

/**
 * 擴展的旅遊團資料（包含成本分類）
 */
export interface TourWithCategories extends BaseEntity {
  code: string
  name: string
  status: string
  location?: string
  start_date: string
  end_date: string
  days: number
  nights: number
  max_participants: number
  current_participants: number
  categories?: CostCategory[]
  total_cost?: number
  group_size?: number
  participant_counts?: ParticipantCounts
  selling_prices?: SellingPrices
  version?: number
  versions?: VersionRecord[]
}
