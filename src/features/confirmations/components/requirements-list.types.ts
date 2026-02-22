/**
 * RequirementsList 相關型別定義
 */

import type { Tour } from '@/stores/types'
import type { ProposalPackage } from '@/types/proposal.types'

// ============================================
// Props
// ============================================

export interface RequirementsListProps {
  tourId?: string
  proposalPackageId?: string
  quoteId?: string | null
  onOpenRequestDialog?: (data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  }) => void
  className?: string
}

// ============================================
// 需求單
// ============================================

export interface TourRequest {
  id: string
  code: string
  category: string
  supplier_name: string
  title: string
  service_date: string | null
  quantity: number | null
  note?: string | null
  status?: string | null
  quoted_cost?: number | null
  hidden?: boolean | null
  resource_id?: string | null
  resource_type?: string | null
}

// ============================================
// 報價單項目
// ============================================

export interface QuoteItem {
  category: string
  supplierName: string
  title: string
  serviceDate: string | null
  quantity: number
  key: string
  notes?: string
  resourceType?: string | null
  resourceId?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  quotedPrice?: number | null
  itinerary_item_id?: string | null
}

// ============================================
// 分類
// ============================================

export type CategoryKey = 'transport' | 'accommodation' | 'meal' | 'activity' | 'other'

export const CATEGORIES: { key: CategoryKey; label: string; quoteCategoryId: string }[] = [
  { key: 'transport', label: '交通', quoteCategoryId: 'transport' },
  { key: 'accommodation', label: '住宿', quoteCategoryId: 'accommodation' },
  { key: 'meal', label: '餐食', quoteCategoryId: 'meals' },
  { key: 'activity', label: '活動', quoteCategoryId: 'activities' },
  { key: 'other', label: '其他', quoteCategoryId: 'others' },
]

export function safeGetCategoryKey(category: string): CategoryKey {
  const validKeys: CategoryKey[] = ['transport', 'accommodation', 'meal', 'activity', 'other']
  return validKeys.includes(category as CategoryKey) ? (category as CategoryKey) : 'other'
}
