/**
 * Receipt Store
 * 收款單狀態管理
 */

import { createStore } from './core/create-store'
import type { Receipt } from '@/types/receipt.types'

export const useReceiptStore = createStore<Receipt>({
  tableName: 'receipts',
  // 不使用 codePrefix，收款單號由 generateReceiptNumber 手動生成（格式：團號-R01）
  enableSupabase: true,
  fastInsert: true,
})
