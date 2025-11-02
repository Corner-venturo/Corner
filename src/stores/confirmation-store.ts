/**
 * 確認單 Store
 * 管理住宿和機票確認單
 */

import { createStore } from './core/create-store'
import type { Confirmation } from '@/types/confirmation.types'

export const useConfirmationStore = createStore<Confirmation>({
  tableName: 'confirmations',
  codePrefix: 'CONF',
  enableSupabase: true,
  fastInsert: true,
})

// 導出型別
export type ConfirmationStore = ReturnType<typeof useConfirmationStore>
