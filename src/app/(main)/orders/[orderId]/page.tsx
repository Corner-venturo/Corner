'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { FileText } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { useOrderStore, useTourStore, useAuthStore } from '@/stores'
import type { Order, Tour } from '@/stores/types'
import { TourOverview } from '@/components/tours/tour-overview'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'
import { OrderMembersExpandable } from '@/components/orders/OrderMembersExpandable'
import { InvoiceDialog } from '@/components/finance/invoice-dialog'
import { EditingWarningBanner } from '@/components/EditingWarningBanner'

// 訂單詳細頁面的分頁配置
const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'members', label: '成員' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()
  const workspaceId = useAuthStore(state => state.user?.workspace_id) || ''
  const [activeTab, setActiveTab] = useState('overview')
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)

  // 從 URL 讀取 tab 參數
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'members', 'payments', 'costs'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const orderId = params.orderId as string
  const order = orders.find(o => o.id === orderId)
  const tour = order ? tours.find(t => t.id === order.tour_id) as Tour | undefined : null

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
      case 'members':
        return (
          <div className="p-6">
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <OrderMembersExpandable
                orderId={orderId}
                tourId={order.tour_id || ''}
                workspaceId={workspaceId}
                onClose={() => setActiveTab('overview')}
              />
            </div>
          </div>
        )
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
        customActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceDialogOpen(true)}
            className="gap-1"
          >
            <FileText size={16} />
            開代轉
          </Button>
        }
      />

      {/* 編輯衝突警告 */}
      <EditingWarningBanner
        resourceType="order"
        resourceId={orderId}
        resourceName="此訂單"
      />

      <div>{renderTabContent()}</div>

      {/* 開立代轉發票懸浮視窗 */}
      <InvoiceDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        fixedOrder={order as Order}
        fixedTour={tour}
      />
    </>
  )
}
