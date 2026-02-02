'use client'

/**
 * TourTabs - 團詳情頁籤（共用元件）
 * 
 * 提供：
 * 1. TOUR_TABS - 頁籤定義（給 ResponsiveHeader 等使用）
 * 2. TourTabContent - 只渲染內容（不含頁籤列）
 * 3. TourTabs - 完整元件（含頁籤列，給 Dialog 用）
 */

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tour } from '@/stores/types'

// Loading placeholder
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="animate-spin text-muted-foreground" size={24} />
  </div>
)

// 動態載入頁籤內容
const TourOverview = dynamic(
  () => import('@/components/tours/tour-overview').then(m => m.TourOverview),
  { loading: () => <TabLoading /> }
)

const TourOrders = dynamic(
  () => import('@/components/tours/tour-orders').then(m => m.TourOrders),
  { loading: () => <TabLoading /> }
)

const OrderMembersExpandable = dynamic(
  () => import('@/components/orders/OrderMembersExpandable').then(m => m.OrderMembersExpandable),
  { loading: () => <TabLoading /> }
)

const TourConfirmationSheet = dynamic(
  () => import('@/components/tours/tour-confirmation-sheet').then(m => m.TourConfirmationSheet),
  { loading: () => <TabLoading /> }
)

const TourCheckin = dynamic(
  () => import('@/components/tours/tour-checkin').then(m => m.TourCheckin),
  { loading: () => <TabLoading /> }
)

const TourRequirementsTab = dynamic(
  () => import('@/components/tours/tour-requirements-tab').then(m => m.TourRequirementsTab),
  { loading: () => <TabLoading /> }
)

const TourFilesManager = dynamic(
  () => import('@/components/tours/TourFilesManager').then(m => m.TourFilesManager),
  { loading: () => <TabLoading /> }
)

const TourDesignsTab = dynamic(
  () => import('@/components/tours/tour-designs-tab').then(m => m.TourDesignsTab),
  { loading: () => <TabLoading /> }
)

const TourPayments = dynamic(
  () => import('@/components/tours/tour-payments').then(m => m.TourPayments),
  { loading: () => <TabLoading /> }
)

const TourCosts = dynamic(
  () => import('@/components/tours/tour-costs').then(m => m.TourCosts),
  { loading: () => <TabLoading /> }
)

// ============================================================================
// 頁籤定義（共用）
// ============================================================================

export const TOUR_TABS = [
  { value: 'members', label: '團員名單' },
  { value: 'orders', label: '訂單管理' },
  { value: 'requirements', label: '需求總覽' },
  { value: 'confirmation', label: '團確單' },
  { value: 'checkin', label: '報到' },
  { value: 'designs', label: '設計' },
  { value: 'files', label: '檔案' },
  { value: 'overview', label: '總覽' },
] as const

export type TourTabValue = typeof TOUR_TABS[number]['value']

// ============================================================================
// TourTabContent - 只渲染內容（不含頁籤列）
// ============================================================================

interface TourTabContentProps {
  tour: Tour
  activeTab: string
  /** 額外 props 傳給 OrderMembersExpandable */
  workspaceId?: string
  forceShowPnr?: boolean
  /** PNR 配對 Dialog 控制（Dialog 專用） */
  showPnrMatchDialog?: boolean
  onPnrMatchDialogChange?: (show: boolean) => void
  onPnrMatchSuccess?: () => void
  /** 需求單回調 */
  onAddRequest?: () => void
  onOpenRequestDialog?: (data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    startDate: string | null
  }) => void
}

export function TourTabContent({
  tour,
  activeTab,
  workspaceId,
  forceShowPnr,
  showPnrMatchDialog,
  onPnrMatchDialogChange,
  onPnrMatchSuccess,
  onAddRequest,
  onOpenRequestDialog,
}: TourTabContentProps) {
  switch (activeTab) {
    case 'members':
      return (
        <OrderMembersExpandable
          tourId={tour.id}
          workspaceId={workspaceId}
          mode="tour"
          forceShowPnr={forceShowPnr}
          tour={tour}
          showPnrMatchDialog={showPnrMatchDialog}
          onPnrMatchDialogChange={onPnrMatchDialogChange}
          onPnrMatchSuccess={onPnrMatchSuccess}
        />
      )
    case 'orders':
      return <TourOrders tour={tour} />
    case 'confirmation':
      return <TourConfirmationSheet tourId={tour.id} />
    case 'checkin':
      return <TourCheckin tour={tour} />
    case 'requirements':
      return (
        <TourRequirementsTab
          tourId={tour.id}
          quoteId={tour.quote_id}
          onAddRequest={onAddRequest}
          onOpenRequestDialog={onOpenRequestDialog}
        />
      )
    case 'files':
      return <TourFilesManager tourId={tour.id} tourCode={tour.code || ''} quoteId={tour.quote_id} itineraryId={tour.itinerary_id} />
    case 'designs':
      return <TourDesignsTab tourId={tour.id} proposalId={undefined} />
    case 'overview':
      return (
        <div className="space-y-6">
          <TourOverview tour={tour} />
          <TourPayments tour={tour} showSummary={false} />
          <TourCosts tour={tour} showSummary={false} />
        </div>
      )
    default:
      return <TourOverview tour={tour} />
  }
}

// ============================================================================
// TourTabs - 完整元件（含頁籤列，給 Dialog 用）
// ============================================================================

interface TourTabsProps {
  tour: Tour
  defaultTab?: TourTabValue
  onTabChange?: (tab: TourTabValue) => void
  hiddenTabs?: TourTabValue[]
  onAddRequest?: () => void
}

export function TourTabs({
  tour,
  defaultTab = 'members',
  onTabChange,
  hiddenTabs = [],
  onAddRequest,
}: TourTabsProps) {
  const [activeTab, setActiveTab] = useState<TourTabValue>(defaultTab)

  const handleTabChange = useCallback((tab: TourTabValue) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }, [onTabChange])

  const visibleTabs = TOUR_TABS.filter(tab => !hiddenTabs.includes(tab.value))

  return (
    <div className="flex flex-col h-full">
      {/* 頁籤列 */}
      <div className="flex border-b bg-muted/30 overflow-x-auto px-4">
        {visibleTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              "border-b-2 -mb-px",
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-auto p-4">
        <TourTabContent
          tour={tour}
          activeTab={activeTab}
          onAddRequest={onAddRequest}
        />
      </div>
    </div>
  )
}
