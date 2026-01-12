'use client'

/**
 * Payment Requests Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { PaymentRequest } from '@/stores/types'

export const paymentRequestEntity = createEntityHook<PaymentRequest>('payment_requests', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,code,tour_id,status,total_amount,created_at',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const usePaymentRequests = paymentRequestEntity.useList
export const usePaymentRequestsSlim = paymentRequestEntity.useListSlim
export const usePaymentRequest = paymentRequestEntity.useDetail
export const usePaymentRequestsPaginated = paymentRequestEntity.usePaginated
export const usePaymentRequestDictionary = paymentRequestEntity.useDictionary

export const createPaymentRequest = paymentRequestEntity.create
export const updatePaymentRequest = paymentRequestEntity.update
export const deletePaymentRequest = paymentRequestEntity.delete
export const invalidatePaymentRequests = paymentRequestEntity.invalidate
