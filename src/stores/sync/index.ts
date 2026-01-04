/**
 * Store 同步系統匯出
 */

export {
  storeEvents,
  setupStoreSyncListeners,
  STORE_SYNC_RELATIONS,
  type StoreEventType,
  type StoreSource,
  type TourEventPayload,
  type OrderEventPayload,
  type MemberEventPayload,
  type ItineraryEventPayload,
  type PaymentRequestEventPayload,
  type ReceiptOrderEventPayload,
  type StoreEventPayloadMap,
  type StoreSyncConfig,
} from './store-events'

export { useStoreSyncSetup } from './use-store-sync'

// Provider 組件
export { StoreSyncProvider } from './StoreSyncProvider'

// 事件發送輔助函數
export {
  emitCreated,
  emitUpdated,
  emitDeleted,
  TOUR_SYNC_CONFIG,
  ORDER_SYNC_CONFIG,
  MEMBER_SYNC_CONFIG,
  ITINERARY_SYNC_CONFIG,
  PAYMENT_REQUEST_SYNC_CONFIG,
  RECEIPT_ORDER_SYNC_CONFIG,
  type SyncEventConfig,
  type SyncEntityType,
} from './with-sync-events'
