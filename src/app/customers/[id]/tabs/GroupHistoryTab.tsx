'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMemberStore, useOrderStore, useTourStore } from '@/stores'
import { StatusCell } from '@/components/table-cells'
import { STATUS_CONFIG } from '@/lib/status-config'
import type { Member } from '@/types/member.types'

interface GroupHistoryTabProps {
  customerId: string
}

interface GroupHistory {
  tour_code: string
  tour_name: string
  order_code: string
  departure_date: string
  return_date: string
  status: number
  member_count: number
  total_price: number
  created_at: string
}

export function GroupHistoryTab({ customerId }: GroupHistoryTabProps) {
  const router = useRouter()
  const { items: members, fetchAll: fetchMembers } = useMemberStore()
  const { items: orders, fetchAll: fetchOrders } = useOrderStore()
  const { items: tours, fetchAll: fetchTours } = useTourStore()
  const [groupHistory, setGroupHistory] = useState<GroupHistory[]>([])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchMembers(), fetchOrders(), fetchTours()])
    }
    loadData()
  }, [fetchMembers, fetchOrders, fetchTours])

  // 計算參團歷史
  useEffect(() => {
    // 找出此客戶的所有會員記錄
    const customerMembers = members.filter(m => m.customer_id === customerId)

    // 根據會員記錄找出訂單
    const customerOrders = orders.filter(order =>
      customerMembers.some(member => member.order_id === order.id)
    )

    // 組合歷史記錄
    const history: GroupHistory[] = customerOrders
      .map(order => {
        const tour = tours.find(t => t.id === order.tour_id)
        const orderMembers = members.filter(m => m.order_id === order.id)

        if (!tour) return null

        return {
          tour_code: tour.code,
          tour_name: tour.name,
          order_code: order.code,
          departure_date: tour.departure_date,
          return_date: tour.return_date,
          status: order.status,
          member_count: orderMembers.length,
          total_price: order.total_price || 0,
          created_at: order.created_at,
        }
      })
      .filter(Boolean) as GroupHistory[]

    // 按建立時間排序（最新的在前）
    history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setGroupHistory(history)
  }, [members, orders, tours, customerId])

  if (groupHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-morandi-text-secondary">尚無參團記錄</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-morandi-text-secondary mb-4">
        共 {groupHistory.length} 筆參團記錄
      </div>

      <div className="space-y-3">
        {groupHistory.map((history, index) => (
          <div
            key={`${history.order_code}-${index}`}
            className="border border-border rounded-lg p-4 hover:border-morandi-gold/50 transition-colors bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {/* 團號和團名 */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-morandi-primary">
                      {history.tour_name}
                    </span>
                    <StatusCell status={history.status} config={STATUS_CONFIG.order} />
                  </div>
                  <div className="text-sm text-morandi-text-secondary mt-1">
                    團號：{history.tour_code} | 訂單：{history.order_code}
                  </div>
                </div>

                {/* 日期資訊 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-morandi-text-secondary">出發日期：</span>
                    <span className="text-morandi-text-primary font-medium">
                      {new Date(history.departure_date).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  <div>
                    <span className="text-morandi-text-secondary">回程日期：</span>
                    <span className="text-morandi-text-primary font-medium">
                      {new Date(history.return_date).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  <div>
                    <span className="text-morandi-text-secondary">參團人數：</span>
                    <span className="text-morandi-text-primary font-medium">
                      {history.member_count} 人
                    </span>
                  </div>
                  <div>
                    <span className="text-morandi-text-secondary">訂單金額：</span>
                    <span className="text-morandi-gold font-semibold">
                      NT$ {history.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 建立時間 */}
                <div className="text-xs text-morandi-text-secondary">
                  建立時間：{new Date(history.created_at).toLocaleString('zh-TW')}
                </div>
              </div>

              {/* 查看按鈕 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/orders/${history.order_code}`)}
                className="ml-4 hover:bg-morandi-gold/10 hover:border-morandi-gold"
              >
                <Eye className="h-4 w-4 mr-2" />
                查看訂單
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
