'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useTourDetails } from '@/features/tours/hooks/useTours-advanced'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Tour } from '@/stores/types'

// 動態載入頁籤內容組件
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

const TourFilesTab = dynamic(
  () => import('@/components/tours/tour-files-tab').then(m => m.TourFilesTab),
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

// 載入中組件
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-morandi-secondary" size={24} />
    </div>
  )
}

// 頁籤定義
const tabs = [
  { value: 'members', label: '團員名單' },
  { value: 'orders', label: '訂單管理' },
  { value: 'requirements', label: '需求總覽' },
  { value: 'confirmation', label: '團確單' },
  { value: 'checkin', label: '報到' },
  { value: 'designs', label: '設計' },
  { value: 'files', label: '檔案' },
  { value: 'overview', label: '總覽' },
]

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string

  const { user } = useAuthStore()
  const { channels } = useWorkspaceChannels()
  const { currentWorkspace } = useWorkspaceChannels()

  // 狀態
  const [tourId, setTourId] = useState<string | null>(null)
  const [loadingTourId, setLoadingTourId] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'members')
  const [forceShowPnr, setForceShowPnr] = useState(false)

  // 用 code 查詢 tour_id
  useEffect(() => {
    async function fetchTourId() {
      setLoadingTourId(true)
      const { data, error } = await supabase
        .from('tours')
        .select('id')
        .eq('code', code)
        .single()

      if (error || !data) {
        setTourId(null)
      } else {
        setTourId(data.id)
      }
      setLoadingTourId(false)
    }

    if (code) {
      fetchTourId()
    }
  }, [code])

  // 載入團詳情
  const { tour, loading, actions } = useTourDetails(tourId || '')

  // 檢查是否已有工作頻道
  const existingChannel = channels.find((ch: { tour_id?: string | null }) => ch.tour_id === tour?.id)

  // 返回列表
  const handleBack = () => {
    router.push('/tours')
  }

  // 處理資料更新
  const handleSuccess = () => {
    actions.refresh()
    setForceShowPnr(true)
  }

  // 渲染頁籤內容
  const renderTabContent = () => {
    if (!tour) return null

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <TourOverview tour={tour} />
            <TourPayments tour={tour} showSummary={false} />
            <TourCosts tour={tour} showSummary={false} />
          </div>
        )
      case 'orders':
        return <TourOrders tour={tour} />
      case 'members':
        return (
          <OrderMembersExpandable
            tourId={tour.id}
            workspaceId={currentWorkspace?.id || ''}
            mode="tour"
            forceShowPnr={forceShowPnr}
            tour={tour}
          />
        )
      case 'confirmation':
        return <TourConfirmationSheet tourId={tour.id} />
      case 'checkin':
        return <TourCheckin tour={tour} />
      case 'requirements':
        return <TourRequirementsTab tourId={tour.id} quoteId={tour.quote_id} />
      case 'files':
        return <TourFilesTab tourId={tour.id} tourCode={tour.code || ''} />
      case 'designs':
        return <TourDesignsTab tourId={tour.id} proposalId={undefined} />
      default:
        return <TourOverview tour={tour} />
    }
  }

  // 載入中
  if (loadingTourId || loading) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="載入中..."
          icon={MapPin}
          showBackButton
          onBack={handleBack}
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' },
            { label: code, href: `/tours/${code}` },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-morandi-secondary" size={32} />
        </div>
      </div>
    )
  }

  // 找不到團
  if (!tour) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="找不到旅遊團"
          icon={MapPin}
          showBackButton
          onBack={handleBack}
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' },
            { label: code, href: `/tours/${code}` },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-morandi-secondary mb-4">找不到團號 {code} 的旅遊團</p>
            <Button onClick={handleBack}>返回列表</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={tour.name}
        icon={MapPin}
        showBackButton
        onBack={handleBack}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '旅遊團管理', href: '/tours' },
          { label: `${tour.code} ${tour.name}`, href: `/tours/${code}` },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            {existingChannel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workspace?channel=${existingChannel.id}`)}
              >
                <MessageSquare size={16} className="mr-1" />
                頻道
              </Button>
            )}
          </div>
        }
      />

      {/* 內容區域 */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}
