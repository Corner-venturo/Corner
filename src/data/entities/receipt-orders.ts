'use client'

/**
 * Receipt Orders Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { ReceiptOrder } from '@/types'

export const receiptOrderEntity = createEntityHook<ReceiptOrder>('receipt_orders', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,code,order_id,amount,payment_method,receipt_date,created_at',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useReceiptOrders = receiptOrderEntity.useList
export const useReceiptOrdersSlim = receiptOrderEntity.useListSlim
export const useReceiptOrder = receiptOrderEntity.useDetail
export const useReceiptOrdersPaginated = receiptOrderEntity.usePaginated
export const useReceiptOrderDictionary = receiptOrderEntity.useDictionary

export const createReceiptOrder = receiptOrderEntity.create
export const updateReceiptOrder = receiptOrderEntity.update
export const deleteReceiptOrder = receiptOrderEntity.delete
export const invalidateReceiptOrders = receiptOrderEntity.invalidate
