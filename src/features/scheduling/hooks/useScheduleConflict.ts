/**
 * useScheduleConflict - 調度衝突檢查 Hook
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface ConflictCheckResult {
  hasConflict: boolean
  loading: boolean
  error: string | null
}

/**
 * 檢查車輛調度衝突
 */
export function useVehicleScheduleConflict() {
  const [result, setResult] = useState<ConflictCheckResult>({
    hasConflict: false,
    loading: false,
    error: null,
  })

  const checkConflict = useCallback(async (
    vehicleId: string,
    startDate: string,
    endDate: string,
    excludeId?: string
  ): Promise<boolean> => {
    if (!vehicleId || !startDate || !endDate) {
      return false
    }

    setResult(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.rpc('check_vehicle_schedule_conflict', {
        p_vehicle_id: vehicleId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_exclude_id: excludeId,
      })

      if (error) {
        logger.error('檢查車輛調度衝突失敗:', error)
        setResult({ hasConflict: false, loading: false, error: error.message })
        return false
      }

      const hasConflict = data === true
      setResult({ hasConflict, loading: false, error: null })
      return hasConflict
    } catch (err) {
      logger.error('檢查車輛調度衝突異常:', err)
      setResult({ hasConflict: false, loading: false, error: '檢查失敗' })
      return false
    }
  }, [])

  return { ...result, checkConflict }
}

/**
 * 檢查領隊調度衝突
 */
export function useLeaderScheduleConflict() {
  const [result, setResult] = useState<ConflictCheckResult>({
    hasConflict: false,
    loading: false,
    error: null,
  })

  const checkConflict = useCallback(async (
    leaderId: string,
    startDate: string,
    endDate: string,
    excludeId?: string
  ): Promise<boolean> => {
    if (!leaderId || !startDate || !endDate) {
      return false
    }

    setResult(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.rpc('check_leader_schedule_conflict', {
        p_leader_id: leaderId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_exclude_id: excludeId,
      })

      if (error) {
        logger.error('檢查領隊調度衝突失敗:', error)
        setResult({ hasConflict: false, loading: false, error: error.message })
        return false
      }

      const hasConflict = data === true
      setResult({ hasConflict, loading: false, error: null })
      return hasConflict
    } catch (err) {
      logger.error('檢查領隊調度衝突異常:', err)
      setResult({ hasConflict: false, loading: false, error: '檢查失敗' })
      return false
    }
  }, [])

  return { ...result, checkConflict }
}
