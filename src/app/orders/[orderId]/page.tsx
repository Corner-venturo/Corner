'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { useOrderStore, useTourStore } from '@/stores'
import { TourOverview } from '@/components/tours/tour-overview'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'

// 訂單詳細頁面的分頁配置
const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()
  const [activeTab, setActiveTab] = useState('overview')

  const orderId = params.orderId as string
  const order = orders.find(o => o.id === orderId)
  const tour = order ? tours.find(t => t.id === order.tour_id) : null

  if (!order) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到指定的訂單</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  if (!tour) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到相關的旅遊團資料</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  // 創建針對單一訂單的過濾版本組件
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TourOverview tour={tour} orderFilter={order.id} />
      case 'payments':
        return <TourPayments tour={tour} orderFilter={order.id} />
      case 'costs':
        return <TourCosts tour={tour} orderFilter={order.id} />
      default:
        return <TourOverview tour={tour} orderFilter={order.id} />
    }
  }

  return (
    <>
      <ResponsiveHeader
        title={`訂單 ${order.order_number} - ${tour.name}`}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showBackButton={true}
        onBack={() => router.push('/orders')}
      />

      <div>{renderTabContent()}</div>
    </>
  )
}
