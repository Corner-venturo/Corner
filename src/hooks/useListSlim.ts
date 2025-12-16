// src/hooks/useListSlim.ts
// 瘦身版列表 hooks：只 select 列表頁需要的欄位，減少 payload

import { createCloudHook } from './createCloudHook'
import type { Tour, Order } from '@/stores/types'

// ============================================
// Orders 列表瘦身版
// ============================================

// /orders 列表頁實際用到的欄位
const ORDERS_LIST_FIELDS = [
  'id',
  'order_number',
  'tour_id',
  'tour_name',
  'contact_person',
  'sales_person',
  'assistant',
  'payment_status',
  'remaining_amount',
  'member_count',
  'code',
  'created_at',
].join(',')

/**
 * 瘦身版 Orders hook - 只抓列表需要的欄位
 * payload 從 select('*') 的 ~30 欄位縮減到 12 欄位
 */
export const useOrdersListSlim = createCloudHook<Order>('orders', {
  select: ORDERS_LIST_FIELDS,
  orderBy: { column: 'created_at', ascending: false },
})

// ============================================
// Tours 列表瘦身版
// ============================================

// /orders 列表頁實際用到的 tours 欄位
const TOURS_LIST_FIELDS = [
  'id',
  'code',
  'name',
  'departure_date',
].join(',')

/**
 * 瘦身版 Tours hook - 只抓列表需要的欄位
 * payload 從 select('*') 的 ~40 欄位縮減到 4 欄位
 */
export const useToursListSlim = createCloudHook<Tour>('tours', {
  select: TOURS_LIST_FIELDS,
  orderBy: { column: 'departure_date', ascending: false },
})
