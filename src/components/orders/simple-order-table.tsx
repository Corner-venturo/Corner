'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores'
import { deleteOrder } from '@/data'
import { User, Trash2, FileText, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Order, Tour } from '@/stores/types'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { OrderMembersExpandable } from '@/components/orders/OrderMembersExpandable'
import { COMP_ORDERS_LABELS } from './constants/labels'

interface SimpleOrderTableProps {
  orders: Order[]
  tours?: Pick<Tour, 'id' | 'departure_date'>[] // 可選，由父層傳入避免重複 fetch
  showTourInfo?: boolean
  className?: string
  /** 快速收款 callback（若提供則開對話框，否則跳轉頁面） */
  onQuickReceipt?: (order: Order) => void
  /** 快速請款 callback（若提供則開對話框，否則跳轉頁面） */
  onQuickPaymentRequest?: (order: Order) => void
  /** 開發票 callback */
  onQuickInvoice?: (order: Order) => void
  /** 編輯訂單 callback */
  onEdit?: (order: Order) => void
}

export const SimpleOrderTable = React.memo(function SimpleOrderTable({
  orders,
  tours = [], // 由父層傳入，避免重複 fetch
  showTourInfo = false,
  className,
  onQuickReceipt,
  onQuickPaymentRequest,
  onQuickInvoice,
  onEdit,
}: SimpleOrderTableProps) {
  const router = useRouter()
  const workspaceId = useAuthStore(state => state.user?.workspace_id) || ''
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const handleDeleteOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation()

    const confirmMessage = `確定要刪除訂單「${order.order_number}」嗎？\n\n此操作會影響：\n- 團員名單將被移除\n- 收款記錄將被刪除\n- 旅遊團人數統計將更新\n\n此操作無法復原！`

    const confirmed = await confirm(confirmMessage, {
      title: COMP_ORDERS_LABELS.刪除訂單,
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      await deleteOrder(order.id)
    } catch (err) {
      await alert(COMP_ORDERS_LABELS.刪除失敗_請稍後再試, 'error')
    }
  }

  const gridCols = showTourInfo ? '1fr 1fr 1fr 1fr 180px' : '1fr 1fr 1fr 180px'

  return (
    <div
      className={cn(
        'flex flex-col w-full h-full overflow-hidden border border-border rounded-xl bg-card',
        className
      )}
    >
      {/* 表頭 */}
      <div className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b border-border/60 rounded-t-xl">
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
                        'h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-blue hover:bg-morandi-blue/10',
                        expandedOrderId === order.id && 'text-morandi-blue bg-morandi-blue/10'
                      )}
                      title={COMP_ORDERS_LABELS.查看成員}
                    >
                      <User size={16} />
                    </Button>

                    {/* 快速收款按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        if (onQuickReceipt) {
                          onQuickReceipt(order)
                        } else {
                          router.push(
                            `/finance/payments?tour_code=${order.code}&order_id=${order.id}&order_number=${order.order_number}&contact_person=${order.contact_person}&amount=${order.remaining_amount}`
                          )
                        }
                      }}
                      className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-green hover:bg-morandi-green/10 font-bold text-base"
                      title={COMP_ORDERS_LABELS.快速收款}
                    >
                      $
                    </Button>

                    {/* 開發票按鈕 */}
                    {onQuickInvoice && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => {
                          e.stopPropagation()
                          onQuickInvoice(order)
                        }}
                        className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
                        title={COMP_ORDERS_LABELS.開發票}
                      >
                        <FileText size={14} />
                      </Button>
                    )}

                    {/* 快速請款按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        if (onQuickPaymentRequest) {
                          onQuickPaymentRequest(order)
                        } else {
                          router.push(
                            `/finance/requests?tour_id=${order.tour_id}&order_id=${order.id}&order_number=${order.order_number}`
                          )
                        }
                      }}
                      className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
                      title={COMP_ORDERS_LABELS.快速請款}
                    >
                      ¥
                    </Button>

                    {/* 編輯按鈕 */}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => {
                          e.stopPropagation()
                          onEdit(order)
                        }}
                        className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-blue hover:bg-morandi-blue/10"
                        title={COMP_ORDERS_LABELS.編輯訂單}
                      >
                        <Pencil size={14} />
                      </Button>
                    )}

                    {/* 刪除按鈕 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => handleDeleteOrder(order, e)}
                      className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10"
                      title={COMP_ORDERS_LABELS.刪除訂單}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 展開成員列表 */}
              {expandedOrderId === order.id && (
                <OrderMembersExpandable
                  orderId={order.id}
                  tourId={order.tour_id || ''}
                  workspaceId={workspaceId}
                  onClose={() => setExpandedOrderId(null)}
                  embedded
                  tour={tours.find(t => t.id === order.tour_id) as import('@/stores/types').Tour | undefined}
                />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  )
})
