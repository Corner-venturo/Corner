/**
 * Quotes feature constants
 */

import { Calculator, FileText } from 'lucide-react'

/**
 * 報價單狀態篩選選項
 */
export const STATUS_FILTERS = [
  { value: 'all', label: '全部', icon: Calculator },
  { value: 'proposed', label: '提案', icon: FileText },
  { value: 'approved', label: '已核准', icon: FileText },
] as const

/**
 * 報價單狀態顏色對應
 */
export const STATUS_COLORS: Record<string, string> = {
  proposed: 'text-morandi-gold',
  approved: 'text-green-600',
}

/**
 * 預設報價分類
 */
export const DEFAULT_CATEGORIES = [
  { id: 'transport', name: '交通', items: [], total: 0 },
  { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
  { id: 'accommodation', name: '住宿', items: [], total: 0 },
  { id: 'meals', name: '餐飲', items: [], total: 0 },
  { id: 'activities', name: '活動', items: [], total: 0 },
  { id: 'others', name: '其他', items: [], total: 0 },
  { id: 'guide', name: '領隊導遊', items: [], total: 0 },
]
