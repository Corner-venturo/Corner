'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { EditingMember } from '../hooks/useTourMemberEditor'

// 使用簡化的 Order 類型，僅包含此組件需要的欄位
interface TourOrder {
  id: string
  order_number?: string | null
  contact_person?: string
}

interface MemberStatsProps {
  members: EditingMember[]
  tourOrders: TourOrder[]
  totalMembers: number
  completedMembers: number
  orderFilter?: string
}

export const MemberStats: React.FC<MemberStatsProps> = ({
  members,
  tourOrders,
  totalMembers,
  completedMembers,
  orderFilter,
}) => {
  return (
    <div className="bg-morandi-container/20 p-4">
      <div
        className={cn(
          'grid gap-4',
          orderFilter ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-4'
        )}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-primary">{totalMembers}</div>
          <div className="text-sm text-morandi-secondary">
            {orderFilter ? '訂單成員數' : '總成員數'}
          </div>
        </div>
        {!orderFilter && (
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">{tourOrders.length}</div>
            <div className="text-sm text-morandi-secondary">訂單數</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-primary">{completedMembers}</div>
          <div className="text-sm text-morandi-secondary">已完成資料</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-morandi-primary">
            {totalMembers > 0 ? Math.round((completedMembers / totalMembers) * 100) : 0}%
          </div>
          <div className="text-sm text-morandi-secondary">完成率</div>
        </div>
      </div>

      {!orderFilter && tourOrders.length > 1 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-morandi-primary mb-3">各訂單成員數</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tourOrders.map(order => {
              const orderMemberCount = members.filter(
                member => member.order_id === order.id
              ).length
              return (
                <div key={order.id} className="bg-card border border-border p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-morandi-primary text-sm">
                        {order.order_number}
                      </div>
                      <div className="text-xs text-morandi-secondary">{order.contact_person}</div>
                    </div>
                    <div className="text-lg font-bold text-morandi-primary">
                      {orderMemberCount}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
