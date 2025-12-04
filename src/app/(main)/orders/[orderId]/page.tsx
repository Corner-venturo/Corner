'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { useOrderStore, useTourStore } from '@/stores'
import { TourOverview } from '@/components/tours/tour-overview'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'
import { ExcelMemberTable, MemberTableRef } from '@/components/members/excel-member-table'
import { MemberQuickAdd } from '@/components/members/member-quick-add'
import { InvoiceDialog } from '@/components/finance/invoice-dialog'

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
  const { items: orders } = useOrderStore()
  const { items: tours } = useTourStore()
  const [activeTab, setActiveTab] = useState('overview')
  const memberTableRef = useRef<MemberTableRef | null>(null)
  const [memberKey, setMemberKey] = useState(0) // 用於強制刷新成員表格
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)

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
      case 'members':
        return (
          <div className="space-y-6 p-6">
            {/* 快速新增成員（含 OCR 辨識） */}
            <MemberQuickAdd
              orderId={orderId}
              departureDate={tour?.departure_date || ''}
              onMembersAdded={() => {
                // 刷新成員表格
                setMemberKey(prev => prev + 1)
              }}
            />

            {/* 成員管理表格 */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <ExcelMemberTable
                key={memberKey}
                ref={memberTableRef}
                order_id={orderId}
                departure_date={tour?.departure_date || ''}
                member_count={order.member_count ?? 0}
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

      <div>{renderTabContent()}</div>

      {/* 開立代轉發票懸浮視窗 */}
      <InvoiceDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        fixedOrder={order}
        fixedTour={tour}
      />
    </>
  )
}
