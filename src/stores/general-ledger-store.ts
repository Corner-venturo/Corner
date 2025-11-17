/**
 * 總帳 Store
 * 建立日期：2025-01-17
 */

import { createStore } from './core/create-store'
import type { GeneralLedger } from '@/types/accounting-pro.types'

/**
 * 總帳 Store
 *
 * 使用方式：
 * ```tsx
 * const ledgers = useGeneralLedgerStore(state => state.items)
 * const fetchAll = useGeneralLedgerStore(state => state.fetchAll)
 *
 * // 查詢特定科目的總帳
 * const subjectLedgers = ledgers.filter(l => l.subject_id === subjectId)
 *
 * // 查詢特定年月的總帳
 * const monthLedgers = ledgers.filter(l =>
 *   l.year === 2025 && l.month === 1
 * )
 * ```
 */
export const useGeneralLedgerStore = createStore<GeneralLedger>({
  tableName: 'general_ledger',
  enableSupabase: true,
  fastInsert: true,
})
