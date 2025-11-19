/**
 * 景點管理 Store
 * 使用 createStore 工廠函數統一架構
 * 支援離線優先 + Realtime 同步
 */

import { createStore } from './core/create-store'
import { Attraction } from '@/features/attractions/types'

// 建立 Store（自動支援離線 + Realtime）
export const useAttractionStore = createStore<Attraction>('attractions')

// 匯出型別給外部使用
export type { Attraction }
