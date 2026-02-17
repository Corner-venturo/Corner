'use client'

/**
 * Itineraries Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Itinerary } from '@/stores/types'

export const itineraryEntity = createEntityHook<Itinerary>('itineraries', {
  list: {
    select: 'id,code,title,subtitle,tagline,tour_id,tour_code,duration_days,departure_date,city,country,status,is_template,is_latest,price,price_note,author_name,parent_id,version,proposal_package_id,erp_itinerary_id,leader,cover_template_id,cover_style,daily_template_id,flight_template_id,flight_style,itinerary_style,hotel_style,leader_style,features_style,pricing_style,show_features,show_hotels,show_leader_meeting,show_notices,show_price_tiers,show_pricing_details,show_faqs,show_cancellation_policy,archived_at,closed_at,workspace_id,created_at,created_by,created_by_legacy_user_id,updated_at,updated_by',
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
