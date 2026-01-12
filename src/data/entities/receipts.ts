'use client'

/**
 * Receipts Entity
 * 收款記錄（明細）
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Receipt } from '@/types/receipt.types'

export const receiptEntity = createEntityHook<Receipt>('receipts', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,receipt_number,order_id,amount,status,payment_method,created_at',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useReceipts = receiptEntity.useList
export const useReceiptsSlim = receiptEntity.useListSlim
export const useReceipt = receiptEntity.useDetail
export const useReceiptsPaginated = receiptEntity.usePaginated
export const useReceiptDictionary = receiptEntity.useDictionary

export const createReceipt = receiptEntity.create
export const updateReceipt = receiptEntity.update
export const deleteReceipt = receiptEntity.delete
export const invalidateReceipts = receiptEntity.invalidate
