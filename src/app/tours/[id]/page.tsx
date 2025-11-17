'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { useTourStore } from '@/stores'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import { addChannelMembers } from '@/services/workspace-members'
import { TourOverview } from '@/components/tours/tour-overview'
import { TourOrders } from '@/components/tours/tour-orders'
import { TourMembersAdvanced } from '@/components/tours/tour-members-advanced'
import { TourOperations } from '@/components/tours/tour-operations'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'
import { TourDocuments } from '@/components/tours/tour-documents'
import { TourAddOns } from '@/components/tours/tour-add-ons'
import { TourCloseDialog } from '@/components/tours/tour-close-dialog'
import { TourDepartureDialog } from '@/components/tours/tour-departure-dialog'
import { MessageSquare, FileText } from 'lucide-react'
import { toast } from 'sonner'

const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'orders', label: '訂單管理' },
  { value: 'members', label: '團員名單' },
  { value: 'operations', label: '團務' },
  { value: 'addons', label: '加購' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
  { value: 'documents', label: '文件確認' },
]

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { items: tours } = useTourStore()
  const { channels, createChannel, currentWorkspace } = useWorkspaceChannels()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [triggerAddOnAdd, setTriggerAddOnAdd] = useState(false)
  const [triggerPaymentAdd, setTriggerPaymentAdd] = useState(false)
  const [triggerMemberAdd, setTriggerMemberAdd] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showDepartureDialog, setShowDepartureDialog] = useState(false)

  const tour = tours.find(t => t.id === params.id)

  // 檢查是否已有工作頻道
  const existingChannel = channels.find((ch: { tour_id?: string | null }) => ch.tour_id === tour?.id)

  // 建立工作頻道
  const handleCreateWorkChannel = async () => {
    if (!tour || !currentWorkspace || !user) return

    setIsCreatingChannel(true)
    try {
      const newChannel = await createChannel({
        workspace_id: currentWorkspace.id,
        name: tour.name, // 只顯示團名
        description: `${tour.code} - ${tour.name} 的工作頻道`,
        type: 'public',
        tour_id: tour.id,
        created_by: user.id, // 設定創建者
      })

      if (newChannel) {
        toast.success('工作頻道已建立！')
        // 跳轉到 workspace 並選擇該頻道
        router.push(`/workspace?channel=${newChannel.id}`)
      }
    } catch (error) {
      toast.error('建立頻道失敗')
    } finally {
      setIsCreatingChannel(false)
    }
  }

  if (!tour) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">找不到指定的旅遊團</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  // 統一的按鈕配置
  const getButtonConfig = () => {
    // 根據分頁決定按鈕文字和功能
    const getButtonLabel = () => {
      switch (activeTab) {
        case 'overview':
          return '編輯'
        case 'operations':
          return '新增欄位'
        case 'addons':
          return '新增加購'
        case 'payments':
          return '新增收款'
        case 'costs':
          return '新增成本'
        case 'orders':
          return '新增訂單'
        default:
          return null // 不顯示按鈕
      }
    }

    const buttonLabel = getButtonLabel()
    if (!buttonLabel) return null

    return {
      onAdd: () => {
        // 根據不同分頁執行不同的邏輯
        switch (activeTab) {
          case 'overview':
            // 功能: 編輯旅遊團基本資料
            break
          case 'operations':
            // 功能: 新增團務欄位
            break
          case 'addons':
            setTriggerAddOnAdd(true)
            break
          case 'payments':
            setTriggerPaymentAdd(true)
            break
          case 'costs':
            // 功能: 新增成本支出
            break
          case 'orders':
            // 功能: 新增訂單
            break
        }
      },
      addLabel: buttonLabel,
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TourOverview tour={tour} />
      case 'orders':
        return <TourOrders tour={tour} />
      case 'members':
        return <TourMembersAdvanced tour={tour} />
      case 'operations':
        return <TourOperations tour={tour} />
      case 'addons':
        return (
          <TourAddOns
            tour={tour}
            triggerAdd={triggerAddOnAdd}
            onTriggerAddComplete={() => setTriggerAddOnAdd(false)}
          />
        )
      case 'payments':
        return (
          <TourPayments
            tour={tour}
            triggerAdd={triggerPaymentAdd}
            onTriggerAddComplete={() => setTriggerPaymentAdd(false)}
          />
        )
      case 'costs':
        return <TourCosts tour={tour} />
      case 'documents':
        return <TourDocuments tour={tour} />
      default:
        return <TourOverview tour={tour} />
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <>
      <ResponsiveHeader
        title={`${tour.name} (${tour.code})`}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showBackButton={true}
        onBack={() => router.push('/tours')}
        {...(buttonConfig ? { onAdd: buttonConfig.onAdd, addLabel: buttonConfig.addLabel } : {})}
        actions={
          <div className="flex items-center gap-2">
            {/* 出團資料表按鈕 */}
            <button
              onClick={() => setShowDepartureDialog(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-morandi-primary border border-morandi-gold/30 rounded-lg hover:bg-morandi-gold/10 transition-colors"
            >
              <FileText size={16} />
              出團資料表
            </button>

            {/* 結團按鈕 */}
            {!tour.archived && (
              <button
                onClick={() => setShowCloseDialog(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                結團
              </button>
            )}

            {/* 工作頻道按鈕 */}
            {existingChannel ? (
              <button
                onClick={() => router.push(`/workspace?channel=${existingChannel.id}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-morandi-primary border border-morandi-gold/30 rounded-lg hover:bg-morandi-gold/10 transition-colors"
              >
                <MessageSquare size={16} />
                前往工作頻道
              </button>
            ) : (
              <button
                onClick={handleCreateWorkChannel}
                disabled={isCreatingChannel}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare size={16} />
                {isCreatingChannel ? '建立中...' : '建立工作頻道'}
              </button>
            )}
          </div>
        }
      />

      <ContentContainer>{renderTabContent()}</ContentContainer>

      {/* 結團對話框 */}
      <TourCloseDialog
        tour={tour}
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onSuccess={() => {
          // 重新載入旅遊團資料
          window.location.reload()
        }}
      />

      {/* 出團資料表對話框 */}
      <TourDepartureDialog
        tour={tour}
        open={showDepartureDialog}
        onOpenChange={setShowDepartureDialog}
      />
    </>
  )
}
