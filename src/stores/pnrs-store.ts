/**
 * PNR (Passenger Name Record) Store
 * 管理航空訂位電報資料
 */

import { createStore } from './core/create-store'
import type { PNR } from '@/types/pnr.types'

export const usePNRStore = createStore<PNR>({
  tableName: 'pnrs',
  enableSupabase: true,
  fastInsert: true,
})

export type { PNR }
