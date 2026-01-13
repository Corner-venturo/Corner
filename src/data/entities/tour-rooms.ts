'use client'

/**
 * Tour Rooms Entity - 旅遊團房間管理
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'

export interface TourRoom {
  id: string
  tour_id: string
  room_type: string
  room_number: string
  hotel_name?: string
  check_in_date?: string
  check_out_date?: string
  price?: number
  notes?: string
  display_order?: number
  workspace_id?: string
  created_at?: string
  updated_at?: string
}

export const tourRoomEntity = createEntityHook<TourRoom>('tour_rooms', {
  list: {
    select: '*',
    orderBy: { column: 'display_order', ascending: true },
  },
  slim: {
    select: 'id,tour_id,room_type,room_number,hotel_name',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useTourRooms = tourRoomEntity.useList
export const useTourRoomsSlim = tourRoomEntity.useListSlim
export const useTourRoom = tourRoomEntity.useDetail
export const useTourRoomsPaginated = tourRoomEntity.usePaginated
export const useTourRoomDictionary = tourRoomEntity.useDictionary

export const createTourRoom = tourRoomEntity.create
export const updateTourRoom = tourRoomEntity.update
export const deleteTourRoom = tourRoomEntity.delete
export const invalidateTourRooms = tourRoomEntity.invalidate
