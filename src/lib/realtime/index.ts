/**
 * Supabase Realtime 統一入口
 */

'use client'

export { realtimeManager, RealtimeManager } from './realtime-manager'
export {
  useRealtimeSubscription,
  useMultipleRealtimeSubscriptions,
  useRealtimeStatus,
} from './hooks/useRealtimeSubscription'
export type {
  RealtimeEventType,
  RealtimeHandlers,
  RealtimeSubscriptionConfig,
  RealtimeStatus,
  SubscriptionState,
  RealtimeManagerConfig,
  PostgresChangesPayload,
} from './types'
