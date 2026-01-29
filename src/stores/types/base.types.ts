// ============================
// 基礎型別定義
// ============================

// 付款方式
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check'

// 簽證狀態
export type VisaStatus = 'pending' | 'submitted' | 'collected' | 'rejected' | 'returned'

// 待辦事項
export interface Todo {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5 // 星級緊急度
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed?: boolean // 對齊資料庫欄位

  // 人員關係（共享機制）
  creator: string // 建立者
  assignee?: string // 被指派者（可選）
  visibility: string[] // 可見人員ID列表 = [creator, assignee]
  is_public?: boolean // 是否公開給全公司（只有建立者+共享者可編輯，其他人只能查看）

  // 行事曆關聯
  calendar_event_id?: string // 主待辦事項關聯的行事曆事件 ID

  // 關聯資料
  related_items: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt'
    id: string
    title: string
  }[]

  // 子任務
  sub_tasks: {
    id: string
    title: string
    done: boolean
    completed_at?: string
    calendar_event_id?: string // 關聯的行事曆事件 ID
  }[]

  // 簡單備註（非留言板）
  notes: {
    id?: string // 留言 ID
    timestamp: string
    content: string
    author_id: string // 留言者 ID
    author_name: string // 留言者名稱
    read_by?: string[] // 已讀的使用者 ID 列表
  }[]

  // 快速功能設定
  enabled_quick_actions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[]

  // 通知標記
  needs_creator_notification?: boolean // 被指派人有更新，需要通知建立者

  created_at: string
  updated_at: string
}

// Payment 基礎介面
export interface Payment {
  id: string
  type: 'receipt' | 'request' | 'disbursement'
  // receipt: 收款
  // request: 請款
  // disbursement: 出納
  order_id?: string
  tour_id?: string
  amount: number
  description: string
  status: 'pending' | 'confirmed' | 'completed'
  // pending: 待確認
  // confirmed: 已確認
  // completed: 已完成
  created_at: string
  updated_at: string
}

// 企業客戶
export interface Company {
  id: string
  workspace_id: string

  // 基本資訊
  company_name: string
  tax_id: string | null // 統一編號
  phone: string | null
  email: string | null
  website: string | null

  // 發票資訊
  invoice_title: string | null // 發票抬頭
  invoice_address: string | null
  invoice_email: string | null

  // 付款資訊
  payment_terms: number // 付款期限（天）
  payment_method: 'transfer' | 'cash' | 'check' | 'credit_card'
  credit_limit: number // 信用額度

  // 銀行資訊
  bank_name: string | null
  bank_account: string | null
  bank_branch: string | null

  // 地址資訊
  registered_address: string | null // 登記地址
  mailing_address: string | null // 通訊地址

  // VIP 等級
  vip_level: number // 0: 普通, 1-5: VIP等級

  // 備註
  notes: string | null

  // 系統欄位
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CompanyContact {
  id: string
  company_id: string

  // 聯絡人資訊
  name: string
  title: string | null // 職稱
  department: string | null // 部門
  phone: string | null
  mobile: string | null
  email: string | null

  // 主要聯絡人標記
  is_primary: boolean

  // 備註
  notes: string | null

  // 系統欄位
  created_at: string
  updated_at: string
}

// 機場圖片季節類型
export type AirportImageSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'all'

// 機場圖片（封面圖片庫）
export interface AirportImage {
  id: string
  airport_code: string // 機場代碼如 CNX, BKK, HND
  image_url: string
  label: string | null // 標籤名稱（如「春季櫻花」「夏季祭典」）
  season: AirportImageSeason | null // 季節分類
  is_default: boolean // 是否為預設圖片
  display_order: number // 排序順序
  uploaded_by: string | null // 上傳者
  workspace_id: string | null
  created_at: string
  updated_at: string
}
