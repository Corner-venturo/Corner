'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { getVehicleTypeLabel } from '../utils/vehicle-utils'

/**
 * Hook for managing vehicle assignments
 * Handles loading vehicle assignment information
 */
export function useVehicleAssignments(tourId: string) {
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})

  const loadVehicleAssignments = async () => {
    if (!tourId) return

    try {
      // Get all vehicles for this tour (sorted by display_order)
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type, display_order')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true })

      if (!vehicles || vehicles.length === 0) return

      // Get all assignment records
      const vehicleIds = vehicles.map((v: { id: string }) => v.id)
      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('vehicle_id, order_member_id')
        .in('vehicle_id', vehicleIds)

      if (!assignments || assignments.length === 0) return

      // Build vehicle_id -> vehicle info mapping
      const vehicleMap: Record<string, { vehicle_name: string; vehicle_type: string | null; display_order: number }> = {}
      vehicles.forEach((vehicle) => {
        vehicleMap[vehicle.id] = {
          vehicle_name: vehicle.vehicle_name,
          vehicle_type: vehicle.vehicle_type,
          display_order: vehicle.display_order ?? 0,
        }
      })

      // Calculate vehicle numbers for each vehicle type (sorted by display_order)
      const vehicleCounters: Record<string, number> = {}
      const vehicleNumbers: Record<string, number> = {}
      vehicles.forEach((vehicle) => {
        const vehicleKey = vehicle.vehicle_type || 'default'
        if (!vehicleCounters[vehicleKey]) {
          vehicleCounters[vehicleKey] = 1
        }
        vehicleNumbers[vehicle.id] = vehicleCounters[vehicleKey]++
      })

      // Build member_id -> vehicle name mapping
      const assignmentMap: Record<string, string> = {}
      assignments.forEach((a: { vehicle_id: string; order_member_id: string }) => {
        const vehicle = vehicleMap[a.vehicle_id]
        if (vehicle) {
          // If custom name exists, use it
          if (vehicle.vehicle_name && vehicle.vehicle_name !== getVehicleTypeLabel(vehicle.vehicle_type)) {
            assignmentMap[a.order_member_id] = vehicle.vehicle_name
          } else {
            // Otherwise use "vehicle_type number" format
            const vehicleTypeLabel = getVehicleTypeLabel(vehicle.vehicle_type)
            const vehicleNum = vehicleNumbers[a.vehicle_id] || 1
            assignmentMap[a.order_member_id] = vehicleTypeLabel ? `${vehicleTypeLabel} ${vehicleNum}` : `車 ${vehicleNum}`
          }
        }
      })

      setVehicleAssignments(assignmentMap)
    } catch (err) {
      logger.error('載入車輛分配失敗:', err)
    }
  }

  return {
    vehicleAssignments,
    loadVehicleAssignments,
  }
}
