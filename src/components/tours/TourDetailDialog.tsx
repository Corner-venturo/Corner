'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { useTourDetails } from '@/features/tours/hooks/useTours-advanced'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useAuthStore } from '@/stores/auth-store'
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
import { MessageSquare, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'orders', label: '訂單管理' },
  { value: 'members', label: '團員名單' },
  { value: 'payments', label: '收款紀錄' },
  { value: 'costs', label: '成本支出' },
  { value: 'documents', label: '文件確認' },
]

interface TourDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  tourId: string | null
  onDataChange?: () => void
}

export function TourDetailDialog({ isOpen, onClose, tourId, onDataChange }: TourDetailDialogProps) {
  const router = useRouter()
  const { tour, loading, actions } = useTourDetails(tourId || '')
  const { channels, createChannel, currentWorkspace } = useWorkspaceChannels()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [triggerPaymentAdd, setTriggerPaymentAdd] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showDepartureDialog, setShowDepartureDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // 建立頻道對話框狀態
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
    }
  }, [isOpen, tourId])

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

  // 確認建立頻道
  const handleConfirmCreateChannel = async () => {
    if (!tour || !currentWorkspace || !user || selectedMembers.length === 0) return

    setIsCreatingChannel(true)
    try {
      const newChannel = await createChannel({
        workspace_id: currentWorkspace.id,
        name: channelName.trim(),
        description: channelDescription.trim() || undefined,
        type: 'private',
        tour_id: tour.id,
        created_by: user.id,
      })

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

        setShowCreateChannelDialog(false)
        setChannelName('')
        setChannelDescription('')
        setSelectedMembers([])

        router.push(`/workspace?channel=${newChannel.id}`)
      }
    } catch (error) {
      toast.error('建立頻道失敗')
    } finally {
      setIsCreatingChannel(false)
    }
  }

  const handleCloseChannelDialog = () => {
    setShowCreateChannelDialog(false)
    setChannelName('')
    setChannelDescription('')
    setSelectedMembers([])
  }

  const handleSuccess = () => {
    actions.refresh()
    onDataChange?.()
  }

  const renderTabContent = () => {
    if (!tour) return null

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>
            {tour ? `${tour.name} (${tour.code})` : '旅遊團詳情'}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="h-14 bg-morandi-gold/90 text-white px-6 flex items-center justify-between border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {loading ? '載入中...' : tour ? `${tour.name} (${tour.code})` : '找不到旅遊團'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {tour && (
              <>
                {/* 出團資料表 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowDepartureDialog(true)}
                >
                  <FileText size={16} className="mr-1" />
                  出團資料表
                </Button>

                {/* 結團 */}
                {!tour.archived && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    結團
                  </Button>
                )}

                {/* 工作頻道 */}
                {existingChannel ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => router.push(`/workspace?channel=${existingChannel.id}`)}
                  >
                    <MessageSquare size={16} className="mr-1" />
                    前往工作頻道
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    disabled={isCreatingChannel}
                    onClick={() => setShowCreateChannelDialog(true)}
                  >
                    <MessageSquare size={16} className="mr-1" />
                    {isCreatingChannel ? '建立中...' : '建立工作頻道'}
                  </Button>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        {tour && (
          <div className="h-12 bg-white border-b px-6 flex items-center gap-1 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.value
                    ? 'bg-morandi-gold text-white'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-morandi-secondary">載入中...</p>
            </div>
          ) : !tour ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-morandi-secondary">找不到指定的旅遊團</p>
            </div>
          ) : (
            <div className="p-6">
              {renderTabContent()}
            </div>
          )}
        </div>

        {/* Dialogs */}
        {tour && (
          <>
            <TourCloseDialog
              tour={tour}
              open={showCloseDialog}
              onOpenChange={setShowCloseDialog}
              onSuccess={handleSuccess}
            />

            <TourDepartureDialog
              tour={tour}
              open={showDepartureDialog}
              onOpenChange={setShowDepartureDialog}
            />

            <CreateChannelDialog
              isOpen={showCreateChannelDialog}
              channelName={channelName}
              channelDescription={channelDescription}
              channelType="private"
              selectedMembers={selectedMembers}
              onChannelNameChange={setChannelName}
              onChannelDescriptionChange={setChannelDescription}
              onChannelTypeChange={() => {}}
              onMembersChange={setSelectedMembers}
              onClose={handleCloseChannelDialog}
              onCreate={handleConfirmCreateChannel}
            />

            <TourEditDialog
              isOpen={showEditDialog}
              onClose={() => setShowEditDialog(false)}
              tour={tour}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
