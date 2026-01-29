'use client'

/**
 * Receipt Items Entity
 * 收款項目（一張收款單可有多個項目）
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { DbReceiptItem as ReceiptItem } from '@/types/receipt.types'

export const receiptItemEntity = createEntityHook<ReceiptItem>('receipt_items', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,receipt_id,tour_id,order_id,amount,status,payment_method',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useReceiptItems = receiptItemEntity.useList
export const useReceiptItemsSlim = receiptItemEntity.useListSlim
export const useReceiptItem = receiptItemEntity.useDetail
export const useReceiptItemsPaginated = receiptItemEntity.usePaginated

export const createReceiptItem = receiptItemEntity.create
export const updateReceiptItem = receiptItemEntity.update
export const deleteReceiptItem = receiptItemEntity.delete
export const invalidateReceiptItems = receiptItemEntity.invalidate

// 依收款單 ID 取得項目（直接用 supabase 查詢）
// 如需此功能，請在使用處直接查詢：
// const { data } = await supabase.from('receipt_items').select('*').eq('receipt_id', receiptId)
