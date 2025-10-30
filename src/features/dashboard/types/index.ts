// 可用的小工具類型
export type WidgetType = 'calculator' | 'currency' | 'timer' | 'notes' | 'stats'

export interface WidgetConfig {
  id: WidgetType
  name: string
  icon: unknown
  component: React.ComponentType
  span?: number // 佔據的列數（1 或 2）
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
