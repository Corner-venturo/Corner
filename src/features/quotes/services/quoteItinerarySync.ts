/**
 * 報價單 ↔ 行程表 飯店同步服務
 *
 * 功能：
 * 1. 報價單改飯店 → 行程表自動更新
 * 2. 行程表改飯店 → 報價單自動更新
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { CostCategory, CostItem } from '../types'
import type { DailyItineraryDay } from '@/stores/types'
import type { Json } from '@/lib/supabase/types'

interface SyncResult {
  success: boolean
  message: string
}

/**
 * 從報價單同步飯店到行程表
 * 當報價單的住宿項目更新時呼叫
 */
export async function syncHotelsFromQuoteToItinerary(
  quoteId: string,
  accommodationItems: CostItem[]
): Promise<SyncResult> {
  try {
    // 1. 取得報價單關聯的 itinerary_id
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('itinerary_id, tour_id')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return { success: false, message: '找不到報價單' }
    }

    // 優先用 itinerary_id，否則從 tour_id 找
    let itineraryId: string | null = quote.itinerary_id || null

    if (!itineraryId && quote.tour_id) {
      const { data: itinerary } = await supabase
        .from('itineraries')
        .select('id')
        .eq('tour_id', quote.tour_id)
        .maybeSingle()

      itineraryId = itinerary?.id || null
    }

    if (!itineraryId) {
      // 沒有關聯的行程表，不需要同步
      return { success: true, message: '無關聯行程表，跳過同步' }
    }

    // 2. 取得行程表
    const { data: itinerary, error: itineraryError } = await supabase
      .from('itineraries')
      .select('daily_itinerary')
      .eq('id', itineraryId)
      .single()

    if (itineraryError || !itinerary) {
      return { success: false, message: '找不到行程表' }
    }

    const dailyItinerary = (itinerary.daily_itinerary || []) as unknown as DailyItineraryDay[]

    // 3. 根據報價單住宿項目更新行程表
    let updated = false
    const updatedDailyItinerary = dailyItinerary.map((day, index) => {
      const dayNumber = index + 1
      // 找到對應天數的住宿項目
      const hotelItem = accommodationItems.find(item => item.day === dayNumber)

      if (hotelItem && hotelItem.name && day.accommodation !== hotelItem.name) {
        updated = true
        return {
          ...day,
          accommodation: hotelItem.name,
        }
      }
      return day
    })

    if (!updated) {
      return { success: true, message: '無需更新' }
    }

    // 4. 更新行程表
    const { error: updateError } = await supabase
      .from('itineraries')
      .update({
        daily_itinerary: updatedDailyItinerary as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itineraryId)

    if (updateError) {
      logger.error('同步飯店到行程表失敗:', updateError)
      return { success: false, message: updateError.message }
    }

    logger.info(`報價單 ${quoteId} 飯店已同步到行程表 ${itineraryId}`)
    return { success: true, message: '同步成功' }
  } catch (error) {
    logger.error('同步飯店時發生錯誤:', error)
    return { success: false, message: '同步失敗' }
  }
}

/**
 * 從行程表同步飯店到報價單
 * 當行程表的 accommodation 更新時呼叫
 */
export async function syncHotelsFromItineraryToQuote(
  itineraryId: string,
  dailyItinerary: DailyItineraryDay[]
): Promise<SyncResult> {
  try {
    // 1. 取得關聯的報價單
    const { data: itinerary, error: itineraryError } = await supabase
      .from('itineraries')
      .select('tour_id')
      .eq('id', itineraryId)
      .single()

    if (itineraryError || !itinerary) {
      return { success: false, message: '找不到行程表' }
    }

    // 從 tour_id 找報價單，或直接用 itinerary_id 找
    let quoteId: string | null = null

    // 先找直接關聯的報價單
    const { data: directQuote } = await supabase
      .from('quotes')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .maybeSingle()

    if (directQuote) {
      quoteId = directQuote.id
    } else if (itinerary.tour_id) {
      // 從 tour_id 找報價單
      const { data: tourQuote } = await supabase
        .from('quotes')
        .select('id')
        .eq('tour_id', itinerary.tour_id)
        .maybeSingle()

      quoteId = tourQuote?.id || null
    }

    if (!quoteId) {
      // 沒有關聯的報價單，不需要同步
      return { success: true, message: '無關聯報價單，跳過同步' }
    }

    // 2. 取得報價單的 categories
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('categories, versions, current_version_index')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return { success: false, message: '找不到報價單資料' }
    }

    // 3. 更新 categories 中的 accommodation 項目
    const categories = (quote.categories || []) as unknown as CostCategory[]
    const accommodationCategoryIndex = categories.findIndex(cat => cat.id === 'accommodation')

    if (accommodationCategoryIndex === -1) {
      return { success: true, message: '報價單無住宿類別，跳過同步' }
    }

    let updated = false
    const updatedCategories = [...categories]
    const accommodationCategory = { ...updatedCategories[accommodationCategoryIndex] }
    const updatedItems = accommodationCategory.items.map(item => {
      if (item.day && item.day > 0 && item.day <= dailyItinerary.length) {
        const dayItinerary = dailyItinerary[item.day - 1]
        if (dayItinerary.accommodation && item.name !== dayItinerary.accommodation) {
          updated = true
          return {
            ...item,
            name: dayItinerary.accommodation,
          }
        }
      }
      return item
    })

    if (!updated) {
      return { success: true, message: '無需更新' }
    }

    accommodationCategory.items = updatedItems
    updatedCategories[accommodationCategoryIndex] = accommodationCategory

    // 4. 更新報價單（同時更新 categories 和當前版本）
    const updateData: Record<string, unknown> = {
      categories: updatedCategories,
      updated_at: new Date().toISOString(),
    }

    // 如果有版本系統，也更新當前版本
    if (quote.versions && Array.isArray(quote.versions) && quote.current_version_index !== null) {
      const versions = [...(quote.versions as unknown[])]
      const currentIndex = quote.current_version_index as number
      if (versions[currentIndex] && typeof versions[currentIndex] === 'object') {
        versions[currentIndex] = {
          ...(versions[currentIndex] as Record<string, unknown>),
          categories: updatedCategories,
        }
        updateData.versions = versions
      }
    }

    const { error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId)

    if (updateError) {
      logger.error('同步飯店到報價單失敗:', updateError)
      return { success: false, message: updateError.message }
    }

    logger.info(`行程表 ${itineraryId} 飯店已同步到報價單 ${quoteId}`)
    return { success: true, message: '同步成功' }
  } catch (error) {
    logger.error('同步飯店時發生錯誤:', error)
    return { success: false, message: '同步失敗' }
  }
}
