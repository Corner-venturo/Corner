'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useOrderStore, useAuthStore } from '@/stores'
import { User, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Order, Tour } from '@/stores/types'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { OrderMembersExpandable } from '@/components/orders/OrderMembersExpandable'

interface SimpleOrderTableProps {
  orders: Order[]
  tours?: Pick<Tour, 'id' | 'departure_date'>[] // 可選，由父層傳入避免重複 fetch
  showTourInfo?: boolean
  className?: string
}

export const SimpleOrderTable = React.memo(function SimpleOrderTable({
  orders,
  tours = [], // 由父層傳入，避免重複 fetch
  showTourInfo = false,
  className,
}: SimpleOrderTableProps) {
  const router = useRouter()
  const orderStore = useOrderStore()
  const deleteOrder = orderStore.delete
  const workspaceId = useAuthStore(state => state.user?.workspace_id) || ''
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const handleDeleteOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation()

    const confirmMessage = `確定要刪除訂單「${order.order_number}」嗎？\n\n此操作會影響：\n- 團員名單將被移除\n- 收款記錄將被刪除\n- 旅遊團人數統計將更新\n\n此操作無法復原！`

    const confirmed = await confirm(confirmMessage, {
      title: '刪除訂單',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      await deleteOrder(order.id)
    } catch (err) {
      await alert('刪除失敗，請稍後再試', 'error')
    }
  }

  const gridCols = showTourInfo ? '1fr 1fr 1fr 1fr 1fr 180px' : '1fr 1fr 1fr 1fr 180px'

  return (
    <div
      className={cn(
        'flex flex-col w-full h-full border border-border rounded-2xl overflow-hidden bg-card shadow-sm',
        className
      )}
    >
      {/* 表頭 */}
      <div className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20">
        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div className="text-left py-2.5 px-4 text-xs relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            <span className="font-medium text-morandi-secondary">訂單編號</span>
          </div>
          {showTourInfo && (
            <div className="text-left py-2.5 px-4 text-xs relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
              <span className="font-medium text-morandi-secondary">旅遊團</span>
            </div>
          )}
          <div className="text-left py-2.5 px-4 text-xs relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            <span className="font-medium text-morandi-secondary">聯絡人</span>
          </div>
          <div className="text-left py-2.5 px-4 text-xs relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            <span className="font-medium text-morandi-secondary">業務</span>
          </div>
          <div className="text-left py-2.5 px-4 text-xs relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            <span className="font-medium text-morandi-secondary">狀態</span>
          </div>
          <div className="text-left py-2.5 px-4 text-xs relative">
            <span className="font-medium text-morandi-secondary">操作</span>
          </div>
        </div>
      </div>

      {/* 表格內容 */}
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="grid" style={{ gridTemplateColumns: gridCols }}>
            <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>
            {showTourInfo && <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>}
            <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>
            <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>
            <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>
            <div className="py-2 px-4 text-center text-morandi-secondary/50">-</div>
          </div>
        ) : (
          orders.map(order => (
            <React.Fragment key={order.id}>
              <div
                className="grid transition-colors border-b border-border/50"
                style={{ gridTemplateColumns: gridCols }}
              >
                <div className="py-2 px-4">
                  <span className="text-xs font-medium text-morandi-primary">
                    {order.order_number}
                  </span>
                </div>

                {showTourInfo && (
                  <div className="py-2 px-4">
                    <span className="text-xs font-medium text-morandi-primary">
                      {order.tour_name}
                    </span>
                  </div>
                )}

                <div className="py-2 px-4">
                  <div className="flex items-center text-xs">
                    <User size={14} className="mr-1 text-morandi-secondary" />
                    <span className="font-medium text-morandi-primary">
                      {order.contact_person}
                    </span>
                  </div>
                </div>

                <div className="py-2 px-4">
                  <span className="text-xs text-morandi-primary">
                    {order.sales_person}
                  </span>
                </div>

                <div className="py-2 px-4">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      order.payment_status === 'paid'
                        ? 'text-morandi-green'
                        : order.payment_status === 'partial'
                          ? 'text-morandi-gold'
                          : 'text-morandi-red'
                    )}
                  >
                    {order.payment_status}
                  </span>
                </div>

                <div className="py-1 px-4">
                  <div className="flex items-center space-x-1">
                    {/* 成員按鈕 - 展開成員列表 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                      }}
                      className={cn(
                        'h-8 w-8 p-0 text-morandi-blue hover:text-morandi-blue hover:bg-morandi-blue/10',
                        expandedOrderId === order.id && 'bg-morandi-blue/10'
                      )}
                      title="查看成員"
                    >
                      <User size={16} />
                    </Button>

                    {/* 快速收款按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(
                          `/finance/payments?order_id=${order.id}&order_number=${order.order_number}&contact_person=${order.contact_person}&amount=${order.remaining_amount}`
                        )
                      }}
                      className="h-8 w-8 p-0 text-morandi-green hover:text-morandi-green hover:bg-morandi-green/10 font-bold text-base"
                      title="快速收款"
                    >
                      $
                    </Button>

                    {/* 快速請款按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(`/finance/requests`)
                      }}
                      className="h-8 w-8 p-0 text-morandi-blue hover:text-morandi-blue hover:bg-morandi-blue/10"
                      title="快速請款"
                    >
                      ¥
                    </Button>

                    {/* 刪除按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => handleDeleteOrder(order, e)}
                      className="h-8 w-8 p-0 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10"
                      title="刪除訂單"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 展開成員列表 */}
              {expandedOrderId === order.id && (
                <div className="bg-morandi-container/10 border-t border-border">
                  <OrderMembersExpandable
                    orderId={order.id}
                    tourId={order.tour_id || ''}
                    workspaceId={workspaceId}
                    onClose={() => setExpandedOrderId(null)}
                  />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  )
})
