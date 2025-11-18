'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, User, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Order } from '@/stores/types'

interface OrderListProps {
  orders: Order[]
  showTourInfo?: boolean // 是否顯示旅遊團資訊欄位
  showContainer?: boolean // 是否顯示外層容器和邊框
}

// 獲取付款狀態樣式
const getPaymentBadge = (status: string) => {
  const badges: Record<string, string> = {
    已收款: 'bg-morandi-green text-white',
    部分收款: 'bg-morandi-gold text-white',
    未收款: 'bg-morandi-red text-white',
  }
  return badges[status] || 'bg-morandi-container text-morandi-secondary'
}

export const OrderList = React.memo(function OrderList({
  orders,
  showTourInfo = true,
  showContainer = true,
}: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-morandi-secondary">
        <ShoppingCart size={24} className="mx-auto mb-4 opacity-50" />
        <p>沒有找到訂單</p>
      </div>
    )
  }

  const tableContent = (
    <table className="w-full">
      <thead className="bg-morandi-container/30">
        <tr className="relative">
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
            訂單編號
          </th>
          {showTourInfo && (
            <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
              旅遊團
            </th>
          )}
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
            聯絡人
          </th>
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
            業務/助理
          </th>
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
            金額/收款
          </th>
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">狀態</th>
          <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">操作</th>
          <td className="absolute bottom-0 left-4 right-4 h-[1px] bg-border"></td>
        </tr>
      </thead>
      <tbody>
        {orders.map((order, index) => (
          <tr key={order.id} className="relative transition-colors hover:bg-morandi-container/30">
            <td className="py-4 px-4">
              <div className="font-medium text-morandi-primary">{order.order_number}</div>
              <div className="text-xs text-morandi-secondary flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(order.created_at || '').toLocaleDateString()}
              </div>
            </td>

            {showTourInfo && (
              <td className="py-4 px-4">
                <div className="font-medium text-morandi-primary">{order.tour_name}</div>
                <div className="text-xs text-morandi-secondary">{order.code}</div>
              </td>
            )}

            <td className="py-4 px-4">
              <div className="flex items-center">
                <User size={14} className="mr-1 text-morandi-secondary" />
                <span className="font-medium text-morandi-primary">{order.contact_person}</span>
              </div>
            </td>

            <td className="py-4 px-4">
              <div className="text-sm text-morandi-primary">{order.sales_person}</div>
              <div className="text-xs text-morandi-secondary">{order.assistant}</div>
            </td>

            <td className="py-4 px-4">
              <div className="text-sm">
                <div className="font-medium text-morandi-primary">
                  NT$ {order.total_amount.toLocaleString()}
                </div>
                <div className="text-morandi-green">
                  已收: NT$ {order.paid_amount.toLocaleString()}
                </div>
                {order.remaining_amount > 0 && (
                  <div className="text-morandi-red">
                    餘款: NT$ {order.remaining_amount.toLocaleString()}
                  </div>
                )}
              </div>
            </td>

            <td className="py-4 px-4">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                  getPaymentBadge(order.payment_status)
                )}
              >
                {order.payment_status}
              </span>
            </td>

            <td className="py-4 px-4">
              <Button variant="outline" size="sm">
                編輯
              </Button>
            </td>

            {/* 分割線邏輯：如果不是最後一項才顯示分割線 */}
            {index < orders.length - 1 && (
              <td className="absolute bottom-0 left-4 right-4 h-[1px] bg-border"></td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )

  // 如果 showContainer 為 false，直接返回表格內容
  if (!showContainer) {
    return <div className="overflow-x-auto">{tableContent}</div>
  }

  // 否則返回帶容器的完整結構
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">{tableContent}</div>
    </div>
  )
})
