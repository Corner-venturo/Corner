/**
 * EnhancedStatusBadge - 增強版狀態標籤組件
 * 支援多種類型和統一配置
 */

import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeConfig {
  [key: string]: {
    variant: BadgeVariant
    label?: string
  }
}

interface EnhancedStatusBadgeProps {
  value: string
  config?: BadgeConfig
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  dot?: boolean
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-morandi-container text-morandi-secondary',
  success: 'bg-morandi-green/10 text-morandi-green border border-morandi-green/20',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-morandi-red/10 text-morandi-red border border-morandi-red/20',
  info: 'bg-morandi-blue/10 text-morandi-blue border border-morandi-blue/20',
  secondary: 'bg-morandi-gold/10 text-morandi-gold border border-morandi-gold/20',
}

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function EnhancedStatusBadge({
  value,
  config,
  variant,
  size = 'md',
  className,
  dot = false,
}: EnhancedStatusBadgeProps) {
  // 從 config 獲取配置或使用直接傳入的 variant
  const badgeConfig = config?.[value]
  const finalVariant = badgeConfig?.variant || variant || 'default'
  const displayLabel = badgeConfig?.label || value

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium whitespace-nowrap',
        VARIANT_STYLES[finalVariant],
        SIZE_STYLES[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            finalVariant === 'success' && 'bg-morandi-green',
            finalVariant === 'warning' && 'bg-amber-500',
            finalVariant === 'danger' && 'bg-morandi-red',
            finalVariant === 'info' && 'bg-morandi-blue',
            finalVariant === 'secondary' && 'bg-morandi-gold',
            finalVariant === 'default' && 'bg-morandi-secondary'
          )}
        />
      )}
      {displayLabel}
    </span>
  )
}

// 預設配置庫
export const BADGE_CONFIGS = {
  // 旅遊團狀態
  tourStatus: {
    提案: { variant: 'secondary' as BadgeVariant },
    準備中: { variant: 'info' as BadgeVariant },
    進行中: { variant: 'success' as BadgeVariant },
    已結束: { variant: 'default' as BadgeVariant },
    已取消: { variant: 'danger' as BadgeVariant },
  },

  // 付款方式
  paymentMethod: {
    現金: { variant: 'success' as BadgeVariant },
    信用卡: { variant: 'info' as BadgeVariant },
    轉帳: { variant: 'secondary' as BadgeVariant },
    支票: { variant: 'warning' as BadgeVariant },
  },

  // 付款狀態
  paymentStatus: {
    未付款: { variant: 'warning' as BadgeVariant },
    部分付款: { variant: 'info' as BadgeVariant },
    已付款: { variant: 'success' as BadgeVariant },
    已退款: { variant: 'danger' as BadgeVariant },
  },

  // 收據狀態
  receiptStatus: {
    待處理: { variant: 'warning' as BadgeVariant },
    已開立: { variant: 'success' as BadgeVariant },
    已作廢: { variant: 'danger' as BadgeVariant },
  },

  // 文件狀態
  documentStatus: {
    草稿: { variant: 'default' as BadgeVariant },
    待審核: { variant: 'warning' as BadgeVariant },
    已審核: { variant: 'success' as BadgeVariant },
    已拒絕: { variant: 'danger' as BadgeVariant },
  },

  // 請款狀態
  requestStatus: {
    待請款: { variant: 'warning' as BadgeVariant },
    已請款: { variant: 'info' as BadgeVariant },
    已出帳: { variant: 'success' as BadgeVariant },
    已駁回: { variant: 'danger' as BadgeVariant },
  },

  // 合約狀態
  contractStatus: {
    草稿: { variant: 'default' as BadgeVariant },
    待簽署: { variant: 'warning' as BadgeVariant },
    已簽署: { variant: 'success' as BadgeVariant },
    已終止: { variant: 'danger' as BadgeVariant },
  },

  // 報價單狀態
  quoteStatus: {
    提案: { variant: 'secondary' as BadgeVariant, label: '提案' },
    已核准: { variant: 'success' as BadgeVariant, label: '已核准' },
    已拒絕: { variant: 'danger' as BadgeVariant, label: '已拒絕' },
  },
} as const

// 使用範例：
// <EnhancedStatusBadge value="提案" config={BADGE_CONFIGS.tourStatus} />
// <EnhancedStatusBadge value="已付款" variant="success" />
// <EnhancedStatusBadge value="進行中" config={BADGE_CONFIGS.tourStatus} dot />
