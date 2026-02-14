/**
 * useScheduleConflict - 調度衝突檢查 Hook
 */

import { useState, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import {
  checkVehicleScheduleConflict as checkVehicleConflictService,
  checkLeaderScheduleConflict as checkLeaderConflictService,
} from '@/features/scheduling/services/schedule.service'

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
      const hasConflict = await checkVehicleConflictService(vehicleId, startDate, endDate, excludeId)
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
      const hasConflict = await checkLeaderConflictService(leaderId, startDate, endDate, excludeId)
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
