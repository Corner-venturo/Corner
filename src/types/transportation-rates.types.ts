// 車資管理型別定義

export interface TransportationRate {
  id: string
  country_id: string | null
  country_name: string
  vehicle_type: string
  category: string | null          // 品項大分類（如：4座車、7座車）
  supplier: string | null           // 廠商名稱
  route: string | null              // 行程路線
  trip_type: string | null          // 行程類型（單程、往返）
  cost_vnd: number | null           // 成本價（越南盾）
  price_twd: number | null          // 售價（台幣）
  kkday_selling_price: number | null // KKDAY售價
  kkday_cost: number | null         // KKDAY成本
  kkday_profit: number | null       // KKDAY利潤
  is_backup: boolean | null         // 是否為備用廠商
  price: number
  currency: string
  unit: string
  notes: string | null
  is_active: boolean
  display_order: number
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Country {
  id: string
  name: string
  code: string
}

// 用於分組顯示的資料結構
export interface GroupedRate extends TransportationRate {
  isFirstInGroup?: boolean // 是否為該組第一筆（用於合併儲存格）
  rowSpan?: number         // 該組共幾筆（用於合併儲存格）
}
