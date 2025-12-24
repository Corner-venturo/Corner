'use client'

import React from 'react'
import { Payment } from '@/stores/types'
import { Order } from '@/types'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, CreditCard, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptPayment extends Payment {
  method?: string
}

interface PaymentRowProps {
  payment: ReceiptPayment
  relatedOrder?: Order
  onOpenInvoice: (orderId?: string) => void
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    confirmed: '已確認',
    pending: '待確認',
    completed: '已完成',
  }
  const badges: Record<string, string> = {
    已確認: 'bg-morandi-green text-white',
    待確認: 'bg-morandi-gold text-white',
    已完成: 'bg-morandi-container text-morandi-primary',
  }
  return badges[statusMap[status] || status] || 'bg-morandi-container text-morandi-secondary'
}

const getMethodBadge = (method: string) => {
  const badges: Record<string, string> = {
    bank_transfer: 'bg-blue-100 text-blue-800',
    credit_card: 'bg-purple-100 text-purple-800',
    cash: 'bg-green-100 text-green-800',
    check: 'bg-yellow-100 text-yellow-800',
  }
  return badges[method] || 'bg-gray-100 text-gray-800'
}

const getMethodDisplayName = (method: string) => {
  const names: Record<string, string> = {
    bank_transfer: '銀行轉帳',
    credit_card: '信用卡',
    cash: '現金',
    check: '支票',
  }
  return names[method] || method
}

const getPaymentTypeIcon = (type: Payment['type']) => {
  if (type === 'receipt') return <TrendingUp size={16} className="text-morandi-green" />
  if (type === 'request') return <TrendingDown size={16} className="text-morandi-red" />
  return <CreditCard size={16} className="text-morandi-gold" />
}

export const PaymentRow = React.memo(function PaymentRow({
  payment,
  relatedOrder,
  onOpenInvoice,
}: PaymentRowProps) {
  return (
    <tr className="border-b border-border/30">
      <td className="py-3 px-4 text-morandi-primary">
        {new Date(payment.created_at).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          {getPaymentTypeIcon(payment.type)}
          <span className="text-morandi-primary">
            {payment.type === 'receipt' ? '收款' : payment.type === 'request' ? '請款' : '出納'}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className={cn(
            'font-medium',
            payment.type === 'receipt' ? 'text-morandi-green' : 'text-morandi-red'
          )}
        >
          {payment.type === 'receipt' ? '+' : '-'} NT$ {payment.amount.toLocaleString()}
        </span>
      </td>
      <td className="py-3 px-4 text-morandi-primary">{payment.description}</td>
      <td className="py-3 px-4">
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
            getMethodBadge(payment.method || '')
          )}
        >
          {getMethodDisplayName(payment.method || '')}
        </span>
      </td>
      <td className="py-3 px-4 text-morandi-primary">
        {relatedOrder ? relatedOrder.order_number : '-'}
      </td>
      <td className="py-3 px-4">
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
            getStatusBadge(payment.status)
          )}
        >
          {payment.status}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenInvoice(payment.order_id)}
          className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
          title="開立代轉發票"
        >
          <FileText size={14} className="mr-1" />
          開代轉
        </Button>
      </td>
    </tr>
  )
})
