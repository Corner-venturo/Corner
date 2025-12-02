/**
 * Quote 狀態定義與對照
 * 用於統一前端顯示與資料庫欄位
 */

import type { Quote } from '@/stores/types'

// 報價單狀態對照
export const QUOTE_STATUS_LABELS = {
  draft: '草稿',
  proposed: '提案',
  revised: '修改中',
  approved: '已核准',
  converted: '已轉單',
  rejected: '已拒絕',
  billed: '已請款',
} as any

// 報價單狀態顏色
export const QUOTE_STATUS_COLORS = {
  draft: 'bg-morandi-secondary text-white',
  proposed: 'bg-morandi-gold text-white',
  revised: 'bg-blue-500 text-white',
  approved: 'bg-morandi-green text-white',
  converted: 'bg-morandi-primary text-white',
  rejected: 'bg-morandi-red text-white',
  billed: 'bg-purple-500 text-white',
} as any

// 狀態篩選選項
// @ts-expect-error - Const assertion compatibility
export const QUOTE_STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'proposed', label: '提案' },
  { value: 'revised', label: '修改中' },
  { value: 'approved', label: '已核准' },
  { value: 'converted', label: '已轉單' },
  { value: 'rejected', label: '已拒絕' },
  { value: 'billed', label: '已請款' },
]
