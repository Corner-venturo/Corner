import { ReactNode } from 'react'

export interface CostItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  total: number
  note?: string
  // 住宿專用：天數和房型數據
  day?: number // 第幾天
  room_type?: string // 房型名稱（如：雙人房、三人房）
  // 交通和領隊導遊專用：團體分攤
  is_group_cost?: boolean // 是否為團體費用
  // 多身份計價：機票專用
  pricing_type?: 'uniform' | 'by_identity' // uniform: 統一價格, by_identity: 依身份計價
  adult_price?: number // 成人價
  child_price?: number // 小朋友價
  infant_price?: number // 嬰兒價
}

export interface CostCategory {
  id: string
  name: string
  items: CostItem[]
  total: number
}

export interface ParticipantCounts {
  adult: number // 成人（雙人房）
  child_with_bed: number // 小朋友（佔床）
  child_no_bed: number // 不佔床
  single_room: number // 單人房
  infant: number // 嬰兒
}

export interface RoomTypePrice {
  adult: number
  child: number
}

export interface SellingPrices {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
  // 動態房型價格（key: 房型名稱）
  room_types?: Record<string, RoomTypePrice>
}

export interface IdentityCosts {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
}

export interface IdentityProfits {
  adult: number
  child_with_bed: number
  child_no_bed: number
  single_room: number
  infant: number
}

export interface AccommodationSummaryItem {
  name: string
  total_cost: number
  averageCost: number
  days: number
  capacity: number // 房型人數（從 quantity 取得）
}

export interface VersionRecord {
  id: string
  version: number
  categories: CostCategory[]
  total_cost: number
  group_size: number
  accommodation_days: number
  participant_counts: ParticipantCounts
  selling_prices: SellingPrices
  note: string
  created_at: string
}

export const costCategories: CostCategory[] = [
  { id: 'transport', name: '交通', items: [], total: 0 },
  { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
  { id: 'accommodation', name: '住宿', items: [], total: 0 },
  { id: 'meals', name: '餐飲', items: [], total: 0 },
  { id: 'activities', name: '活動', items: [], total: 0 },
  { id: 'others', name: '其他', items: [], total: 0 },
  { id: 'guide', name: '領隊導遊', items: [], total: 0 },
]

export const categoryIcons: Record<string, any> = {
  transport: 'Car',
  'group-transport': 'Users',
  accommodation: 'Home',
  meals: 'UtensilsCrossed',
  activities: 'MapPin',
  others: 'MoreHorizontal',
  guide: 'Users',
}

// 檻次表（Tier Pricing Table）- 用於比較不同人數的報價
export interface TierPricing {
  id: string // 唯一識別
  participant_count: number // 總人數（用於重新計算成本）
  participant_counts: ParticipantCounts // 各身份人數分布
  identity_costs: IdentityCosts // 重新計算的各身份成本
  selling_prices: SellingPrices // 各身份售價
  identity_profits: IdentityProfits // 各身份利潤
}
