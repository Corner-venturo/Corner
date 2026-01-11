/**
 * useSupplierResponses - 取得供應商回覆的可用資源
 *
 * 查詢 request_responses 表，取得供應商針對跨公司需求的回覆內容
 * 包含回覆的車輛、領隊等資源資訊
 */

'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'

// 供應商回覆項目類型
export interface SupplierResponseItem {
  id: string
  response_id: string
  item_type: 'vehicle' | 'leader' | 'other'
  item_name: string
  item_description: string | null
  unit_price: number | null
  quantity: number
  available_date_start: string | null
  available_date_end: string | null
  notes: string | null
  created_at: string
}

// 供應商回覆類型（包含項目）
export interface SupplierResponse {
  id: string
  request_id: string
  supplier_workspace_id: string
  supplier_workspace_name: string | null
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  total_price: number | null
  notes: string | null
  responded_at: string | null
  created_at: string
  items: SupplierResponseItem[]
  // 關聯的需求單資訊
  request?: {
    id: string
    code: string
    category: string
    tour_name: string | null
    service_date: string | null
    service_date_end: string | null
  }
}

// 可用資源（來自供應商回覆）
export interface AvailableResource {
  id: string
  type: 'vehicle' | 'leader'
  name: string
  description: string | null
  supplierName: string
  responseId: string
  requestId: string
  unitPrice: number | null
  availableDateStart: string | null
  availableDateEnd: string | null
  status: 'submitted' | 'accepted' | 'rejected'
}

interface UseSupplierResponsesOptions {
  // 過濾特定需求單的回覆
  requestId?: string
  // 過濾特定類型的回覆項目
  itemType?: 'vehicle' | 'leader' | 'other'
  // 只顯示已提交的回覆
  submittedOnly?: boolean
}

export function useSupplierResponses(options?: UseSupplierResponsesOptions) {
  const { requestId, itemType, submittedOnly = true } = options || {}
  const workspaceId = useAuthStore(state => state.user?.workspace_id)

  const fetcher = async (): Promise<SupplierResponse[]> => {
    if (!workspaceId) return []

    try {
      // TODO: 當 request_responses 表建立後啟用此查詢
      // 目前返回空陣列，因為表格尚未建立
      logger.log('⚠️ request_responses 表尚未建立，返回空資料')
      return []

      // 未來實作：
      // const { data, error } = await supabase
      //   .from('request_responses')
      //   .select('...')
      // ...
    } catch (error) {
      logger.error('取得供應商回覆失敗:', error)
      return []
    }
  }

  const cacheKey = workspaceId
    ? `supplier-responses:${workspaceId}:${requestId || 'all'}:${itemType || 'all'}:${submittedOnly}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  // 轉換為可用資源列表
  const availableResources: AvailableResource[] = (data || []).flatMap(response =>
    response.items.map(item => ({
      id: item.id,
      type: item.item_type === 'leader' ? 'leader' : 'vehicle',
      name: item.item_name,
      description: item.item_description,
      supplierName: response.supplier_workspace_name || '未知供應商',
      responseId: response.id,
      requestId: response.request_id,
      unitPrice: item.unit_price,
      availableDateStart: item.available_date_start,
      availableDateEnd: item.available_date_end,
      status: response.status as 'submitted' | 'accepted' | 'rejected',
    }))
  )

  return {
    responses: data || [],
    availableResources,
    isLoading,
    isValidating,
    error,
    refetch: () => mutate(),
  }
}
