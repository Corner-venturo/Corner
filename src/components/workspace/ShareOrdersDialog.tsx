'use client'

import { useState, useMemo } from 'react'
import { X, Search, Receipt } from 'lucide-react'
import { useOrderStore } from '@/stores'
import { useWorkspaceWidgets } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import { _Order } from '@/stores/types'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'

interface ShareOrdersDialogProps {
  channelId: string
  onClose: () => void
  onSuccess: () => void
}

export function ShareOrdersDialog({ channelId, onClose, onSuccess }: ShareOrdersDialogProps) {
  const { items: orders } = useOrderStore()
  const { shareOrderList } = useWorkspaceWidgets()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // 計算訂單的收款率和缺口
  const ordersWithGap = useMemo(() => {
    return orders
      .map(order => {
        const totalCost = order.total_amount || 0
        const collected = order.paid_amount || 0
        const gap = totalCost - collected
        const collectionRate = totalCost > 0 ? (collected / totalCost) * 100 : 0

        return {
          ...order,
          gap,
          collectionRate,
        }
      })
      .filter(order => {
        // 過濾：有缺口的訂單（待收款）
        return order.gap > 0
      })
      .sort((a, b) => {
        // 排序優先級：
        // 1. 成本 > 0 且收款 = 0（完全沒收）
        // 2. 收款率 < 30%
        // 3. 缺口金額大的優先
        const aFullyUnpaid = a.total_amount > 0 && a.paid_amount === 0
        const bFullyUnpaid = b.total_amount > 0 && b.paid_amount === 0

        if (aFullyUnpaid && !bFullyUnpaid) return -1
        if (!aFullyUnpaid && bFullyUnpaid) return 1

        const aLowRate = a.collectionRate < 30
        const bLowRate = b.collectionRate < 30

        if (aLowRate && !bLowRate) return -1
        if (!aLowRate && bLowRate) return 1

        return b.gap - a.gap
      })
  }, [orders])

  // 搜尋過濾
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return ordersWithGap

    const query = searchQuery.toLowerCase()
    return ordersWithGap.filter(
      order =>
        order.order_number.toLowerCase().includes(query) ||
        order.contact_person?.toLowerCase().includes(query) ||
        order.tour_name?.toLowerCase().includes(query)
    )
  }, [ordersWithGap, searchQuery])

  // 切換訂單選擇
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  // 計算已選訂單的總缺口
  const selectedStats = useMemo(() => {
    const selected = filteredOrders.filter(order => selectedOrders.has(order.id))
    const totalGap = selected.reduce((sum, order) => sum + order.gap, 0)
    return {
      count: selected.length,
      totalGap,
    }
  }, [filteredOrders, selectedOrders])

  const handleShare = async () => {
    if (selectedOrders.size === 0) {
      alert('請至少選擇一筆訂單')
      return
    }

    const auth = useRequireAuthSync()

    if (!auth.isAuthenticated) {
      auth.showLoginRequired()
      return
    }

    try {
      await shareOrderList(channelId, Array.from(selectedOrders), auth.user!.id)
      onSuccess()
      onClose()
    } catch (error) {
      alert('分享訂單失敗，請稍後再試')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="card-morandi-elevated w-[900px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between pb-3 border-b border-morandi-gold/20">
          <div className="flex items-center gap-2">
            <Receipt className="text-morandi-gold" size={20} />
            <h3 className="text-lg font-semibold text-morandi-primary">選擇待收款訂單</h3>
          </div>
          <button onClick={onClose} className="btn-icon-morandi !w-8 !h-8">
            <X size={16} />
          </button>
        </div>

        {/* 搜尋列 */}
        <div className="my-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋訂單號、客戶名稱..."
              className="input-morandi pl-10"
            />
          </div>
        </div>

        {/* 訂單列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-morandi-secondary">
              {searchQuery ? '沒有符合搜尋條件的訂單' : '目前沒有待收款訂單'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-morandi-container/5 border-b border-morandi-gold/20">
                <tr>
                  <th className="w-10 py-2.5 px-4 text-xs"></th>
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
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const isSelected = selectedOrders.has(order.id)
                  const isFullyUnpaid = order.total_amount > 0 && order.paid_amount === 0
                  const isLowRate = order.collectionRate < 30

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-morandi-container/20 hover:bg-morandi-gold/5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-morandi-gold/10' : ''
                      }`}
                      onClick={() => toggleOrderSelection(order.id)}
                    >
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-4 h-4 rounded border-morandi-gold/20 text-morandi-gold focus:ring-morandi-gold/20"
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-2 px-2 text-sm text-morandi-primary font-medium">
                        {order.order_number}
                      </td>
                      <td className="py-2 px-2 text-sm text-morandi-primary">
                        {order.contact_person || '-'}
                      </td>
                      <td className="py-2 px-2 text-sm text-right text-morandi-primary">
                        ${order.total_amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-sm text-right text-morandi-primary">
                        ${order.paid_amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-sm text-right font-semibold text-red-600">
                        ${order.gap.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isFullyUnpaid ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            ❌❌ 未收款
                          </span>
                        ) : isLowRate ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            ⚠️ 收款率低
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            部分收款
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部：統計與操作按鈕 */}
        <div className="pt-3 border-t border-morandi-gold/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-morandi-secondary">
              已選擇{' '}
              <span className="font-semibold text-morandi-primary">{selectedStats.count}</span>{' '}
              筆訂單
            </div>
            <div className="text-right">
              <div className="text-xs text-morandi-secondary">總缺口金額</div>
              <div className="text-lg font-semibold text-red-600">
                ${selectedStats.totalGap.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-morandi-secondary !py-2 !px-4" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-morandi-primary !py-2 !px-4"
              onClick={handleShare}
              disabled={selectedOrders.size === 0}
            >
              分享到頻道
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
