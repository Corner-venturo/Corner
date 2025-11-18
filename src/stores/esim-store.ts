import { createStore } from './core/create-store'
import type { Esim } from '@/types/esim.types'

export const useEsimStore = createStore<Esim>({
  tableName: 'esims' as any,
  enableSupabase: true,
} as any)
