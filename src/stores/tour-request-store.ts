'use client'

/**
 * Tour Request Store
 * Cloud-based hook for managing tour requests using SWR
 */

import { createCloudHook } from '@/hooks/createCloudHook'
import type { Database } from '@/lib/supabase/types'

// Tour Request type from Supabase schema
export type TourRequest = Database['public']['Tables']['tour_requests']['Row']

/**
 * useTourRequests - SWR hook for tour requests
 * Returns: { items, isLoading, isValidating, error, create, update, delete, fetchAll, getById }
 */
export const useTourRequests = createCloudHook<TourRequest>('tour_requests', {
  orderBy: { column: 'created_at', ascending: false },
})
