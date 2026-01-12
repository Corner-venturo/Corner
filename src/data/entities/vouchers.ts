'use client'

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Voucher } from '@/types/accounting-pro.types'

export const voucherEntity = createEntityHook<Voucher>('vouchers', {
  list: {
    select: '*',
    orderBy: { column: 'voucher_date', ascending: false },
  },
  slim: {
    select: 'id,voucher_no,voucher_date,type,source_type,total_debit,total_credit,status',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

// Hooks
export const useVouchers = voucherEntity.useList
export const useVouchersSlim = voucherEntity.useListSlim
export const useVoucher = voucherEntity.useDetail
export const useVouchersPaginated = voucherEntity.usePaginated
export const useVoucherDictionary = voucherEntity.useDictionary

// Actions
export const createVoucher = voucherEntity.create
export const updateVoucher = voucherEntity.update
export const deleteVoucher = voucherEntity.delete
export const invalidateVouchers = voucherEntity.invalidate
