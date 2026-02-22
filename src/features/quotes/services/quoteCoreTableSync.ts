/**
 * quoteCoreTableSync — 報價單 ↔ 核心表同步
 *
 * 報價單儲存時，把報價欄位寫回 tour_itinerary_items
 * 從核心表讀取行程項目，轉為報價項目
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { CostCategory, CostItem } from '../types'
import type { TourItineraryItem } from '@/features/tours/types/tour-itinerary-item.types'
import { ITINERARY_ITEM_CATEGORIES } from '@/features/tours/types/tour-itinerary-item.types'
import { QUOTE_CATEGORY_LABELS } from '../constants/labels'

// === Labels ===
const SYNC_LABELS = {
  SYNC_START: 'Syncing quote pricing to core table',
  SYNC_COMPLETE: 'Quote → core table sync complete',
  SYNC_ERROR: 'Quote → core table sync failed',
  IMPORT_START: 'Importing itinerary items to quote',
  IMPORT_COMPLETE: 'Itinerary import complete',
  IMPORT_ERROR: 'Itinerary import failed',
  NO_TOUR_ID: 'No tour_id, skipping core table sync',
  NO_ITEMS_TO_SYNC: 'No items with itinerary_item_id to sync',
} as const

/**
 * 報價單儲存時，把報價欄位同步到核心表
 */
export async function syncQuotePricingToCore(
  categories: CostCategory[],
  tour_id: string | null,
): Promise<{ success: boolean; synced_count: number; message?: string }> {
  if (!tour_id) {
    return { success: true, synced_count: 0, message: SYNC_LABELS.NO_TOUR_ID }
  }

  logger.log(SYNC_LABELS.SYNC_START, { tour_id })

  try {
    // 收集所有有 itinerary_item_id 的項目
    const items_to_sync: Array<{
      itinerary_item_id: string
      unit_price: number | null
      quantity: number | null
      total_cost: number | null
      pricing_type: string | null
      adult_price: number | null
      child_price: number | null
      infant_price: number | null
      quote_note: string | null
    }> = []

    for (const category of categories) {
      for (const item of category.items) {
        if (!item.itinerary_item_id) continue

        items_to_sync.push({
          itinerary_item_id: item.itinerary_item_id,
          unit_price: item.unit_price ?? null,
          quantity: item.quantity ?? null,
          total_cost: item.total ?? null,
          pricing_type: item.pricing_type ?? null,
          adult_price: item.adult_price ?? null,
          child_price: item.child_price ?? null,
          infant_price: item.infant_price ?? null,
          quote_note: item.note ?? item.notes ?? null,
        })
      }
    }

    if (items_to_sync.length === 0) {
      return { success: true, synced_count: 0, message: SYNC_LABELS.NO_ITEMS_TO_SYNC }
    }

    // 批次更新核心表
    let synced_count = 0
    for (const item of items_to_sync) {
      const { error } = await supabase
        .from('tour_itinerary_items')
        .update({
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_cost: item.total_cost,
          pricing_type: item.pricing_type,
          adult_price: item.adult_price,
          child_price: item.child_price,
          infant_price: item.infant_price,
          quote_note: item.quote_note,
          quote_status: 'drafted',
        })
        .eq('id', item.itinerary_item_id)

      if (error) {
        logger.error(SYNC_LABELS.SYNC_ERROR, { id: item.itinerary_item_id, error })
      } else {
        synced_count++
      }
    }

    logger.log(SYNC_LABELS.SYNC_COMPLETE, { synced_count, total: items_to_sync.length })
    return { success: true, synced_count }
  } catch (error) {
    logger.error(SYNC_LABELS.SYNC_ERROR, error)
    return { success: false, synced_count: 0, message: String(error) }
  }
}

// === Category ID → core table category 映射 ===
const CATEGORY_MAP: Record<string, string> = {
  transport: ITINERARY_ITEM_CATEGORIES.TRANSPORT,
  'group-transport': ITINERARY_ITEM_CATEGORIES.GROUP_TRANSPORT,
  accommodation: ITINERARY_ITEM_CATEGORIES.ACCOMMODATION,
  meals: ITINERARY_ITEM_CATEGORIES.MEALS,
  activities: ITINERARY_ITEM_CATEGORIES.ACTIVITIES,
  others: ITINERARY_ITEM_CATEGORIES.OTHERS,
  guide: ITINERARY_ITEM_CATEGORIES.GUIDE,
}

// 反向映射：core table category → quote category ID
const REVERSE_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k])
)

/**
 * 從核心表讀取行程項目，轉為報價項目
 */
export async function importItineraryItemsToQuote(
  tour_id: string,
  existing_categories: CostCategory[],
): Promise<{ success: boolean; categories: CostCategory[]; imported_count: number; message?: string }> {
  logger.log(SYNC_LABELS.IMPORT_START, { tour_id })

  try {
    // 讀取核心表中該團的所有項目
    const { data: core_items, error } = await supabase
      .from('tour_itinerary_items')
      .select('*')
      .eq('tour_id', tour_id)
      .order('day_number', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (!core_items || core_items.length === 0) {
      return { success: true, categories: existing_categories, imported_count: 0, message: 'No items found' }
    }

    // 收集已有的 itinerary_item_id，避免重複
    const existing_item_ids = new Set<string>()
    for (const cat of existing_categories) {
      for (const item of cat.items) {
        if (item.itinerary_item_id) {
          existing_item_ids.add(item.itinerary_item_id)
        }
      }
    }

    // 深拷貝 categories
    const new_categories: CostCategory[] = existing_categories.map(cat => ({
      ...cat,
      items: [...cat.items],
    }))

    let imported_count = 0

    for (const core_item of (core_items as TourItineraryItem[])) {
      // 跳過已存在的
      if (existing_item_ids.has(core_item.id)) continue

      // 找到對應的 category
      const quote_category_id = core_item.category
        ? REVERSE_CATEGORY_MAP[core_item.category]
        : null
      if (!quote_category_id) continue

      const target_category = new_categories.find(c => c.id === quote_category_id)
      if (!target_category) continue

      // 建立 CostItem
      const cost_item: CostItem = {
        id: `core-${core_item.id}-${Date.now()}`,
        itinerary_item_id: core_item.id,
        name: core_item.title || '',
        quantity: core_item.quantity ?? null,
        unit_price: core_item.unit_price ?? null,
        total: core_item.total_cost ?? 0,
        note: core_item.quote_note || '',
        description: core_item.description || '',
        day: core_item.day_number ?? undefined,
        pricing_type: (core_item.pricing_type as CostItem['pricing_type']) ?? undefined,
        adult_price: core_item.adult_price ?? undefined,
        child_price: core_item.child_price ?? undefined,
        infant_price: core_item.infant_price ?? undefined,
        resource_type: core_item.resource_type as CostItem['resource_type'],
        resource_id: core_item.resource_id || undefined,
      }

      // 住宿特殊處理：sub_category 可作為 room_type
      if (quote_category_id === 'accommodation' && core_item.sub_category) {
        cost_item.room_type = core_item.sub_category
      }

      target_category.items.push(cost_item)
      imported_count++
    }

    // 重新計算各 category 的 total
    for (const cat of new_categories) {
      cat.total = cat.items.reduce((sum, item) => sum + (item.total || 0), 0)
    }

    logger.log(SYNC_LABELS.IMPORT_COMPLETE, { imported_count })
    return { success: true, categories: new_categories, imported_count }
  } catch (error) {
    logger.error(SYNC_LABELS.IMPORT_ERROR, error)
    return { success: false, categories: existing_categories, imported_count: 0, message: String(error) }
  }
}
