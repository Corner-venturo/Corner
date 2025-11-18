/**
 * 會計科目 Store
 * 建立日期：2025-01-17
 */

import { createStore } from './core/create-store'
import type { AccountingSubject } from '@/types/accounting-pro.types'

/**
 * 會計科目 Store
 *
 * 使用方式：
 * ```tsx
 * const subjects = useAccountingSubjectStore(state => state.items)
 * const fetchAll = useAccountingSubjectStore(state => state.fetchAll)
 *
 * useEffect(() => {
 *   fetchAll()
 * }, [])
 * ```
 */
export const useAccountingSubjectStore = createStore<AccountingSubject>({
  tableName: 'accounting_subjects' as any,
  codePrefix: 'AS', // Accounting Subject
  enableSupabase: true,
  fastInsert: true,
})
