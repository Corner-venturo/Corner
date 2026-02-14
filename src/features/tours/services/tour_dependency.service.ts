/**
 * tour_dependency.service.ts - 旅遊團關聯資料檢查與清理
 *
 * 提供旅遊團刪除前的關聯檢查、斷開連結等操作。
 * 統一了 useTourOperations 和 archive-management 中的重複邏輯。
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface TourDependencyCheck {
  blockers: string[]
  hasBlockers: boolean
}

/**
 * 檢查旅遊團是否有不可刪除的關聯資料
 */
export async function checkTourDependencies(tourId: string): Promise<TourDependencyCheck> {
  const checks = await Promise.all([
    supabase.from('order_members').select('id', { count: 'exact', head: true }).eq('tour_id', tourId),
    supabase.from('receipt_orders').select('id', { count: 'exact', head: true }).eq('tour_id', tourId),
    supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('tour_id', tourId),
    supabase.from('pnrs').select('id', { count: 'exact', head: true }).eq('tour_id', tourId),
  ])

  const [members, receipts, payments, pnrs] = checks
  const blockers: string[] = []

  if (members.count && members.count > 0) blockers.push(`${members.count} 位團員`)
  if (receipts.count && receipts.count > 0) blockers.push(`${receipts.count} 筆收款單`)
  if (payments.count && payments.count > 0) blockers.push(`${payments.count} 筆請款單`)
  if (pnrs.count && pnrs.count > 0) blockers.push(`${pnrs.count} 筆 PNR`)

  return { blockers, hasBlockers: blockers.length > 0 }
}

/**
 * 檢查旅遊團是否有已付款訂單
 */
export async function checkTourPaidOrders(tourId: string): Promise<{ hasPaidOrders: boolean; count: number }> {
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('id, payment_status')
    .eq('tour_id', tourId)
    .neq('payment_status', 'unpaid')

  return {
    hasPaidOrders: (paidOrders?.length ?? 0) > 0,
    count: paidOrders?.length ?? 0,
  }
}

/**
 * 刪除旅遊團的空訂單（沒有團員的）
 */
export async function deleteTourEmptyOrders(tourId: string): Promise<void> {
  await supabase.from('orders').delete().eq('tour_id', tourId)
}

/**
 * 斷開旅遊團關聯的報價單（不刪除，只解除連結）
 */
export async function unlinkTourQuotes(tourId: string): Promise<number> {
  const { data: linkedQuotes } = await supabase
    .from('quotes')
    .select('id')
    .eq('tour_id', tourId)

  if (linkedQuotes && linkedQuotes.length > 0) {
    const { error } = await supabase
      .from('quotes')
      .update({ tour_id: null, status: 'proposed', updated_at: new Date().toISOString() })
      .eq('tour_id', tourId)
    if (error) {
      logger.warn('斷開報價單失敗:', error.message)
    }
  }

  return linkedQuotes?.length ?? 0
}

/**
 * 斷開旅遊團關聯的行程表（不刪除，只解除連結）
 */
export async function unlinkTourItineraries(tourId: string): Promise<number> {
  const { data: linkedItineraries } = await supabase
    .from('itineraries')
    .select('id')
    .eq('tour_id', tourId)

  if (linkedItineraries && linkedItineraries.length > 0) {
    const { error } = await supabase
      .from('itineraries')
      .update({ tour_id: null, tour_code: null, status: '提案', updated_at: new Date().toISOString() })
      .eq('tour_id', tourId)
    if (error) {
      logger.warn('斷開行程表失敗:', error.message)
    }
  }

  return linkedItineraries?.length ?? 0
}

/**
 * 取得旅遊團的 PNR 資料
 */
export async function fetchTourPnrs(tourId: string): Promise<unknown[]> {
  const { data } = await supabase.from('pnrs').select('*').eq('tour_id', tourId)
  return data ?? []
}

/**
 * 根據 record_locator 取得 PNR 資料
 */
export async function fetchPnrsByLocators(locators: string[]): Promise<unknown[]> {
  if (locators.length === 0) return []
  const { data } = await supabase.from('pnrs').select('*').in('record_locator', locators)
  return data ?? []
}

/**
 * 取得提案轉開團所需的資料
 */
export async function fetchProposalConvertData(proposalId: string, packageId: string) {
  const [proposalRes, packageRes, itineraryRes] = await Promise.all([
    supabase.from('proposals').select('*').eq('id', proposalId).single(),
    supabase.from('proposal_packages').select('*').eq('id', packageId).single(),
    supabase.from('itineraries').select('outbound_flight, return_flight')
      .eq('proposal_package_id', packageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (proposalRes.error) throw proposalRes.error
  if (packageRes.error) throw packageRes.error

  return {
    proposal: proposalRes.data,
    package: packageRes.data,
    itinerary: itineraryRes.data,
  }
}
