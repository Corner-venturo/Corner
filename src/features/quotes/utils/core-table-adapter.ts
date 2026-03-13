/**
 * core-table-adapter — 核心表 ↔ 報價分類 轉換器
 *
 * 將 tour_itinerary_items 核心表項目轉換為報價單的 CostCategory[] 格式
 * 將報價單的修改寫回核心表
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { TourItineraryItem } from '@/features/tours/types/tour-itinerary-item.types'
import type { CostCategory, CostItem } from '../types'
import { costCategories } from '../types'

/**
 * 去除核心表中的重複項目
 *
 * 重複原因：syncItineraryToQuote 產生格式化名稱（如 "Day1 午餐：XXX"）寫入 quote.categories，
 * 之後 writePricingToCore 又把這些項目插入核心表，造成與 syncToCore 產生的原始項目重複。
 */
function deduplicateCoreItems(items: TourItineraryItem[]): TourItineraryItem[] {
  // 建立正確項目的索引（有 itinerary_id 的 = 來自 syncToCore）
  const properMealSlots = new Set<string>()
  const properActivityTitles = new Set<string>()
  const properAccommodationSlots = new Map<string, string>() // key → title

  for (const item of items) {
    if (item.category === 'meals' && item.sub_category && item.day_number) {
      properMealSlots.add(`${item.day_number}-${item.sub_category}`)
    }
    if (item.category === 'activities' && item.day_number && item.title) {
      if (!item.title.match(/^Day\d+[：:]/)) {
        properActivityTitles.add(`${item.day_number}-${item.title}`)
      }
    }
    if (item.category === 'accommodation' && item.day_number && item.itinerary_id && item.title) {
      properAccommodationSlots.set(`${item.day_number}`, item.title)
    }
  }

  return items.filter(item => {
    // 餐食去重：格式化名稱（"Day1 午餐：XXX"）且有對應正確項目 → 過濾
    if (item.category === 'meals' && !item.sub_category && item.title) {
      const match = item.title.match(/^Day(\d+)\s*(早餐|午餐|晚餐)[：:]/)
      if (match) {
        const dayNum = parseInt(match[1])
        const subCat = match[2] === '早餐' ? 'breakfast' : match[2] === '午餐' ? 'lunch' : 'dinner'
        if (properMealSlots.has(`${dayNum}-${subCat}`)) return false
      }
    }

    // 活動去重：格式化名稱（"Day1：XXX"）且有對應正確項目 → 過濾
    if (item.category === 'activities' && item.title && item.day_number) {
      const match = item.title.match(/^Day\d+[：:](.+)/)
      if (match && properActivityTitles.has(`${item.day_number}-${match[1]}`)) return false
    }

    // 住宿去重：同一天有兩筆相同飯店，沒有 itinerary_id 的是重複 → 過濾
    if (item.category === 'accommodation' && item.day_number && item.title && !item.itinerary_id) {
      const properTitle = properAccommodationSlots.get(`${item.day_number}`)
      if (properTitle && properTitle === item.title) return false
    }

    return true
  })
}

/**
 * 核心表項目 → 報價分類
 *
 * 按 category 分組到 7 個分類，映射欄位名稱
 */
export function coreItemsToCostCategories(items: TourItineraryItem[]): CostCategory[] {
  // 去重：移除 syncItineraryToQuote 回寫造成的重複項目
  const dedupedItems = deduplicateCoreItems(items)

  // 深拷貝預設分類結構（確保每個分類都存在）
  const categories: CostCategory[] = costCategories.map(cat => ({
    ...cat,
    items: [],
    total: 0,
  }))

  for (const item of dedupedItems) {
    if (!item.category) continue

    const targetCategory = categories.find(c => c.id === item.category)
    if (!targetCategory) continue

    const costItem: CostItem = {
      id: `core-${item.id}`,
      itinerary_item_id: item.id,
      name: item.title || '',
      quantity: item.quantity ?? null,
      unit_price: item.unit_price ?? null,
      total: item.total_cost ?? 0,
      note: item.quote_note || '',
      description: item.description || '',
      day: item.day_number ?? undefined,
      pricing_type: (item.pricing_type as CostItem['pricing_type']) ?? undefined,
      adult_price: item.adult_price ?? undefined,
      child_price: item.child_price ?? undefined,
      infant_price: item.infant_price ?? undefined,
      resource_type: item.resource_type as CostItem['resource_type'],
      resource_id: item.resource_id || undefined,
      resource_latitude: item.latitude ?? undefined,
      resource_longitude: item.longitude ?? undefined,
      resource_google_maps_url: item.google_maps_url ?? undefined,
      sub_category: item.sub_category ?? undefined,
    }

    // 住宿：sub_category → room_type
    if (item.category === 'accommodation' && item.sub_category) {
      costItem.room_type = item.sub_category
    }

    // 團體分攤 / 領隊導遊：推斷 is_group_cost
    if (item.category === 'group-transport' || item.category === 'guide') {
      costItem.is_group_cost = true
    }

    targetCategory.items.push(costItem)
  }

  // 住宿：自動標記續住（同一飯店名稱連續天 → is_same_as_previous）
  const accCat = categories.find(c => c.id === 'accommodation')
  if (accCat) {
    const sorted = accCat.items.slice().sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].name && sorted[i].name === sorted[i - 1].name) {
        sorted[i].is_same_as_previous = true
      }
    }
    accCat.items = sorted
  }

  // 計算各分類 total
  for (const cat of categories) {
    cat.total = cat.items.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  return categories
}

/**
 * 報價單儲存時，把報價欄位寫回核心表
 *
 * - 有 itinerary_item_id → UPDATE 報價欄位
 * - 無 itinerary_item_id → INSERT 新 row
 * - 核心表有但報價單沒有 → 清除報價欄位或 DELETE
 */
export async function writePricingToCore(
  categories: CostCategory[],
  tour_id: string,
  workspace_id: string,
  coreItems: TourItineraryItem[]
): Promise<{ synced: number; inserted: number; cleared: number }> {
  const result = { synced: 0, inserted: 0, cleared: 0 }
  const currentCoreItemIds = new Set<string>()

  for (const category of categories) {
    for (const item of category.items) {
      if (item.itinerary_item_id) {
        // UPDATE: 已有核心表 row → 更新報價欄位
        currentCoreItemIds.add(item.itinerary_item_id)
        const { error } = await supabase
          .from('tour_itinerary_items')
          .update({
            unit_price: item.unit_price ?? null,
            quantity: item.quantity ?? null,
            total_cost: item.total ?? null,
            pricing_type: item.pricing_type ?? null,
            adult_price: item.adult_price ?? null,
            child_price: item.child_price ?? null,
            infant_price: item.infant_price ?? null,
            quote_note: item.note ?? null,
            quote_status: 'drafted',
          })
          .eq('id', item.itinerary_item_id)

        if (error) {
          logger.error('Update core item failed:', { id: item.itinerary_item_id, error })
        } else {
          result.synced++
        }
      } else {
        // INSERT: 報價頁新建的項目 → 插入核心表
        const { data, error } = await supabase
          .from('tour_itinerary_items')
          .insert({
            tour_id,
            workspace_id,
            category: category.id,
            title: item.name || null,
            day_number: item.day ?? null,
            sub_category: item.sub_category || item.room_type || null,
            unit_price: item.unit_price ?? null,
            quantity: item.quantity ?? null,
            total_cost: item.total ?? null,
            pricing_type: item.pricing_type ?? null,
            adult_price: item.adult_price ?? null,
            child_price: item.child_price ?? null,
            infant_price: item.infant_price ?? null,
            quote_note: item.note ?? null,
            quote_status: 'drafted',
            sort_order: 0,
          })
          .select('id')
          .single()

        if (error) {
          logger.error('Insert core item failed:', { category: category.id, error })
        } else if (data) {
          result.inserted++
        }
      }
    }
  }

  // CLEAR / DELETE: 核心表有但報價單已移除的項目
  for (const coreItem of coreItems) {
    if (currentCoreItemIds.has(coreItem.id)) continue

    if (coreItem.itinerary_id) {
      // 行程帶入的項目 → 只清除報價欄位
      if (coreItem.quote_status !== 'none') {
        const { error } = await supabase
          .from('tour_itinerary_items')
          .update({
            unit_price: null,
            quantity: null,
            total_cost: null,
            pricing_type: null,
            adult_price: null,
            child_price: null,
            infant_price: null,
            quote_note: null,
            quote_status: 'none',
          })
          .eq('id', coreItem.id)

        if (!error) result.cleared++
      }
    } else {
      // 報價頁建的項目（無 itinerary_id）→ DELETE row
      const { error } = await supabase
        .from('tour_itinerary_items')
        .delete()
        .eq('id', coreItem.id)

      if (!error) result.cleared++
    }
  }

  return result
}
