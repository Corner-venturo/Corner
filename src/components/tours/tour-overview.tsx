'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { Tour } from '@/stores/types'
import { useOrderStore } from '@/stores'
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourOverviewProps {
  tour: Tour
  orderFilter?: string // 選填：顯示特定訂單的總覽信息
}

export const TourOverview = React.memo(function TourOverview({
  tour,
  orderFilter,
}: TourOverviewProps) {
  const { items: orders } = useOrderStore()

  // 如果有 orderFilter，取得該訂單的資料
  const order = (orderFilter ? orders.find(o => o.id === orderFilter) : null) as any

  // 根據是否為訂單視圖，顯示不同的卡片資料
  const overviewCards = order
    ? [
        {
          title: '訂單金額',
          value: `NT$ ${order.total_amount.toLocaleString()}`,
          icon: DollarSign,
          color: 'text-morandi-gold',
        },
        {
          title: '付款狀態',
          value: order.payment_status,
          icon: order.payment_status === 'paid' ? CheckCircle : AlertCircle,
          color:
            order.payment_status === 'paid'
              ? 'text-morandi-green'
              : order.payment_status === 'partial'
                ? 'text-morandi-gold'
                : 'text-morandi-red',
        },
        {
          title: '已付金額',
          value: `NT$ ${order.paid_amount.toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-morandi-green',
        },
        {
          title: '未付金額',
          value: `NT$ ${order.remaining_amount.toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-morandi-red',
        },
        {
          title: '訂單人數',
          value: `${order.member_count} 人`,
          icon: Users,
          color: 'text-morandi-gold',
        },
        {
          title: '聯絡人',
          value: order.contact_person,
          icon: Users,
          color: 'text-morandi-primary',
        },
      ]
    : [
        {
          title: '報價單價格',
          value: `NT$ ${(tour.price ?? 0).toLocaleString()}`,
          icon: DollarSign,
          color: 'text-morandi-gold',
        },
        {
          title: '合約狀態',
          value: tour.contract_status || '未簽約',
          icon: tour.contract_status === 'signed' ? CheckCircle : AlertCircle,
          color: tour.contract_status === 'signed' ? 'text-morandi-green' : 'text-morandi-red',
        },
        {
          title: '總收入',
          value: `NT$ ${(tour.total_revenue ?? 0).toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-morandi-green',
        },
        {
          title: '總支出',
          value: `NT$ ${(tour.total_cost ?? 0).toLocaleString()}`,
          icon: TrendingUp,
          color: 'text-morandi-red',
        },
        {
          title: '淨利潤',
          value: `NT$ ${(tour.profit ?? 0).toLocaleString()}`,
          icon: TrendingUp,
          color: (tour.profit ?? 0) >= 0 ? 'text-morandi-green' : 'text-morandi-red',
        },
        {
          title: '總訂單數',
          value: `${orders.filter(o => o.tour_id === tour.id).length} 筆`,
          icon: FileText,
          color: 'text-morandi-gold',
        },
      ]

  const getStatusBadge = (status: string | undefined) => {
    const badges: Record<string, string> = {
      提案: 'bg-morandi-gold text-white',
      進行中: 'bg-morandi-green text-white',
      待結案: 'bg-morandi-gold text-white',
      結案: 'bg-morandi-container text-morandi-secondary',
      特殊團: 'bg-morandi-red text-white',
    }
    return badges[status || ''] || 'bg-morandi-container text-morandi-secondary'
  }

  return (
    <div className="space-y-6">
      {/* 基本資訊卡片 */}
      <ContentContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">目的地：{tour.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">
                  出發：{tour.departure_date} 至 {tour.return_date}
                </span>
              </div>
              <div className="flex items-center">
                <FileText size={16} className="mr-3 text-morandi-secondary" />
                <span className="text-morandi-primary">團號：{tour.code}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-3 text-morandi-secondary">狀態：</span>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusBadge(tour.status ?? '')
                  )}
                >
                  {tour.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">快速操作</h3>
            <div className="space-y-2">
              <Button className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white justify-start">
                <FileText size={16} className="mr-2" />
                編輯基本資料
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle size={16} className="mr-2" />
                更新合約狀態
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign size={16} className="mr-2" />
                查看財務報表
              </Button>
            </div>
          </div>
        </div>
      </ContentContainer>

      {/* 財務概況 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">財務概況</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewCards.map((card, index) => (
            <Card key={index} className="p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-morandi-secondary mb-1">{card.title}</p>
                  <p className="text-xl font-bold text-morandi-primary">{card.value}</p>
                </div>
                <div className={`p-2 rounded-full bg-morandi-container ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ContentContainer>

      {/* 收支明細 - 實際數據由收款記錄和成本支出計算 */}
      <ContentContainer>
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">收支說明</h3>
        <div className="space-y-3 text-morandi-secondary text-sm">
          <p>• 總收入：從「收款紀錄」頁面查看實際收款明細</p>
          <p>• 總支出：從「成本支出」頁面查看實際支出明細</p>
          <p>• 淨利潤：總收入 - 總支出</p>
        </div>
      </ContentContainer>
    </div>
  )
})
