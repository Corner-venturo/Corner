/**
 * Receipt Store
 * 收款單狀態管理
 */

import { createStore } from './core/create-store'
import type { Receipt } from '@/types/receipt.types'

export const useReceiptStore = createStore<Receipt>({
  tableName: 'receipts',
  idField: 'id',
  enableRealtime: true,
  enableIndexedDB: true,
})
