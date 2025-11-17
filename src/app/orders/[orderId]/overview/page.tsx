'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { useOrderStore, useTourStore } from '@/stores'
import { ArrowLeft, BarChart3, User, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OrderOverviewPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()

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

  const getPaymentBadge = (status: string | null) => {
    if (!status) return 'bg-morandi-container text-morandi-secondary'
    const badges: Record<string, string> = {
      已收款: 'bg-morandi-green text-white',
      部分收款: 'bg-morandi-gold text-white',
      未收款: 'bg-morandi-red text-white',
    }
    return badges[status] || 'bg-morandi-container text-morandi-secondary'
  }

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader title={`訂單總覽 - ${order.order_number}`}>
        <Button onClick={() => router.push('/orders')} variant="ghost" size="sm" className="p-2">
          <ArrowLeft size={16} />
        </Button>
      </ResponsiveHeader>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 基本資訊卡片 */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 size={20} className="text-morandi-gold" />
              <h3 className="text-lg font-semibold text-morandi-primary">基本資訊</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">訂單編號</span>
                <span className="text-morandi-primary font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">旅遊團</span>
                <span className="text-morandi-primary font-medium">{order.tour_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">團體代號</span>
                <span className="text-morandi-primary font-medium">{order.code}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">最後更新</span>
                <span className="text-morandi-primary">
                  {new Date(order.updated_at).toLocaleDateString()}
                </span>
              </div>
              {tour && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-morandi-secondary">出發日期</span>
                    <span className="text-morandi-primary font-medium">{tour.departure_date}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-morandi-secondary">返回日期</span>
                    <span className="text-morandi-primary font-medium">{tour.return_date}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 聯絡資訊卡片 */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-center space-x-2 mb-4">
              <User size={20} className="text-morandi-gold" />
              <h3 className="text-lg font-semibold text-morandi-primary">聯絡資訊</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">聯絡人</span>
                <span className="text-morandi-primary font-medium">{order.contact_person}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">業務</span>
                <span className="text-morandi-primary font-medium">{order.sales_person}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-morandi-secondary">助理</span>
                <span className="text-morandi-primary font-medium">{order.assistant}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-morandi-secondary">預定人數</span>
                <span className="text-morandi-primary font-medium">{order.member_count}人</span>
              </div>
            </div>
          </div>

          {/* 付款狀態卡片 */}
          <div className="border border-border rounded-lg p-6 bg-card lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard size={20} className="text-morandi-gold" />
              <h3 className="text-lg font-semibold text-morandi-primary">付款狀態</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-primary mb-1">
                  NT$ {order.total_amount.toLocaleString()}
                </div>
                <div className="text-morandi-secondary text-sm">總金額</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-green mb-1">
                  NT$ {order.paid_amount.toLocaleString()}
                </div>
                <div className="text-morandi-secondary text-sm">已收款</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-red mb-1">
                  NT$ {order.remaining_amount.toLocaleString()}
                </div>
                <div className="text-morandi-secondary text-sm">待收款</div>
              </div>
              <div className="text-center">
                <span
                  className={cn(
                    'inline-flex items-center px-3 py-2 rounded text-sm font-medium',
                    getPaymentBadge(order.payment_status)
                  )}
                >
                  {order.payment_status}
                </span>
                <div className="text-morandi-secondary text-sm mt-1">付款狀態</div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速導航 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => router.push(`/orders/${orderId}/payment`)}
            variant="outline"
            className="p-6 h-auto flex-col space-y-2"
          >
            <CreditCard size={24} className="text-morandi-gold" />
            <span>付款記錄</span>
          </Button>
          <Button
            onClick={() => router.push(`/orders/${orderId}/members`)}
            variant="outline"
            className="p-6 h-auto flex-col space-y-2"
          >
            <User size={24} className="text-morandi-gold" />
            <span>成員管理</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
