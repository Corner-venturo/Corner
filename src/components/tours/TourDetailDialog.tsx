'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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
import { TourDocuments } from '@/components/tours/tour-documents'
import { TourRequests } from '@/components/tours/tour-requests'
import { TourCloseDialog } from '@/components/tours/tour-close-dialog'
import { TourDepartureDialog } from '@/components/tours/tour-departure-dialog'
import { CreateChannelDialog } from '@/components/workspace/channel-sidebar/CreateChannelDialog'
import { MessageSquare, FileText, X, Printer, Loader2, Plane } from 'lucide-react'
import { JapanEntryCardPrint } from '@/components/tours/JapanEntryCardPrint'
import { TourPnrToolDialog } from '@/components/tours/TourPnrToolDialog'
import { DocumentVersionPicker, ItineraryVersionPicker } from '@/components/documents'
import { Input } from '@/components/ui/input'
import { Dialog as EntryCardDialog, DialogContent as EntryCardDialogContent, DialogHeader as EntryCardDialogHeader, DialogTitle as EntryCardDialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TourEditDialog = dynamic(
  () => import('@/components/tours/tour-edit-dialog').then(m => m.TourEditDialog),
  { loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>, ssr: false }
)

const TourPayments = dynamic(
  () => import('@/components/tours/tour-payments').then(m => m.TourPayments),
  { loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>, ssr: false }
)

const TourCosts = dynamic(
  () => import('@/components/tours/tour-costs').then(m => m.TourCosts),
  { loading: () => <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>, ssr: false }
)

const tabs = [
  { value: 'overview', label: '總覽' },
  { value: 'orders', label: '訂單管理' },
  { value: 'members', label: '團員名單' },
  { value: 'requests', label: '需求管理' },
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
  const [showPnrToolDialog, setShowPnrToolDialog] = useState(false)
  const [showQuotePicker, setShowQuotePicker] = useState(false)
  const [showItineraryPicker, setShowItineraryPicker] = useState(false)

  // 入境卡列印
  const [showEntryCardDialog, setShowEntryCardDialog] = useState(false)
  const [entryCardSettings, setEntryCardSettings] = useState({
    flightNumber: '',
    hotelName: '',
    hotelAddress: '',
    hotelPhone: '',
    stayDays: 5,
  })
  const [tourMembers, setTourMembers] = useState<Array<{
    id: string
    order_id: string
    passport_name?: string | null
    chinese_name?: string | null
    birth_date?: string | null
    passport_number?: string | null
    special_meal?: string | null
    flight_cost?: number | null
    pnr?: string | null
  }>>([])

  // 載入團員資料（用於入境卡列印）
  useEffect(() => {
    const loadMembers = async () => {
      if (!tour?.id) return
      const { supabase } = await import('@/lib/supabase/client')

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('tour_id', tour.id)

      if (!orders || orders.length === 0) return

      const orderIds = orders.map(o => o.id)

      const { data: members } = await supabase
        .from('order_members')
        .select('id, order_id, passport_name, chinese_name, birth_date, passport_number, special_meal, flight_cost, pnr')
        .in('order_id', orderIds)

      if (members) {
        setTourMembers(members)
      }
    }

    if (showEntryCardDialog || showPnrToolDialog) {
      loadMembers()
    }
  }, [tour?.id, showEntryCardDialog, showPnrToolDialog])

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
        return (
          <div className="space-y-6">
            {/* 基本資訊 */}
            <TourOverview
              tour={tour}
              onEdit={() => setShowEditDialog(true)}
              onManageQuote={() => setShowQuotePicker(true)}
              onManageItinerary={() => setShowItineraryPicker(true)}
            />

            {/* 收款紀錄 */}
            <TourPayments
              tour={tour}
              triggerAdd={triggerPaymentAdd}
              onTriggerAddComplete={() => setTriggerPaymentAdd(false)}
              showSummary={false}
            />

            {/* 成本支出 */}
            <TourCosts tour={tour} showSummary={false} />

            {/* 文件確認 */}
            <div>
              <h3 className="text-sm font-medium text-morandi-secondary mb-3">文件確認</h3>
              <TourDocuments tour={tour} showSummary={false} />
            </div>
          </div>
        )
      case 'orders':
        return <TourOrders tour={tour} />
      case 'members':
        return <OrderMembersExpandable tourId={tour.id} workspaceId={currentWorkspace?.id || ''} mode="tour" />
      case 'requests':
        return <TourRequests tourId={tour.id} />
      default:
        return <TourOverview tour={tour} />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col [&>button:last-child]:hidden">
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>
            {tour ? `${tour.name} (${tour.code})` : '旅遊團詳情'}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header: 團名 + Tabs + 功能按鈕 (同一排) */}
        <div className="flex-shrink-0 h-12 bg-morandi-gold text-white px-4 flex items-center gap-4">
          {/* 團名 */}
          <h2 className="text-base font-semibold whitespace-nowrap">
            {loading ? '載入中...' : tour?.name || '找不到旅遊團'}
          </h2>

          {/* Tabs */}
          {tour && (
            <div className="flex items-center flex-1 min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors rounded',
                    activeTab === tab.value
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* 功能按鈕 */}
          <div className="flex items-center gap-1">
            {tour && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20 h-8"
                  onClick={() => setShowDepartureDialog(true)}
                >
                  <FileText size={15} className="mr-1" />
                  出團資料表
                </Button>
                {!tour.archived && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/20 h-8"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    結團
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20 h-8"
                  onClick={() => setShowPnrToolDialog(true)}
                >
                  <Plane size={15} className="mr-1" />
                  PNR
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20 h-8"
                  onClick={() => setShowEntryCardDialog(true)}
                >
                  <Printer size={15} className="mr-1" />
                  入境卡
                </Button>
                {existingChannel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/20 h-8"
                    onClick={() => router.push(`/workspace?channel=${existingChannel.id}`)}
                  >
                    <MessageSquare size={15} />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-morandi-secondary">載入中...</p>
            </div>
          ) : !tour ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-morandi-secondary">找不到指定的旅遊團</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 overflow-auto">
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

            {/* 報價單版本選擇器 */}
            <DocumentVersionPicker
              isOpen={showQuotePicker}
              onClose={() => setShowQuotePicker(false)}
              tour={tour}
            />

            {/* 行程表版本選擇器 */}
            <ItineraryVersionPicker
              isOpen={showItineraryPicker}
              onClose={() => setShowItineraryPicker(false)}
              tour={tour}
            />

            {/* PNR 電報工具 */}
            <TourPnrToolDialog
              isOpen={showPnrToolDialog}
              onClose={() => setShowPnrToolDialog(false)}
              tourId={tour.id}
              tourCode={tour.code || ''}
              tourName={tour.name}
              members={tourMembers.map(m => ({
                id: m.id,
                order_id: m.order_id,
                passport_name: m.passport_name,
                chinese_name: m.chinese_name,
                special_meal: m.special_meal,
                flight_cost: m.flight_cost,
                pnr: m.pnr,
              }))}
              onSuccess={handleSuccess}
            />

            {/* 入境卡列印對話框 */}
            <EntryCardDialog open={showEntryCardDialog} onOpenChange={setShowEntryCardDialog}>
              <EntryCardDialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
                <div className="no-print flex items-center justify-between mb-4">
                  <EntryCardDialogHeader>
                    <EntryCardDialogTitle>列印日本入境卡</EntryCardDialogTitle>
                  </EntryCardDialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEntryCardDialog(false)}
                    >
                      關閉
                    </Button>
                    <Button onClick={() => window.print()}>
                      <Printer size={16} className="mr-1" />
                      列印
                    </Button>
                  </div>
                </div>

                {/* 設定區域 */}
                <div className="no-print grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-morandi-container/20 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">航班號碼</label>
                    <Input
                      value={entryCardSettings.flightNumber}
                      onChange={e => setEntryCardSettings(prev => ({ ...prev, flightNumber: e.target.value }))}
                      placeholder="例：BR-108"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店名稱</label>
                    <Input
                      value={entryCardSettings.hotelName}
                      onChange={e => setEntryCardSettings(prev => ({ ...prev, hotelName: e.target.value }))}
                      placeholder="例：東京灣希爾頓"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店地址</label>
                    <Input
                      value={entryCardSettings.hotelAddress}
                      onChange={e => setEntryCardSettings(prev => ({ ...prev, hotelAddress: e.target.value }))}
                      placeholder="例：東京都港區..."
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">飯店電話</label>
                    <Input
                      value={entryCardSettings.hotelPhone}
                      onChange={e => setEntryCardSettings(prev => ({ ...prev, hotelPhone: e.target.value }))}
                      placeholder="例：03-1234-5678"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">停留天數</label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={entryCardSettings.stayDays}
                      onChange={e => setEntryCardSettings(prev => ({ ...prev, stayDays: parseInt(e.target.value) || 5 }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* 預覽區域 */}
                <JapanEntryCardPrint
                  members={tourMembers}
                  flightNumber={entryCardSettings.flightNumber || 'BR-XXX'}
                  hotelName={entryCardSettings.hotelName}
                  hotelAddress={entryCardSettings.hotelAddress}
                  hotelPhone={entryCardSettings.hotelPhone}
                  stayDays={entryCardSettings.stayDays}
                />
              </EntryCardDialogContent>
            </EntryCardDialog>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
