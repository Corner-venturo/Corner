/**
 * Quotes feature constants
 */

import { Calculator, FileText, Zap, Users } from 'lucide-react'

/**
 * 報價單狀態篩選選項
 */
export const STATUS_FILTERS = [
  { value: 'all', label: '全部', icon: Calculator },
  { value: 'proposed', label: '提案', icon: FileText },
  { value: '進行中', label: '進行中', icon: FileText },
  { value: 'approved', label: '已核准', icon: FileText },
] as const

/**
 * 報價單類型篩選選項
 */
export const TYPE_FILTERS = [
  { value: 'all', label: '全部', icon: Calculator },
  { value: 'quick', label: '快速', icon: Zap },
  { value: 'group', label: '團體', icon: Users },
] as const

/**
 * 報價單狀態顏色對應
 */
export const STATUS_COLORS: Record<string, string> = {
  proposed: 'text-morandi-gold',
  '進行中': 'text-blue-600',
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
