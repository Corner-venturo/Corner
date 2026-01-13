'use client'

/**
 * Tour Vehicles Entity - 旅遊團車輛管理
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'

export interface TourVehicle {
  id: string
  tour_id: string
  vehicle_type: string
  vehicle_number?: string
  driver_name?: string
  driver_phone?: string
  capacity?: number
  start_date?: string
  end_date?: string
  price?: number
  notes?: string
  workspace_id?: string
  created_at?: string
  updated_at?: string
}

export const tourVehicleEntity = createEntityHook<TourVehicle>('tour_vehicles', {
  list: {
    select: '*',
    orderBy: { column: 'start_date', ascending: true },
  },
  slim: {
    select: 'id,tour_id,vehicle_type,vehicle_number,driver_name',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const useTourVehicles = tourVehicleEntity.useList
export const useTourVehiclesSlim = tourVehicleEntity.useListSlim
export const useTourVehicle = tourVehicleEntity.useDetail
export const useTourVehiclesPaginated = tourVehicleEntity.usePaginated
export const useTourVehicleDictionary = tourVehicleEntity.useDictionary

export const createTourVehicle = tourVehicleEntity.create
export const updateTourVehicle = tourVehicleEntity.update
export const deleteTourVehicle = tourVehicleEntity.delete
export const invalidateTourVehicles = tourVehicleEntity.invalidate
