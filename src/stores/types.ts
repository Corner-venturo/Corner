// ============================
// 集中 re-export 所有類型定義
// ============================

// 基礎型別
export type {
  PaymentMethod,
  VisaStatus,
  Todo,
  Payment,
  Company,
  CompanyContact,
  AirportImage,
  AirportImageSeason,
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
  TierPricing,
} from './types/quote.types'

// 財務相關型別
export type {
  PaymentRequest,
  PaymentRequestCategory,
  CompanyExpenseType,
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

// 財務常數
export { EXPENSE_TYPE_CONFIG } from './types/finance.types'

// 客戶群組相關型別
export type {
  CustomerGroupType,
  CustomerGroupMemberRole,
  CustomerGroup,
  CustomerGroupMember,
  CreateCustomerGroupData,
  UpdateCustomerGroupData,
  CreateCustomerGroupMemberData,
} from './types/customer-group.types'

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions'

// Store 工具型別（重新導出）
export type { CreateInput, UpdateInput } from './core/types'

// 提案相關型別
export type {
  ProposalStatus,
  ArchiveReason,
  ParticipantCounts,
  Proposal,
  ProposalPackage,
  CreateProposalData,
  UpdateProposalData,
  CreatePackageData,
  UpdatePackageData,
  ConvertToTourData,
  ConvertToTourResult,
  ProposalFilters,
  ProposalListItem,
} from '@/types/proposal.types'

export { PROPOSAL_STATUS_CONFIG, ARCHIVE_REASON_CONFIG } from '@/types/proposal.types'
