'use client'

import { useState } from 'react'
import { Receipt, ChevronDown, ChevronUp, DollarSign, Check } from 'lucide-react'
import type { Order } from '@/stores/types'
import { CurrencyCell } from '@/components/table-cells'

// 使用統一的型別定義
import type { SharedOrderList } from '@/stores/workspace/types'
import { COMP_WORKSPACE_LABELS } from './constants/labels'

interface OrderListCardProps {
  orderList: SharedOrderList
  userName?: string
  onCreateReceipt: (orderId: string, order: SharedOrderList['orders'][number]) => void
  currentUserId?: string
  userRole?: 'admin' | 'finance' | 'member'
}

export function OrderListCard({
  orderList,
  userName = COMP_WORKSPACE_LABELS.會計,
  onCreateReceipt,
  userRole = 'member',
}: OrderListCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalGap = orderList.orders.reduce((sum, order) => sum + order.gap, 0)
  const canProcess = userRole === 'admin' || userRole === 'finance'

  const getOrderStatus = (order: { total_amount: number; paid_amount: number; collection_rate: number }) => {
    const isFullyUnpaid = order.total_amount > 0 && order.paid_amount === 0
    const isLowRate = order.collection_rate < 30

    if (isFullyUnpaid) {
      return {
        text: COMP_WORKSPACE_LABELS.未請款_未收款,
        color: 'text-status-danger',
        bgColor: 'bg-status-danger-bg',
      }
    } else if (isLowRate) {
      return {
        text: COMP_WORKSPACE_LABELS.已請款_未收款,
        color: 'text-status-warning',
        bgColor: 'bg-status-warning-bg',
      }
    } else {
      return {
        text: COMP_WORKSPACE_LABELS.部分收款,
        color: 'text-status-warning',
        bgColor: 'bg-status-warning-bg',
      }
    }
  }

  return (
    <div className="card-morandi-elevated my-3">
      {/* 標題 */}
      <div className="flex items-start gap-2 mb-3">
        <Receipt className="text-morandi-gold shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <div className="font-medium text-morandi-primary">{userName} 分享了待收款訂單</div>
          <div className="text-xs text-morandi-secondary mt-1">
            {new Date(orderList.created_at).toLocaleString('zh-TW')}
          </div>
        </div>
      </div>

      {/* 訂單卡片 */}
      <div className="bg-gradient-to-br from-morandi-container/5 to-morandi-container/10 rounded-lg border border-morandi-gold/20 overflow-hidden">
        {/* 收合摘要 */}
        <div
          className="p-4 cursor-pointer hover:bg-morandi-gold/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="font-medium text-morandi-primary flex items-center gap-1">
                  📋 待處理訂單 ({orderList.orders.length}筆 / <CurrencyCell amount={totalGap} className="inline" />)
                </div>
                <div className="text-xs text-morandi-secondary mt-1">
                  {isExpanded ? COMP_WORKSPACE_LABELS.點擊收合詳情 : COMP_WORKSPACE_LABELS.點擊展開詳情}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-morandi-secondary">總缺口</div>
                <CurrencyCell amount={totalGap} className="text-lg font-semibold text-status-danger" />
              </div>
              {isExpanded ? (
                <ChevronUp className="text-morandi-secondary" size={20} />
              ) : (
                <ChevronDown className="text-morandi-secondary" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* 展開詳情表格 */}
        {isExpanded && (
          <div className="border-t border-morandi-gold/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-morandi-container/5 border-b border-morandi-gold/20">
                  <tr>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      訂單號
                    </th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      客戶
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      總額
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      已收
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      缺口
                    </th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      狀態
                    </th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-morandi-secondary">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.orders.map((order) => {
                    const status = getOrderStatus(order)
                    const isProcessed = order.receipt_status === 'received'

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-morandi-container/10 hover:bg-morandi-container/5 transition-colors ${
                          isProcessed ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-sm font-medium text-morandi-primary">
                          {order.order_number}
                        </td>
                        <td className="py-2 px-3 text-sm text-morandi-primary">
                          {order.contact_person || '-'}
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-morandi-primary">
                          <CurrencyCell amount={order.total_amount} />
                        </td>
                        <td className="py-2 px-3 text-sm text-right text-morandi-primary">
                          <CurrencyCell amount={order.paid_amount} />
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-semibold text-status-danger">
                          <CurrencyCell amount={order.gap} />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${status.bgColor} ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isProcessed ? (
                            <div className="flex items-center justify-center gap-1 text-xs text-morandi-secondary">
                              <Check size={14} className="text-status-success" />
                              <span>已處理</span>
                            </div>
                          ) : canProcess ? (
                            <button
                              onClick={() => onCreateReceipt(order.id, order)}
                              className="btn-morandi-primary !py-1 !px-2 text-xs flex items-center gap-1 mx-auto"
                            >
                              <DollarSign size={12} />
                              <span>建立收款單</span>
                            </button>
                          ) : (
                            <div className="text-xs text-morandi-secondary">待處理</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 底部統計 */}
            <div className="p-3 bg-morandi-container/5 border-t border-morandi-gold/20">
              <div className="flex items-center justify-between text-xs text-morandi-secondary">
                <div>
                  共 {orderList.orders.length} 筆訂單
                  {orderList.orders.filter(o => o.receipt_status === 'received').length > 0 && (
                    <span className="ml-2">
                      ({orderList.orders.filter(o => o.receipt_status === 'received').length}{' '}
                      筆已處理)
                    </span>
                  )}
                </div>
                <div className="font-medium text-morandi-primary flex items-center gap-1">
                  總缺口：<CurrencyCell amount={totalGap} className="inline" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
