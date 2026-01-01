/**
 * 統一的狀態配置系統
 * 集中管理所有狀態的顏色、標籤和圖示
 */

import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCheck,
  FileText,
  DollarSign,
  Package,
  Truck,
  type LucideIcon,
} from 'lucide-react'

/**
 * 狀態配置介面
 */
export interface StatusConfig {
  color: string
  label: string
  icon?: LucideIcon
  bgColor?: string
  borderColor?: string
}

/**
 * 狀態配置類型
 */
type StatusType =
  | 'payment'
  | 'disbursement'
  | 'todo'
  | 'invoice'
  | 'tour'
  | 'order'
  | 'visa'
  | 'esim'
  | 'voucher'
  | 'receipt'

/**
 * 所有狀態配置的中央存儲
 */
export const STATUS_CONFIGS: Record<StatusType, Record<string, StatusConfig>> = {
  // 付款狀態
  payment: {
    pending: {
      color: 'text-morandi-gold',
      label: '待確認',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
      borderColor: 'border-morandi-gold',
    },
    confirmed: {
      color: 'text-morandi-green',
      label: '已確認',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
      borderColor: 'border-morandi-green',
    },
    completed: {
      color: 'text-morandi-primary',
      label: '已完成',
      icon: FileCheck,
      bgColor: 'bg-morandi-primary/10',
      borderColor: 'border-morandi-primary',
    },
    cancelled: {
      color: 'text-morandi-red',
      label: '已取消',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
      borderColor: 'border-morandi-red',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知狀態',
      icon: AlertCircle,
    },
  },

  // 撥款狀態
  disbursement: {
    pending: {
      color: 'text-morandi-gold',
      label: '待處理',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    processing: {
      color: 'text-morandi-primary',
      label: '處理中',
      icon: Package,
      bgColor: 'bg-morandi-primary/10',
    },
    completed: {
      color: 'text-morandi-green',
      label: '已完成',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    rejected: {
      color: 'text-morandi-red',
      label: '已駁回',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 待辦事項狀態
  todo: {
    pending: {
      color: 'text-morandi-gold',
      label: '待處理',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    in_progress: {
      color: 'text-morandi-primary',
      label: '進行中',
      icon: Package,
      bgColor: 'bg-morandi-primary/10',
    },
    completed: {
      color: 'text-morandi-green',
      label: '已完成',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    cancelled: {
      color: 'text-morandi-secondary',
      label: '已取消',
      icon: XCircle,
      bgColor: 'bg-morandi-secondary/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 發票狀態
  invoice: {
    draft: {
      color: 'text-morandi-secondary',
      label: '草稿',
      icon: FileText,
      bgColor: 'bg-morandi-secondary/10',
    },
    pending: {
      color: 'text-morandi-gold',
      label: '待審核',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    approved: {
      color: 'text-morandi-green',
      label: '已核准',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    paid: {
      color: 'text-morandi-primary',
      label: '已付款',
      icon: DollarSign,
      bgColor: 'bg-morandi-primary/10',
    },
    rejected: {
      color: 'text-morandi-red',
      label: '已駁回',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 團體狀態
  tour: {
    '提案': {
      color: 'text-morandi-secondary',
      label: '提案',
      icon: FileText,
      bgColor: 'bg-morandi-secondary/10',
    },
    '進行中': {
      color: 'text-morandi-gold',
      label: '進行中',
      icon: Truck,
      bgColor: 'bg-morandi-gold/10',
    },
    '結案': {
      color: 'text-morandi-green',
      label: '結案',
      icon: FileCheck,
      bgColor: 'bg-morandi-green/10',
    },
    '取消': {
      color: 'text-morandi-red',
      label: '取消',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 訂單狀態
  order: {
    draft: {
      color: 'text-morandi-secondary',
      label: '草稿',
      icon: FileText,
      bgColor: 'bg-morandi-secondary/10',
    },
    pending: {
      color: 'text-morandi-gold',
      label: '待處理',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    confirmed: {
      color: 'text-morandi-primary',
      label: '已確認',
      icon: CheckCircle,
      bgColor: 'bg-morandi-primary/10',
    },
    processing: {
      color: 'text-morandi-gold',
      label: '處理中',
      icon: Package,
      bgColor: 'bg-morandi-gold/10',
    },
    completed: {
      color: 'text-morandi-green',
      label: '已完成',
      icon: FileCheck,
      bgColor: 'bg-morandi-green/10',
    },
    cancelled: {
      color: 'text-morandi-red',
      label: '已取消',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 簽證狀態
  visa: {
    pending: {
      color: 'text-morandi-gold',
      label: '待送件',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    submitted: {
      color: 'text-morandi-primary',
      label: '已送件',
      icon: Package,
      bgColor: 'bg-morandi-primary/10',
    },
    collected: {
      color: 'text-morandi-green',
      label: '已取件',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    rejected: {
      color: 'text-morandi-red',
      label: '退件',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    returned: {
      color: 'text-morandi-secondary',
      label: '已歸還',
      icon: FileCheck,
      bgColor: 'bg-morandi-secondary/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // eSIM 網卡狀態（參考 CornerERP）
  esim: {
    0: {
      color: 'text-morandi-gold',
      label: '待確認',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    1: {
      color: 'text-morandi-green',
      label: '已確認',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    2: {
      color: 'text-morandi-red',
      label: '錯誤',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 會計傳票狀態
  voucher: {
    draft: {
      color: 'text-morandi-gold',
      label: '草稿',
      icon: FileText,
      bgColor: 'bg-morandi-gold/10',
      borderColor: 'border-morandi-gold',
    },
    posted: {
      color: 'text-morandi-green',
      label: '已過帳',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
      borderColor: 'border-morandi-green',
    },
    void: {
      color: 'text-morandi-red',
      label: '已作廢',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
      borderColor: 'border-morandi-red',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },

  // 收據狀態（資料庫存字串 '0'/'1'/'2'）
  receipt: {
    // 數字字串格式（資料庫存的格式）
    '0': {
      color: 'text-morandi-gold',
      label: '待確認',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    '1': {
      color: 'text-morandi-green',
      label: '已確認',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    '2': {
      color: 'text-morandi-red',
      label: '異常',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    // 英文格式（相容舊程式碼）
    pending: {
      color: 'text-morandi-gold',
      label: '待確認',
      icon: Clock,
      bgColor: 'bg-morandi-gold/10',
    },
    confirmed: {
      color: 'text-morandi-green',
      label: '已確認',
      icon: CheckCircle,
      bgColor: 'bg-morandi-green/10',
    },
    cancelled: {
      color: 'text-morandi-red',
      label: '已取消',
      icon: XCircle,
      bgColor: 'bg-morandi-red/10',
    },
    default: {
      color: 'text-morandi-secondary',
      label: '未知',
      icon: AlertCircle,
    },
  },
}

/**
 * 獲取狀態配置
 */
export function getStatusConfig(type: StatusType, status: string): StatusConfig {
  const typeConfig = STATUS_CONFIGS[type]
  if (!typeConfig) {
    return STATUS_CONFIGS.payment.default
  }
  return typeConfig[status] || typeConfig.default || STATUS_CONFIGS.payment.default
}

/**
 * 獲取狀態顏色
 */
export function getStatusColor(type: StatusType, status: string): string {
  return getStatusConfig(type, status).color
}

/**
 * 獲取狀態標籤
 */
export function getStatusLabel(type: StatusType, status: string): string {
  return getStatusConfig(type, status).label
}

/**
 * 獲取狀態圖示
 */
export function getStatusIcon(type: StatusType, status: string): LucideIcon | undefined {
  return getStatusConfig(type, status).icon
}

/**
 * 獲取狀態背景色
 */
export function getStatusBgColor(type: StatusType, status: string): string | undefined {
  return getStatusConfig(type, status).bgColor
}

/**
 * 獲取狀態邊框色
 */
export function getStatusBorderColor(type: StatusType, status: string): string | undefined {
  return getStatusConfig(type, status).borderColor
}

/**
 * 獲取所有狀態選項（用於下拉選單）
 */
export function getStatusOptions(type: StatusType): Array<{ value: string; label: string }> {
  const typeConfig = STATUS_CONFIGS[type]
  if (!typeConfig) return []

  return Object.entries(typeConfig)
    .filter(([key]) => key !== 'default')
    .map(([value, config]) => ({
      value,
      label: config.label,
    }))
}

/**
 * 直接導出 STATUS_CONFIG 供組件使用
 */
export const STATUS_CONFIG = STATUS_CONFIGS
