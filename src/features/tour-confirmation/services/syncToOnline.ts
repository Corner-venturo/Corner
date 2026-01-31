/**
 * 同步行程到 Online App
 * 
 * 當確認單交接時呼叫，將行程資料同步到 online_trips 表
 * 
 * TODO: online_trips 表建立後，重新執行 supabase gen types 更新類型
 */

import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface SyncResult {
  success: boolean
  message: string
  onlineTripId?: string
}

/** online_trips 表的資料結構（尚未加入 Database 類型） */
interface OnlineTrip {
  id: string
  erp_tour_id: string
  erp_itinerary_id: string | null
  code: string
  name: string
  departure_date: string
  return_date: string
  destination: string | null
  daily_itinerary: unknown[]
  leader_info: unknown | null
  meeting_info: unknown | null
  outbound_flight: unknown | null
  return_flight: unknown | null
  status: string
  handoff_at: string
  workspace_id: string
  updated_at: string
}

type OnlineTripInsert = Omit<OnlineTrip, 'id'>

/** 無類型的 Supabase client（用於尚未加入 Database 類型的表） */
const untypedSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * 同步行程到 Online
 */
export async function syncTripToOnline(tourId: string): Promise<SyncResult> {
  try {
    // 1. 取得旅遊團資料
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tourError || !tour) {
      return { success: false, message: '找不到旅遊團資料' }
    }

    // 2. 取得行程表資料
    const { data: itinerary } = await supabase
      .from('itineraries')
      .select('*')
      .eq('tour_id', tourId)
      .maybeSingle()

    // 3. 檢查是否已經同步過
    const { data: existingTrip } = await untypedSupabase
      .from('online_trips')
      .select('id')
      .eq('erp_tour_id', tourId)
      .maybeSingle<Pick<OnlineTrip, 'id'>>()

    // 4. 準備同步資料
    const dailyItinerary = itinerary?.daily_itinerary
    const syncData: OnlineTripInsert = {
      erp_tour_id: tourId,
      erp_itinerary_id: itinerary?.id ?? null,
      code: tour.code,
      name: tour.name,
      departure_date: tour.departure_date,
      return_date: tour.return_date,
      destination: tour.location ?? null,
      daily_itinerary: Array.isArray(dailyItinerary) ? dailyItinerary : [],
      leader_info: itinerary?.leader ?? null,
      meeting_info: itinerary?.meeting_info ?? null,
      outbound_flight: (tour as Record<string, unknown>).outbound_flight ?? null,
      return_flight: (tour as Record<string, unknown>).return_flight ?? null,
      status: 'active',
      handoff_at: new Date().toISOString(),
      workspace_id: tour.workspace_id ?? '',
      updated_at: new Date().toISOString(),
    }

    let onlineTripId: string

    if (existingTrip) {
      // 更新現有記錄
      const { error: updateError } = await untypedSupabase
        .from('online_trips')
        .update(syncData)
        .eq('id', existingTrip.id)

      if (updateError) {
        logger.error('更新 Online 行程失敗:', updateError)
        return { success: false, message: updateError.message }
      }

      onlineTripId = existingTrip.id
      logger.info(`行程已更新到 Online: ${onlineTripId}`)
    } else {
      // 建立新記錄
      const { data: newTrip, error: insertError } = await untypedSupabase
        .from('online_trips')
        .insert(syncData)
        .select('id')
        .single<Pick<OnlineTrip, 'id'>>()

      if (insertError || !newTrip) {
        logger.error('建立 Online 行程失敗:', insertError)
        return { success: false, message: insertError?.message ?? '建立失敗' }
      }

      onlineTripId = newTrip.id
      logger.info(`行程已同步到 Online: ${onlineTripId}`)
    }

    return {
      success: true,
      message: '同步成功',
      onlineTripId,
    }
  } catch (error) {
    logger.error('同步到 Online 時發生錯誤:', error)
    return { success: false, message: '同步失敗' }
  }
}
