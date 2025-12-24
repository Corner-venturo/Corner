// ============================
// 集中 re-export 所有類型定義
// ============================

// 基礎型別
export type {
  ReceiptStatus,
  PaymentMethod,
  VisaStatus,
  Todo,
  Payment,
  Company,
  CompanyContact,
} from './types/base.types'

// 使用者相關型別
export type { User, Employee } from './types/user.types'

// 行程相關型別
export type {
  FlightInfo,
  Tour,
  Member,
  TourAddOn,
  TourRefund,
  ItineraryFeature,
  FocusCard,
  LeaderInfo,
  MeetingInfo,
  HotelInfo,
  DailyActivity,
  DailyMeals,
  DailyImage,
  DailyItineraryDay,
  PricingItem,
  PricingDetails,
  ItineraryVersionRecord,
  Itinerary,
  PriceTier,
  FAQ,
} from './types/tour.types'

// 報價相關型別
export type {
  Order,
  Customer,
  QuoteRegion,
  Quote,
  QuickQuoteItem,
  QuoteVersion,
  QuoteCategory,
  QuoteItem,
  Supplier,
  SupplierContact,
  SupplierBankInfo,
  PriceListItem,
  TierPricing,
} from './types/quote.types'

// 財務相關型別
export type {
  PaymentRequest,
  PaymentItemCategory,
  PaymentRequestItem,
  TourAllocation,
  DisbursementOrder,
  ReceiptOrder,
  OrderAllocation,
  ReceiptPaymentItem,
  Visa,
  VendorCost,
} from './types/finance.types'

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions'

// Store 工具型別（重新導出）
export type { CreateInput, UpdateInput } from './core/types'
