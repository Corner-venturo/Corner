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
      // 查詢供應商回覆
      let query = supabase
        .from('request_responses')
        .select(`
          id,
          request_id,
          responder_workspace_id,
          status,
          total_amount,
          notes,
          created_at,
          workspaces:responder_workspace_id (name),
          tour_requests:request_id (
            id,
            code,
            category,
            tour_name,
            service_date,
            service_date_end
          ),
          request_response_items (
            id,
            resource_type,
            resource_name,
            license_plate,
            driver_name,
            driver_phone,
            available_start_date,
            available_end_date,
            unit_price,
            notes,
            created_at
          )
        `)

      // 只查詢發給當前 workspace 的需求的回覆
      // 或者當前 workspace 發出的回覆（供應商視角）
      // RLS 已在 DB 層處理 workspace 權限過濾

      if (requestId) {
        query = query.eq('request_id', requestId)
      }

      if (submittedOnly) {
        query = query.neq('status', 'draft')
      }

      const { data, error } = await query

      if (error) throw error

      // 轉換資料格式
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        request_id: row.request_id as string,
        supplier_workspace_id: row.responder_workspace_id as string,
        supplier_workspace_name: (row.workspaces as { name: string } | null)?.name || null,
        status: row.status as 'draft' | 'submitted' | 'accepted' | 'rejected',
        total_price: row.total_amount as number | null,
        notes: row.notes as string | null,
        responded_at: row.created_at as string | null,
        created_at: row.created_at as string,
        items: ((row.request_response_items as Record<string, unknown>[]) || []).map((item) => ({
          id: item.id as string,
          response_id: row.id as string,
          item_type: item.resource_type as 'vehicle' | 'leader' | 'other',
          item_name: item.resource_name as string,
          item_description: item.notes as string | null,
          unit_price: item.unit_price as number | null,
          quantity: 1,
          available_date_start: item.available_start_date as string | null,
          available_date_end: item.available_end_date as string | null,
          notes: item.notes as string | null,
          created_at: item.created_at as string,
        })),
        request: row.tour_requests ? {
          id: (row.tour_requests as Record<string, unknown>).id as string,
          code: (row.tour_requests as Record<string, unknown>).code as string,
          category: (row.tour_requests as Record<string, unknown>).category as string,
          tour_name: (row.tour_requests as Record<string, unknown>).tour_name as string | null,
          service_date: (row.tour_requests as Record<string, unknown>).service_date as string | null,
          service_date_end: (row.tour_requests as Record<string, unknown>).service_date_end as string | null,
        } : undefined,
      }))
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
