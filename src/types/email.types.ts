/**
 * Venturo ERP 郵件系統類型定義
 */

// ============================================================================
// 基礎類型
// ============================================================================

export type EmailDirection = 'inbound' | 'outbound'

export type EmailStatus =
  | 'draft'      // 草稿
  | 'queued'     // 排隊發送中
  | 'sending'    // 發送中
  | 'sent'       // 已發送
  | 'delivered'  // 已送達
  | 'failed'     // 發送失敗
  | 'received'   // 已收到（inbound）

export type EmailAccountType = 'shared' | 'personal'

// ============================================================================
// 郵件地址
// ============================================================================

export interface EmailAddress {
  email: string
  name?: string
}

// ============================================================================
// 郵件主體
// ============================================================================

export interface Email {
  id: string
  workspace_id: string

  // 識別
  message_id: string | null
  thread_id: string | null
  in_reply_to: string | null

  // 方向與狀態
  direction: EmailDirection
  status: EmailStatus

  // 寄件人
  from_address: string
  from_name: string | null

  // 收件人
  to_addresses: EmailAddress[]
  cc_addresses: EmailAddress[]
  bcc_addresses: EmailAddress[]
  reply_to_address: string | null

  // 內容
  subject: string | null
  body_text: string | null
  body_html: string | null

  // 關聯
  customer_id: string | null
  supplier_id: string | null
  tour_id: string | null
  order_id: string | null

  // 標記
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  is_trash: boolean
  labels: string[]

  // 時間
  scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  received_at: string | null

  // 錯誤
  error_message: string | null
  retry_count: number

  // 外部追蹤
  external_id: string | null

  // 通用
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null

  // 關聯資料（join 時載入）
  attachments?: EmailAttachment[]
  customer?: { id: string; chinese_name: string | null; email: string | null }
  supplier?: { id: string; name: string; email: string | null }
}

// ============================================================================
// 附件
// ============================================================================

export interface EmailAttachment {
  id: string
  email_id: string
  workspace_id: string

  filename: string
  content_type: string | null
  size_bytes: number | null

  storage_path: string | null
  external_url: string | null

  content_id: string | null
  is_inline: boolean

  created_at: string
}

// ============================================================================
// 郵件帳戶
// ============================================================================

export interface EmailAccount {
  id: string
  workspace_id: string

  email_address: string
  display_name: string | null

  account_type: EmailAccountType
  owner_id: string | null

  is_active: boolean
  is_default: boolean

  signature_html: string | null
  signature_text: string | null

  settings: Record<string, unknown>

  domain_verified: boolean
  verified_at: string | null

  created_at: string
  updated_at: string
}

// ============================================================================
// API 請求/回應
// ============================================================================

export interface SendEmailRequest {
  from_address?: string              // 不填則用預設帳戶
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  reply_to?: string
  subject: string
  body_html?: string
  body_text?: string
  attachments?: {
    filename: string
    content: string                  // Base64 encoded
    content_type?: string
  }[]
  scheduled_at?: string              // ISO 8601，排程發送
  // 關聯（可選）
  customer_id?: string
  supplier_id?: string
  tour_id?: string
  order_id?: string
  labels?: string[]
}

export interface SendEmailResponse {
  success: boolean
  email_id: string
  external_id?: string
  error?: string
}

// ============================================================================
// 篩選與查詢
// ============================================================================

export interface EmailFilter {
  direction?: EmailDirection
  status?: EmailStatus | EmailStatus[]
  is_read?: boolean
  is_starred?: boolean
  is_archived?: boolean
  is_trash?: boolean
  labels?: string[]
  customer_id?: string
  supplier_id?: string
  tour_id?: string
  from_address?: string
  search?: string                    // 搜尋 subject + body
  date_from?: string
  date_to?: string
}

export type EmailSortField = 'created_at' | 'sent_at' | 'received_at' | 'subject'
export type EmailSortOrder = 'asc' | 'desc'

export interface EmailListParams {
  filter?: EmailFilter
  sort_by?: EmailSortField
  sort_order?: EmailSortOrder
  page?: number
  page_size?: number
}

export interface EmailListResponse {
  data: Email[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// ============================================================================
// UI 狀態
// ============================================================================

export interface EmailState {
  // 列表
  emails: Email[]
  total: number
  loading: boolean
  error: string | null

  // 當前選中
  selectedEmailId: string | null
  selectedEmail: Email | null

  // 篩選
  filter: EmailFilter
  sortBy: EmailSortField
  sortOrder: EmailSortOrder

  // 分頁
  page: number
  pageSize: number

  // UI 狀態
  composeOpen: boolean
  draftEmail: Partial<SendEmailRequest> | null

  // 帳戶
  accounts: EmailAccount[]
  defaultAccount: EmailAccount | null
}

// ============================================================================
// 統計
// ============================================================================

export interface EmailStats {
  total_inbound: number
  total_outbound: number
  unread_count: number
  sent_today: number
  received_today: number
  failed_count: number
}

// ============================================================================
// 收件匣資料夾
// ============================================================================

export type EmailFolder =
  | 'inbox'      // 收件匣
  | 'sent'       // 寄件備份
  | 'drafts'     // 草稿
  | 'starred'    // 已加星號
  | 'archived'   // 封存
  | 'trash'      // 垃圾桶
  | 'all'        // 全部郵件

export const EMAIL_FOLDER_FILTERS: Record<EmailFolder, EmailFilter> = {
  inbox: { direction: 'inbound', is_archived: false, is_trash: false },
  sent: { direction: 'outbound', status: ['sent', 'delivered'], is_trash: false },
  drafts: { status: 'draft', is_trash: false },
  starred: { is_starred: true, is_trash: false },
  archived: { is_archived: true, is_trash: false },
  trash: { is_trash: true },
  all: { is_trash: false },
}
