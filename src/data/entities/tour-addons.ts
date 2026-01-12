'use client'

/**
 * Tour Add-Ons Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { TourAddOn } from '@/stores/types'

export const tourAddOnEntity = createEntityHook<TourAddOn>('tour_add_ons', {
  list: {
    select: '*',
    orderBy: { column: 'name', ascending: true },
  },
  slim: {
    select: 'id,tour_id,name,price,is_active',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

export const useTourAddOns = tourAddOnEntity.useList
export const useTourAddOnsSlim = tourAddOnEntity.useListSlim
export const useTourAddOn = tourAddOnEntity.useDetail
export const useTourAddOnsPaginated = tourAddOnEntity.usePaginated
export const useTourAddOnDictionary = tourAddOnEntity.useDictionary

export const createTourAddOn = tourAddOnEntity.create
export const updateTourAddOn = tourAddOnEntity.update
export const deleteTourAddOn = tourAddOnEntity.delete
export const invalidateTourAddOns = tourAddOnEntity.invalidate
