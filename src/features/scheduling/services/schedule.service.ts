/**
 * schedule.service.ts - 調度資料存取服務
 */

import { supabase } from '@/lib/supabase/client'

/** 檢查車輛調度衝突 */
export async function checkVehicleScheduleConflict(
  vehicleId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_vehicle_schedule_conflict', {
    p_vehicle_id: vehicleId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_exclude_id: excludeId,
  })

  if (error) throw error
  return data === true
}

/** 檢查領隊調度衝突 */
export async function checkLeaderScheduleConflict(
  leaderId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_leader_schedule_conflict', {
    p_leader_id: leaderId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_exclude_id: excludeId,
  })

  if (error) throw error
  return data === true
}
