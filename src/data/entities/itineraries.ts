'use client'

/**
 * Itineraries Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Itinerary } from '@/stores/types'

export const itineraryEntity = createEntityHook<Itinerary>('itineraries', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,tour_id,title,duration_days',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

export const useItineraries = itineraryEntity.useList
export const useItinerariesSlim = itineraryEntity.useListSlim
export const useItinerary = itineraryEntity.useDetail
export const useItinerariesPaginated = itineraryEntity.usePaginated
export const useItineraryDictionary = itineraryEntity.useDictionary

export const createItinerary = itineraryEntity.create
export const updateItinerary = itineraryEntity.update
export const deleteItinerary = itineraryEntity.delete
export const invalidateItineraries = itineraryEntity.invalidate
