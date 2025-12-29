'use client'

/**
 * PNR Enhancement Cloud Hooks
 * 2025-12-29
 *
 * 提供 PNR 相關資料表的 SWR Hooks
 */

import useSWR, { mutate } from 'swr'
import { useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'
import type { Database } from '@/lib/supabase/types'
import type { QueueStats, QueueType, QueueStatus } from '@/types/pnr.types'

// Supabase 表格類型
type PnrFareHistory = Database['public']['Tables']['pnr_fare_history']['Row']
type PnrFareHistoryInsert = Database['public']['Tables']['pnr_fare_history']['Insert']
type PnrFareAlert = Database['public']['Tables']['pnr_fare_alerts']['Row']
type PnrFareAlertInsert = Database['public']['Tables']['pnr_fare_alerts']['Insert']
type PnrFlightStatusHistory = Database['public']['Tables']['pnr_flight_status_history']['Row']
type PnrFlightStatusHistoryInsert = Database['public']['Tables']['pnr_flight_status_history']['Insert']
type PnrQueueItem = Database['public']['Tables']['pnr_queue_items']['Row']
type PnrQueueItemInsert = Database['public']['Tables']['pnr_queue_items']['Insert']
type PnrScheduleChange = Database['public']['Tables']['pnr_schedule_changes']['Row']
type PnrScheduleChangeInsert = Database['public']['Tables']['pnr_schedule_changes']['Insert']
type PnrAiQuery = Database['public']['Tables']['pnr_ai_queries']['Row']
type PnrAiQueryInsert = Database['public']['Tables']['pnr_ai_queries']['Insert']

// 重新匯出類型供外部使用
export type {
  PnrFareHistory,
  PnrFareAlert,
  PnrFlightStatusHistory,
  PnrQueueItem,
  PnrScheduleChange,
  PnrAiQuery,
}

// =====================================================
// Helper: 取得當前 workspace
// =====================================================
function getCurrentWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed?.state?.user?.workspace_id || null
    }
  } catch {
    // 忽略
  }
  return null
}

// =====================================================
// 票價歷史 Hook
// =====================================================
export function usePnrFareHistory(pnrId?: string) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrFareHistory[]> => {
    let query = supabase
      .from('pnr_fare_history')
      .select('*')
      .order('recorded_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (pnrId) {
      query = query.eq('pnr_id', pnrId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_fare_history] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = pnrId ? `pnr_fare_history:${pnrId}` : 'pnr_fare_history'
  const { data: items = [], error, isLoading } = useSWR<PnrFareHistory[]>(swrKey, fetcher)

  const create = useCallback(async (data: Omit<PnrFareHistoryInsert, 'id' | 'created_at'>) => {
    const now = new Date().toISOString()
    const insertData: PnrFareHistoryInsert = {
      ...data,
      id: generateUUID(),
      created_at: now,
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_fare_history').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrFareHistory
  }, [swrKey, workspaceId])

  return { items, isLoading, error, create, refetch: () => mutate(swrKey) }
}

// =====================================================
// 票價警報 Hook
// =====================================================
export function usePnrFareAlerts(pnrId?: string) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrFareAlert[]> => {
    let query = supabase
      .from('pnr_fare_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (pnrId) {
      query = query.eq('pnr_id', pnrId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_fare_alerts] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = pnrId ? `pnr_fare_alerts:${pnrId}` : 'pnr_fare_alerts'
  const { data: items = [], error, isLoading } = useSWR<PnrFareAlert[]>(swrKey, fetcher)

  const create = useCallback(async (data: Omit<PnrFareAlertInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const insertData: PnrFareAlertInsert = {
      ...data,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_fare_alerts').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrFareAlert
  }, [swrKey, workspaceId])

  const update = useCallback(async (id: string, updates: Partial<PnrFareAlert>) => {
    const { error } = await supabase
      .from('pnr_fare_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('pnr_fare_alerts').delete().eq('id', id)
    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  return { items, isLoading, error, create, update, delete: remove, refetch: () => mutate(swrKey) }
}

// =====================================================
// 航班狀態歷史 Hook
// =====================================================
export function usePnrFlightStatusHistory(pnrId?: string) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrFlightStatusHistory[]> => {
    let query = supabase
      .from('pnr_flight_status_history')
      .select('*')
      .order('recorded_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (pnrId) {
      query = query.eq('pnr_id', pnrId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_flight_status_history] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = pnrId ? `pnr_flight_status_history:${pnrId}` : 'pnr_flight_status_history'
  const { data: items = [], error, isLoading } = useSWR<PnrFlightStatusHistory[]>(swrKey, fetcher)

  const create = useCallback(async (data: Omit<PnrFlightStatusHistoryInsert, 'id' | 'recorded_at'>) => {
    const insertData: PnrFlightStatusHistoryInsert = {
      ...data,
      id: generateUUID(),
      recorded_at: new Date().toISOString(),
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_flight_status_history').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrFlightStatusHistory
  }, [swrKey, workspaceId])

  return { items, isLoading, error, create, refetch: () => mutate(swrKey) }
}

// =====================================================
// PNR Queue Hook（核心 Hook）
// =====================================================
export function usePnrQueue(options?: { pnrId?: string; status?: QueueStatus; queueType?: QueueType }) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrQueueItem[]> => {
    let query = supabase
      .from('pnr_queue_items')
      .select('*')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (options?.pnrId) {
      query = query.eq('pnr_id', options.pnrId)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.queueType) {
      query = query.eq('queue_type', options.queueType)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_queue_items] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = `pnr_queue_items:${JSON.stringify(options || {})}`
  const { data: items = [], error, isLoading } = useSWR<PnrQueueItem[]>(swrKey, fetcher)

  // 計算統計
  const stats = useMemo<QueueStats>(() => {
    const pending = items.filter(i => i.status === 'pending')
    const now = new Date()

    return {
      pendingTicket: pending.filter(i => i.queue_type === 'pending_ticket').length,
      pendingConfirm: pending.filter(i => i.queue_type === 'pending_confirm').length,
      scheduleChange: pending.filter(i => i.queue_type === 'schedule_change').length,
      ssrPending: pending.filter(i => i.queue_type === 'ssr_pending').length,
      revalidation: pending.filter(i => i.queue_type === 'revalidation').length,
      reissue: pending.filter(i => i.queue_type === 'reissue').length,
      overdue: pending.filter(i => i.due_date && new Date(i.due_date) < now).length,
      total: pending.length,
    }
  }, [items])

  const create = useCallback(async (data: Omit<PnrQueueItemInsert, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const insertData: PnrQueueItemInsert = {
      ...data,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_queue_items').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrQueueItem
  }, [swrKey, workspaceId])

  const update = useCallback(async (id: string, updates: Partial<PnrQueueItem>) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() }
    // 移除不應該更新的欄位
    delete (updateData as Record<string, unknown>).id
    delete (updateData as Record<string, unknown>).created_at

    const { error } = await supabase
      .from('pnr_queue_items')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  const complete = useCallback(async (id: string, notes?: string, completedBy?: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('pnr_queue_items')
      .update({
        status: 'completed',
        completed_at: now,
        completed_by: completedBy,
        resolution_notes: notes,
        updated_at: now,
      })
      .eq('id', id)

    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('pnr_queue_items').delete().eq('id', id)
    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  return {
    items,
    stats,
    isLoading,
    error,
    create,
    update,
    complete,
    delete: remove,
    refetch: () => mutate(swrKey),
  }
}

// =====================================================
// 航變追蹤 Hook
// =====================================================
export function usePnrScheduleChanges(options?: { pnrId?: string; status?: string }) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrScheduleChange[]> => {
    let query = supabase
      .from('pnr_schedule_changes')
      .select('*')
      .order('detected_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (options?.pnrId) {
      query = query.eq('pnr_id', options.pnrId)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_schedule_changes] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = `pnr_schedule_changes:${JSON.stringify(options || {})}`
  const { data: items = [], error, isLoading } = useSWR<PnrScheduleChange[]>(swrKey, fetcher)

  const create = useCallback(async (data: Omit<PnrScheduleChangeInsert, 'id' | 'created_at' | 'updated_at' | 'detected_at'>) => {
    const now = new Date().toISOString()
    const insertData: PnrScheduleChangeInsert = {
      ...data,
      id: generateUUID(),
      detected_at: now,
      created_at: now,
      updated_at: now,
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_schedule_changes').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrScheduleChange
  }, [swrKey, workspaceId])

  const update = useCallback(async (id: string, updates: Partial<PnrScheduleChange>) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() }
    delete (updateData as Record<string, unknown>).id
    delete (updateData as Record<string, unknown>).created_at
    delete (updateData as Record<string, unknown>).detected_at

    const { error } = await supabase
      .from('pnr_schedule_changes')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    mutate(swrKey)
  }, [swrKey])

  return { items, isLoading, error, create, update, refetch: () => mutate(swrKey) }
}

// =====================================================
// AI 查詢 Hook
// =====================================================
export function usePnrAiQueries(pnrId?: string) {
  const workspaceId = getCurrentWorkspaceId()

  const fetcher = async (): Promise<PnrAiQuery[]> => {
    let query = supabase
      .from('pnr_ai_queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // 只保留最近 50 筆

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (pnrId) {
      query = query.eq('pnr_id', pnrId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('[pnr_ai_queries] Supabase error:', error)
      throw new Error(error.message)
    }

    return data || []
  }

  const swrKey = pnrId ? `pnr_ai_queries:${pnrId}` : 'pnr_ai_queries'
  const { data: items = [], error, isLoading } = useSWR<PnrAiQuery[]>(swrKey, fetcher)

  const create = useCallback(async (data: Omit<PnrAiQueryInsert, 'id' | 'created_at'>) => {
    const insertData: PnrAiQueryInsert = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      workspace_id: data.workspace_id || workspaceId || '',
    }

    const { error } = await supabase.from('pnr_ai_queries').insert(insertData)
    if (error) throw error

    mutate(swrKey)
    return insertData as PnrAiQuery
  }, [swrKey, workspaceId])

  return { items, isLoading, error, create, refetch: () => mutate(swrKey) }
}

// =====================================================
// 票價監控 Hook（整合票價歷史 + 變化計算）
// =====================================================
export function usePnrFareMonitor(pnrId: string) {
  const { items: fareHistory, isLoading, error, create } = usePnrFareHistory(pnrId)

  const currentFare = useMemo(() => fareHistory[0]?.total_fare || null, [fareHistory])
  const previousFare = useMemo(() => fareHistory[1]?.total_fare || null, [fareHistory])

  const priceChange = useMemo(() => {
    if (currentFare === null || previousFare === null) return null
    const amount = currentFare - previousFare
    const percent = (amount / previousFare) * 100
    return { amount, percent }
  }, [currentFare, previousFare])

  return {
    fareHistory,
    currentFare,
    previousFare,
    priceChange,
    isLoading,
    error,
    recordFare: create,
  }
}
