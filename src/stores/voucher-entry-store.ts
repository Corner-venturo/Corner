/**
 * 傳票明細 Store
 * 建立日期：2025-01-17
 */

import { createStore } from './core/create-store'
import type { VoucherEntry } from '@/types/accounting-pro.types'

/**
 * 傳票明細 Store
 *
 * 使用方式：
 * ```tsx
 * const entries = useVoucherEntryStore(state => state.items)
 * const fetchAll = useVoucherEntryStore(state => state.fetchAll)
 *
 * // 查詢特定傳票的分錄
 * const voucherEntries = entries.filter(e => e.voucher_id === voucherId)
 * ```
 */
export const useVoucherEntryStore = createStore<VoucherEntry>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tableName: 'voucher_entries' as any,
  enableSupabase: true,
  fastInsert: true,
})
