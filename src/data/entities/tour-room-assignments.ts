'use client'

/**
 * Tour Room Assignments Entity - 房間分配
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'

export interface TourRoomAssignment {
  id: string
  tour_room_id: string
  member_id: string
  bed_type?: string
  notes?: string
  workspace_id?: string
  created_at?: string
  updated_at?: string
}

export const tourRoomAssignmentEntity = createEntityHook<TourRoomAssignment>('tour_room_assignments', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: true },
  },
  slim: {
    select: 'id,tour_room_id,member_id',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useTourRoomAssignments = tourRoomAssignmentEntity.useList
export const useTourRoomAssignmentsSlim = tourRoomAssignmentEntity.useListSlim
export const useTourRoomAssignment = tourRoomAssignmentEntity.useDetail
export const useTourRoomAssignmentsPaginated = tourRoomAssignmentEntity.usePaginated
export const useTourRoomAssignmentDictionary = tourRoomAssignmentEntity.useDictionary

export const createTourRoomAssignment = tourRoomAssignmentEntity.create
export const updateTourRoomAssignment = tourRoomAssignmentEntity.update
export const deleteTourRoomAssignment = tourRoomAssignmentEntity.delete
export const invalidateTourRoomAssignments = tourRoomAssignmentEntity.invalidate
