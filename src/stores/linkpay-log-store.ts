/**
 * LinkPay Log Store
 * LinkPay 付款記錄狀態管理
 */

import { createStore } from './core/create-store'
import type { LinkPayLog } from '@/types/receipt.types'

export const useLinkPayLogStore = createStore<LinkPayLog>({
  tableName: 'linkpay_logs',
  enableSupabase: true,
})
