/**
 * 傳票 Store
 * 建立日期：2025-01-17
 */

import { createStore } from './core/create-store'
import type { Voucher } from '@/types/accounting-pro.types'

/**
 * 傳票 Store
 *
 * 使用方式：
 * ```tsx
 * const vouchers = useVoucherStore(state => state.items)
 * const fetchAll = useVoucherStore(state => state.fetchAll)
 * const create = useVoucherStore(state => state.create)
 *
 * // 查詢本月傳票
 * const monthVouchers = vouchers.filter(v =>
 *   v.voucher_date.startsWith('2025-01')
 * )
 * ```
 */
export const useVoucherStore = createStore<Voucher>({
  tableName: 'vouchers' as any,
  codePrefix: 'V', // Voucher
  enableSupabase: true,
  fastInsert: true,
} as any)
