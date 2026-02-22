/**
 * requestCoreTableSync — 需求單 ↔ 核心表同步
 *
 * 需求單建立/狀態變更時，同步寫回 tour_itinerary_items
 * 從核心表讀取已報價但未發需求的項目，批量產生需求單
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { TourItineraryItem } from '@/features/tours/types/tour-itinerary-item.types'
import { ITEM_REQUEST_STATUS } from '@/features/tours/types/tour-itinerary-item.types'

// === Labels ===
const SYNC_LABELS = {
  SYNC_START: 'Syncing request status to core table',
  SYNC_COMPLETE: 'Request → core table sync complete',
  SYNC_ERROR: 'Request → core table sync failed',
  GENERATE_START: 'Generating requests from core table',
  GENERATE_COMPLETE: 'Request generation complete',
  GENERATE_ERROR: 'Request generation failed',
  NO_ITEMS: 'No items to generate requests for',
} as const

// === 需求單狀態 → 核心表 request_status 映射 ===
const STATUS_MAP: Record<string, string> = {
  draft: ITEM_REQUEST_STATUS.NONE,
  sent: ITEM_REQUEST_STATUS.SENT,
  replied: ITEM_REQUEST_STATUS.REPLIED,
  confirmed: ITEM_REQUEST_STATUS.CONFIRMED,
  cancelled: ITEM_REQUEST_STATUS.CANCELLED,
}

/**
 * 需求單建立後，更新核心表的 request_id 和 request_status
 */
export async function syncRequestCreateToCore(params: {
  request_id: string
  itinerary_item_id: string
  supplier_id?: string | null
  supplier_name?: string | null
  status?: string
}): Promise<{ success: boolean; message?: string }> {
  const { request_id, itinerary_item_id, supplier_id, supplier_name, status } = params

  logger.log(SYNC_LABELS.SYNC_START, { request_id, itinerary_item_id })

  try {
    const core_status = STATUS_MAP[status || 'draft'] || ITEM_REQUEST_STATUS.NONE
    const update_data: Record<string, unknown> = {
      request_id,
      request_status: core_status,
    }

    if (supplier_id !== undefined) update_data.supplier_id = supplier_id
    if (supplier_name !== undefined) update_data.supplier_name = supplier_name

    const { error } = await supabase
      .from('tour_itinerary_items')
      .update(update_data)
      .eq('id', itinerary_item_id)

    if (error) {
      logger.error(SYNC_LABELS.SYNC_ERROR, { itinerary_item_id, error })
      return { success: false, message: String(error.message) }
    }

    logger.log(SYNC_LABELS.SYNC_COMPLETE, { request_id, itinerary_item_id })
    return { success: true }
  } catch (error) {
    logger.error(SYNC_LABELS.SYNC_ERROR, error)
    return { success: false, message: String(error) }
  }
}

/**
 * 需求單狀態變更時，同步核心表
 */
export async function syncRequestStatusToCore(params: {
  itinerary_item_id: string
  status: string
  reply_content?: Record<string, unknown> | null
  reply_cost?: number | null
}): Promise<{ success: boolean; message?: string }> {
  const { itinerary_item_id, status, reply_content, reply_cost } = params

  logger.log(SYNC_LABELS.SYNC_START, { itinerary_item_id, status })

  try {
    const core_status = STATUS_MAP[status] || ITEM_REQUEST_STATUS.NONE
    const update_data: Record<string, unknown> = {
      request_status: core_status,
    }

    const now = new Date().toISOString()

    if (status === 'sent') {
      update_data.request_sent_at = now
    } else if (status === 'replied') {
      update_data.request_reply_at = now
      if (reply_content !== undefined) update_data.reply_content = reply_content
      if (reply_cost !== undefined) update_data.reply_cost = reply_cost
    }
    // confirmed / cancelled only update status

    const { error } = await supabase
      .from('tour_itinerary_items')
      .update(update_data)
      .eq('id', itinerary_item_id)

    if (error) {
      logger.error(SYNC_LABELS.SYNC_ERROR, { itinerary_item_id, error })
      return { success: false, message: String(error.message) }
    }

    logger.log(SYNC_LABELS.SYNC_COMPLETE, { itinerary_item_id, status })
    return { success: true }
  } catch (error) {
    logger.error(SYNC_LABELS.SYNC_ERROR, error)
    return { success: false, message: String(error) }
  }
}

// === 供應商分組的核心表項目 ===
export interface SupplierGroup {
  supplier_id: string | null
  supplier_name: string | null
  category: string | null
  items: TourItineraryItem[]
}

/**
 * 從核心表讀取已報價但未發需求的項目，按供應商分組
 */
export async function getUnrequestedItems(
  tour_id: string,
): Promise<{ success: boolean; groups: SupplierGroup[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('tour_itinerary_items')
      .select('*')
      .eq('tour_id', tour_id)
      .neq('quote_status', 'none')
      .eq('request_status', 'none')
      .order('day_number', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!data || data.length === 0) {
      return { success: true, groups: [], message: SYNC_LABELS.NO_ITEMS }
    }

    const core_items = data as TourItineraryItem[]

    // 按 supplier_name + category 分組
    const group_map = new Map<string, SupplierGroup>()
    for (const item of core_items) {
      const key = `${item.supplier_name || '_none_'}::${item.category || '_none_'}`
      if (!group_map.has(key)) {
        group_map.set(key, {
          supplier_id: item.supplier_id,
          supplier_name: item.supplier_name,
          category: item.category,
          items: [],
        })
      }
      group_map.get(key)!.items.push(item)
    }

    return { success: true, groups: Array.from(group_map.values()) }
  } catch (error) {
    logger.error(SYNC_LABELS.GENERATE_ERROR, error)
    return { success: false, groups: [], message: String(error) }
  }
}

/**
 * 從核心表項目批量建立需求單
 */
export async function generateRequestsFromCoreItems(params: {
  tour_id: string
  tour_code: string
  tour_name: string
  workspace_id: string
  created_by: string
  created_by_name: string
  groups: SupplierGroup[]
}): Promise<{ success: boolean; created_count: number; message?: string }> {
  const { tour_id, tour_code, tour_name, workspace_id, created_by, created_by_name, groups } = params

  logger.log(SYNC_LABELS.GENERATE_START, { tour_id, group_count: groups.length })

  try {
    let created_count = 0

    // 取得現有需求單數量來生成編號
    const { data: existing_requests } = await supabase
      .from('tour_requests')
      .select('code')
      .eq('tour_id', tour_id)

    let request_index = (existing_requests?.length || 0) + 1

    for (const group of groups) {
      // 每組供應商 + 類別產生一張需求單（用第一個項目的資訊）
      const first_item = group.items[0]
      const request_code = `${tour_code}-RQ${String(request_index).padStart(2, '0')}`

      // 將多個項目的標題合併為一個需求單的 title + description
      const combined_title = group.items.length === 1
        ? first_item.title || ''
        : `${group.supplier_name || ''} - ${group.items.length} items`

      const combined_description = group.items
        .map(item => {
          const date_str = item.service_date || ''
          return `${date_str} ${item.title || ''}`
        })
        .join('\n')

      const { data: new_request, error: insert_error } = await supabase
        .from('tour_requests')
        .insert({
          code: request_code,
          tour_id,
          tour_code,
          tour_name,
          workspace_id,
          category: group.category || 'others',
          supplier_id: group.supplier_id,
          supplier_name: group.supplier_name,
          title: combined_title,
          description: combined_description,
          service_date: first_item.service_date,
          service_date_end: group.items.length > 1
            ? group.items[group.items.length - 1].service_date
            : first_item.service_date_end,
          quantity: group.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
          estimated_cost: group.items.reduce((sum, item) => sum + (item.total_cost || 0), 0),
          status: 'draft',
          handler_type: 'internal',
          created_by,
          created_by_name,
          // 第一個項目的 itinerary_item_id
          itinerary_item_id: first_item.id,
        })
        .select('id')
        .single()

      if (insert_error) {
        logger.error(SYNC_LABELS.GENERATE_ERROR, { group: group.supplier_name, error: insert_error })
        continue
      }

      // 更新核心表的 request_id 和 request_status
      if (new_request) {
        const item_ids = group.items.map(item => item.id)
        await supabase
          .from('tour_itinerary_items')
          .update({
            request_id: new_request.id,
            request_status: ITEM_REQUEST_STATUS.NONE, // draft = none in core
          })
          .in('id', item_ids)

        created_count++
        request_index++
      }
    }

    logger.log(SYNC_LABELS.GENERATE_COMPLETE, { created_count })
    return { success: true, created_count }
  } catch (error) {
    logger.error(SYNC_LABELS.GENERATE_ERROR, error)
    return { success: false, created_count: 0, message: String(error) }
  }
}
