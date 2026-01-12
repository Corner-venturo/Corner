'use client'

/**
 * Tours Entity
 *
 * 使用方式：
 * import { useTours, useTour, useToursPaginated, useTourDictionary } from '@/data'
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Tour } from '@/stores/types'

// ============================================
// Entity 定義
// ============================================

export const tourEntity = createEntityHook<Tour>('tours', {
  list: {
    select: '*',
    orderBy: {
      column: 'departure_date',
      ascending: false,
    },
  },
  slim: {
    select: 'id,code,name,departure_date,return_date,status,location,current_participants,max_participants,archived',
  },
  detail: {
    select: '*',
  },
  cache: CACHE_PRESETS.high,
})

// ============================================
// 便捷 Hooks Export
// ============================================

/** 完整 Tours 列表 */
export const useTours = tourEntity.useList

/** 精簡 Tours 列表（列表顯示用）*/
export const useToursSlim = tourEntity.useListSlim

/** 單筆 Tour（支援 skip pattern）*/
export const useTour = tourEntity.useDetail

/** 分頁 Tours（server-side pagination + filter + search）*/
export const useToursPaginated = tourEntity.usePaginated

/** Tour Dictionary（O(1) 查詢）*/
export const useTourDictionary = tourEntity.useDictionary

// ============================================
// CRUD Export
// ============================================

/** 建立 Tour */
export const createTour = tourEntity.create

/** 更新 Tour */
export const updateTour = tourEntity.update

/** 刪除 Tour */
export const deleteTour = tourEntity.delete

/** 使 Tour 快取失效 */
export const invalidateTours = tourEntity.invalidate
