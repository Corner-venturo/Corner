/**
 * 確認單 Store
 * 管理住宿和機票確認單
 */

import { createStore } from './core/create-store'
import type { Confirmation } from '@/types/confirmation.types'

export const useConfirmationStore = createStore<Confirmation>({
  tableName: 'confirmations',
  // 確認單不需要自動生成 code，使用 booking_number 和 confirmation_number
  enableSupabase: true,
  fastInsert: true,
})

// 導出型別
export type ConfirmationStore = ReturnType<typeof useConfirmationStore>
