/**
 * 型別系統統一匯出
 *
 * 使用方式：
 * import { Tour, Order, Customer, BaseEntity } from '@/types';
 */

// ============================================
// 基礎型別
// ============================================
export type {
  BaseEntity,
  PageRequest,
  PageResponse,
  Filter,
  FilterOperator,
  Sort,
  ApiResponse,
  ApiError,
  LoadingState,
  AsyncState,
} from './base.types';

// ============================================
// 員工型別
// ============================================
export type {
  Employee,
  Permission,
  PermissionGroup,
  CreateEmployeeData,
  UpdateEmployeeData,
  EmployeeFilter,
  EmployeeListItem,
} from './employee.types';

// ============================================
// 旅遊團型別
// ============================================
export type {
  Tour,
  TourStatus,
  TourCategory,
  CreateTourData,
  UpdateTourData,
  TourFilter,
  TourListItem,
  TourStats,
} from './tour.types';

// ============================================
// 訂單型別
// ============================================
export type {
  Order,
  Member,
  OrderStatus,
  PaymentStatus,
  Gender,
  AgeCategory,
  RoomType,
  CreateOrderData,
  UpdateOrderData,
  CreateMemberData,
  UpdateMemberData,
  OrderFilter,
  OrderListItem,
  OrderStats,
} from './order.types';

// ============================================
// 客戶型別
// ============================================
export type {
  Customer,
  VipLevel,
  CustomerSource,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerFilter,
  CustomerListItem,
  CustomerStats,
} from './customer.types';

// ============================================
// 財務型別
// ============================================
export type {
  Payment,
  PaymentRequest,
  PaymentRequestItem,
  DisbursementOrder,
  ReceiptOrder,
  ReceiptPaymentItem,
  PaymentMethod,
  RequestStatus,
  DisbursementStatus,
  ReceiptStatus,
  RecipientType,
  ExpenseCategory,
  CreatePaymentData,
  CreatePaymentRequestData,
  CreateDisbursementOrderData,
  CreateReceiptOrderData,
  FinanceStats,
} from './finance.types';

// ============================================
// 報價單型別
// ============================================
export type {
  Quote,
  QuoteVersion,
  QuoteCategory,
  QuoteItem,
  QuoteStatus,
  QuoteItemType,
  CreateQuoteData,
  UpdateQuoteData,
  CreateQuoteItemData,
  UpdateQuoteItemData,
  QuoteFilter,
  QuoteListItem,
  QuoteStats,
} from './quote.types';

// ============================================
// 共用型別
// ============================================
export type {
  SelectOption,
  GroupedSelectOption,
  Address,
  ContactInfo,
  FileUpload,
  FileCategory,
  DateRange,
  TimeSlot,
  Money,
  Currency,
  ExchangeRate,
  Coordinates,
  Location,
  Note,
  Attachment,
  ApprovalStatus,
  ApprovalRecord,
  Tag,
  Category,
  SearchParams,
  SearchResult,
  NotificationType,
  Notification,
  ChartDataPoint,
  TimeSeriesData,
  UserPreferences,
  NotificationPreferences,
  ExportFormat,
  ExportOptions,
  ImportResult,
} from './common.types';

// ============================================
// 會計記帳型別
// ============================================
export type {
  Account,
  TransactionCategory,
  Transaction,
  Budget,
  AccountingStats,
  CreateAccountData,
  UpdateAccountData,
  CreateTransactionCategoryData,
  UpdateTransactionCategoryData,
  CreateTransactionData,
  UpdateTransactionData,
  CreateBudgetData,
  UpdateBudgetData,
} from './accounting.types';

// ============================================
// 待辦事項型別
// ============================================
export type {
  Todo,
  CreateTodoData,
  UpdateTodoData,
} from './todo.types';

// ============================================
// 簽證管理型別
// ============================================
export type {
  Visa,
  CreateVisaData,
  UpdateVisaData,
} from './visa.types';

// ============================================
// 供應商管理型別
// ============================================
export type {
  Supplier,
  SupplierContact,
  SupplierBankInfo,
  PriceListItem,
  CreateSupplierData,
  UpdateSupplierData,
  CreatePriceListItemData,
  UpdatePriceListItemData,
} from './supplier.types';

// ============================================
// 行事曆型別
// ============================================
export type {
  CalendarEvent,
  CreateCalendarEventData,
  UpdateCalendarEventData,
} from './calendar.types';

// ============================================
// 工作空間型別
// ============================================
export type {
  WorkspaceItem,
  CreateWorkspaceItemData,
  UpdateWorkspaceItemData,
} from './workspace.types';

// ============================================
// 時間盒型別
// ============================================
export type {
  TimeboxSession,
  CreateTimeboxSessionData,
  UpdateTimeboxSessionData,
} from './timebox.types';

// ============================================
// 模板型別（保留現有）
// ============================================
export * from './template';
