// 可用的小工具類型
export type WidgetType = 'calculator' | 'currency' | 'timer' | 'notes' | 'stats' | 'pnr' | 'flight' | 'weather' | 'weather-weekly' | 'manifestation'

export interface WidgetConfig {
  id: WidgetType
  name: string
  icon: unknown
  component: React.ComponentType
  span?: number // 佔據的列數（1 或 2）
  requiredPermission?: string // 需要的權限（如 'super_admin_only'）
}

// 統計項目類型
export type StatType =
  | 'todos'
  | 'paymentsThisWeek'
  | 'paymentsNextWeek'
  | 'depositsThisWeek'
  | 'toursThisWeek'
  | 'toursThisMonth'

export interface StatConfig {
  id: StatType
  label: string
  value: string | number
  icon: unknown
  color: string
  bgColor: string
}

// 便條紙分頁類型
export interface NoteTab {
  id: string
  name: string
  content: string
}
