'use client'

import { FileText, CheckCircle, Clock, AlertCircle, Building2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentCardProps {
  payment: {
    id: string
    code: string
    description: string
    amount: number
    status: 'pending' | 'approved' | 'paid' | 'rejected'
    supplier_name?: string | null
    tour_code?: string | null
    created_at?: string | null
    paid_at?: string | null
  }
  onClick?: () => void
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: '待審核', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  approved: { label: '已核准', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle },
  paid: { label: '已付款', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  rejected: { label: '已退回', color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle },
}

export function PaymentCard({ payment, onClick, className }: PaymentCardProps) {
  const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border shadow-sm p-4',
        onClick && 'cursor-pointer hover:border-morandi-gold/50',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* 圖標 */}
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', status.bg)}>
          <StatusIcon size={18} className={status.color} />
        </div>

        {/* 內容 */}
        <div className="flex-1 min-w-0">
          {/* 描述 + 狀態 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-medium text-morandi-primary line-clamp-1">
              {payment.description}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0', status.bg, status.color)}>
              {status.label}
            </span>
          </div>

          {/* 團號 + 供應商 */}
          <div className="flex items-center gap-3 text-sm text-morandi-secondary mb-2">
            {payment.tour_code && <span>{payment.tour_code}</span>}
            {payment.supplier_name && (
              <div className="flex items-center gap-1">
                <Building2 size={12} />
                <span>{payment.supplier_name}</span>
              </div>
            )}
          </div>

          {/* 金額 + 日期 */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-morandi-primary">
              {formatAmount(payment.amount)}
            </span>
            <span className="text-xs text-morandi-secondary">
              {formatDate(payment.paid_at || payment.created_at)}
            </span>
          </div>
        </div>

        {/* 箭頭 */}
        {onClick && <ChevronRight size={20} className="text-morandi-secondary/50 mt-1" />}
      </div>
    </div>
  )
}
