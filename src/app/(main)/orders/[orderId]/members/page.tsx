'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { useOrderStore, useTourStore, useAuthStore } from '@/stores'
import { ArrowLeft } from 'lucide-react'
import { OrderMembersExpandable } from '@/components/orders/OrderMembersExpandable'

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()
  const workspaceId = useAuthStore(state => state.user?.workspace_id) || ''

  const order = orders.find(o => o.id === orderId)
  const tour = tours.find(t => t.id === order?.tour_id)

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-morandi-secondary mb-4">找不到該訂單</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft size={16} className="mr-1" />
            返回訂單列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title={`成員管理 - ${order.order_number}`}
      >
        {/* 訂單資訊 */}
        <div className="flex items-center space-x-6 text-sm text-morandi-secondary">
          <div className="flex items-center space-x-2">
            <span>旅遊團:</span>
            <span className="text-morandi-primary font-medium">{order.tour_name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>聯絡人:</span>
            <span className="text-morandi-primary font-medium">{order.contact_person}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>預定人數:</span>
            <span className="text-morandi-primary font-medium">{order.member_count ?? 0}人</span>
          </div>
          <Button
            onClick={() => router.push('/orders')}
            variant="ghost"
            size="sm"
            className="p-2 ml-auto"
          >
            <ArrowLeft size={16} />
          </Button>
        </div>
      </ResponsiveHeader>

      {/* 成員管理 */}
      <div className="px-6 pb-6">
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <OrderMembersExpandable
            orderId={orderId}
            tourId={order.tour_id || ''}
            workspaceId={workspaceId}
            onClose={() => router.push('/orders')}
          />
        </div>
      </div>
    </div>
  )
}
