'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { useEmployeeStore } from '@/stores'
import { useTourDetails } from '@/features/tours/hooks/useTours-advanced'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useAuthStore } from '@/stores/auth-store'
import { addChannelMembers } from '@/services/workspace-members'
import { TourOverview } from '@/components/tours/tour-overview'
import { TourOrders } from '@/components/tours/tour-orders'
import { OrderMembersExpandable } from '@/components/orders/OrderMembersExpandable'
import { TourPayments } from '@/components/tours/tour-payments'
import { TourCosts } from '@/components/tours/tour-costs'
import { TourDocuments } from '@/components/tours/tour-documents'
import { TourCloseDialog } from '@/components/tours/tour-close-dialog'
import { TourDepartureDialog } from '@/components/tours/tour-departure-dialog'
import { TourEditDialog } from '@/components/tours/tour-edit-dialog'
import { CreateChannelDialog } from '@/components/workspace/channel-sidebar/CreateChannelDialog'
import { MessageSquare, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { EditingWarningBanner } from '@/components/EditingWarningBanner'

const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'orders', label: '訂單管理' },
  { value: 'members', label: '團員名單' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
  { value: 'documents', label: '文件確認' },
]

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string
  const { tour, loading } = useTourDetails(tourId)
  const { channels, createChannel, currentWorkspace } = useWorkspaceChannels()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
    const [triggerPaymentAdd, setTriggerPaymentAdd] = useState(false)
  const [triggerMemberAdd, setTriggerMemberAdd] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showDepartureDialog, setShowDepartureDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // 建立頻道對話框狀態
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // 檢查是否已有工作頻道
  const existingChannel = channels.find((ch: { tour_id?: string | null }) => ch.tour_id === tour?.id)

  // 開啟建立頻道對話框時，預設頻道資訊
  useEffect(() => {
    if (showCreateChannelDialog && tour) {
      setChannelName(tour.name)
      setChannelDescription(`${tour.code} - ${tour.name} 的工作頻道`)
      if (user?.id && !selectedMembers.includes(user.id)) {
        setSelectedMembers([user.id])
      }
    }
  }, [showCreateChannelDialog, tour, user?.id])

  // 點擊建立頻道按鈕
  const handleCreateWorkChannel = () => {
    if (!tour) return
    setShowCreateChannelDialog(true)
  }

  // 確認建立頻道
  const handleConfirmCreateChannel = async () => {
    if (!tour || !currentWorkspace || !user || selectedMembers.length === 0) return

    setIsCreatingChannel(true)
    try {
      // 建立頻道
      const newChannel = await createChannel({
        workspace_id: currentWorkspace.id,
        name: channelName.trim(),
        description: channelDescription.trim() || undefined,
        type: 'private', // 統一為私密頻道
        tour_id: tour.id,
        created_by: user.id,
      })

      // 批次加入選中的成員
      if (newChannel?.id) {
        const channelMemberStore = useChannelMemberStore.getState()

        const memberPromises = selectedMembers.map(async (employeeId) => {
          return channelMemberStore.create({
            workspace_id: currentWorkspace.id,
            channel_id: newChannel.id,
            employee_id: employeeId,
            role: employeeId === user.id ? 'owner' : 'member',
            status: 'active',
          })
        })

        await Promise.all(memberPromises)
        await channelMemberStore.fetchAll()

        toast.success(`工作頻道已建立！已邀請 ${selectedMembers.length} 位成員`)

        // 關閉對話框並重置狀態
        setShowCreateChannelDialog(false)
        setChannelName('')
        setChannelDescription('')
        setSelectedMembers([])

        // 跳轉到工作空間並選中新頻道
        router.push(`/workspace?channel=${newChannel.id}`)
      }
    } catch (error) {
      toast.error('建立頻道失敗')
    } finally {
      setIsCreatingChannel(false)
    }
  }

  // 關閉對話框
  const handleCloseChannelDialog = () => {
    setShowCreateChannelDialog(false)
    setChannelName('')
    setChannelDescription('')
    setSelectedMembers([])
  }

  // 載入中
  if (loading) {
    return (
      <div className="p-6">
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">載入中...</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  // 找不到旅遊團
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
            setShowEditDialog(true)
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
        return <TourOverview tour={tour} onEdit={() => setShowEditDialog(true)} />
      case 'orders':
        return <TourOrders tour={tour} />
      case 'members':
        return <OrderMembersExpandable tourId={tour.id} workspaceId={currentWorkspace?.id || ''} mode="tour" />
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
    <div className="h-full flex flex-col">
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
                className="flex items-center gap-2 px-4 py-2 text-sm bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold-hover transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 text-sm bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare size={16} />
                {isCreatingChannel ? '建立中...' : '建立工作頻道'}
              </button>
            )}
          </div>
        }
      />

      {/* 編輯衝突警告 */}
      <EditingWarningBanner
        resourceType="tour"
        resourceId={params.id as string}
        resourceName="此旅遊團"
      />

      {activeTab === 'orders' ? (
        <div className="flex-1 overflow-auto flex flex-col">{renderTabContent()}</div>
      ) : (
        <ContentContainer>{renderTabContent()}</ContentContainer>
      )}

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

      {/* 建立頻道對話框 */}
      <CreateChannelDialog
        isOpen={showCreateChannelDialog}
        channelName={channelName}
        channelDescription={channelDescription}
        channelType="private"
        selectedMembers={selectedMembers}
        onChannelNameChange={setChannelName}
        onChannelDescriptionChange={setChannelDescription}
        onChannelTypeChange={() => {}} // 不允許修改類型
        onMembersChange={setSelectedMembers}
        onClose={handleCloseChannelDialog}
        onCreate={handleConfirmCreateChannel}
      />

      {/* 編輯旅遊團對話框 */}
      <TourEditDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        tour={tour}
        onSuccess={() => {
          // 重新載入旅遊團資料
          window.location.reload()
        }}
      />
    </div>
  )
}
