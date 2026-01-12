'use client'

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { VoucherEntry } from '@/types/accounting-pro.types'

export const voucherEntryEntity = createEntityHook<VoucherEntry>('voucher_entries', {
  list: {
    select: '*',
    orderBy: { column: 'entry_no', ascending: true },
  },
  slim: {
    select: 'id,voucher_id,entry_no,subject_id,debit,credit',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

// Hooks
export const useVoucherEntries = voucherEntryEntity.useList
export const useVoucherEntriesSlim = voucherEntryEntity.useListSlim
export const useVoucherEntry = voucherEntryEntity.useDetail
export const useVoucherEntriesPaginated = voucherEntryEntity.usePaginated
export const useVoucherEntryDictionary = voucherEntryEntity.useDictionary

// Actions
export const createVoucherEntry = voucherEntryEntity.create
export const updateVoucherEntry = voucherEntryEntity.update
export const deleteVoucherEntry = voucherEntryEntity.delete
export const invalidateVoucherEntries = voucherEntryEntity.invalidate
