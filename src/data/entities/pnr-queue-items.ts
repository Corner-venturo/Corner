'use client'

/**
 * PNR Queue Items Entity - PNR 佇列項目
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'

export interface PnrQueueItem {
  id: string
  pnr_id: string
  queue_type: string
  priority?: number
  status: string
  scheduled_at?: string
  processed_at?: string
  error_message?: string
  retry_count?: number
  workspace_id?: string
  created_at?: string
  updated_at?: string
}

export const pnrQueueItemEntity = createEntityHook<PnrQueueItem>('pnr_queue_items', {
  list: {
    select: '*',
    orderBy: { column: 'scheduled_at', ascending: true },
  },
  slim: {
    select: 'id,pnr_id,queue_type,status,scheduled_at',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.high,
})

export const usePnrQueueItems = pnrQueueItemEntity.useList
export const usePnrQueueItemsSlim = pnrQueueItemEntity.useListSlim
export const usePnrQueueItem = pnrQueueItemEntity.useDetail
export const usePnrQueueItemsPaginated = pnrQueueItemEntity.usePaginated
export const usePnrQueueItemDictionary = pnrQueueItemEntity.useDictionary

export const createPnrQueueItem = pnrQueueItemEntity.create
export const updatePnrQueueItem = pnrQueueItemEntity.update
export const deletePnrQueueItem = pnrQueueItemEntity.delete
export const invalidatePnrQueueItems = pnrQueueItemEntity.invalidate
