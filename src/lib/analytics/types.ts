/**
 * Analytics Types
 * 分析模組類型定義
 */

export interface DateRange {
  start: Date | string
  end: Date | string
}

export interface MetricResult {
  name: string
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
}

export interface ChartDataPoint {
  label: string
  value: number
  [key: string]: unknown
}

export interface ChartData {
  labels: string[]
  datasets: {
    name: string
    data: number[]
    color?: string
  }[]
}

export interface TimeSeriesData {
  date: string
  value: number
  [key: string]: unknown
}

export type ReportFormat = 'json' | 'csv' | 'excel' | 'pdf'

export interface ReportDefinition {
  id: string
  name: string
  description?: string
  type: 'summary' | 'detailed' | 'chart' | 'table'
  metrics: string[]
  filters?: Record<string, unknown>
  groupBy?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'list'
  title: string
  metric?: string
  chartType?: 'line' | 'bar' | 'pie' | 'donut'
  size: 'small' | 'medium' | 'large' | 'full'
  refreshInterval?: number // in seconds
}

export interface Dashboard {
  id: string
  name: string
  widgets: DashboardWidget[]
  layout?: 'grid' | 'masonry'
  refreshInterval?: number
}

// ==================== 業務相關類型 ====================

export interface TourMetrics {
  totalTours: number
  activeTours: number
  completedTours: number
  cancelledTours: number
  totalParticipants: number
  averageGroupSize: number
  totalRevenue: number
  totalCost: number
  profit: number
  profitMargin: number
}

export interface OrderMetrics {
  totalOrders: number
  paidOrders: number
  unpaidOrders: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  averageOrderValue: number
  paymentRate: number
}

export interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  repeatCustomers: number
  averageLifetimeValue: number
  retentionRate: number
}

export interface FinancialMetrics {
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  accountsReceivable: number
  accountsPayable: number
  cashFlow: number
}
