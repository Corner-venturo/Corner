'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tour } from '@/stores/types'
import { useOrdersSlim } from '@/data'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CurrencyCell } from '@/components/table-cells'
import { COMP_TOURS_LABELS } from '../constants/labels'
import { TOUR_OVERVIEW } from '../constants'
import { useTourChannelOperations, TourStoreActions } from './TourChannelOperations'
import { logger } from '@/lib/utils/logger'

interface TourOverviewProps {
  tour: Tour
  orderFilter?: string // 選填：顯示特定訂單的總覽信息
  onEdit?: () => void // 選填：編輯基本資料的回調
  onManageQuote?: () => void // 選填：管理報價單的回調
  onManageItinerary?: () => void // 選填：管理行程表的回調
  onOpenContractDialog?: () => void // 選填：產出合約的回調
  onArchive?: () => void // 選填：封存的回調
}

export const TourOverview = React.memo(function TourOverview({
  tour,
  orderFilter,
  onEdit,
  onManageQuote,
  onManageItinerary,
  onOpenContractDialog,
  onArchive,
}: TourOverviewProps) {
  const router = useRouter()
  const { items: orders } = useOrdersSlim()
  const { channels } = useWorkspaceChannels()

  // 檢查該團是否已有頻道
  const existingChannel = channels.find((ch: { tour_id?: string | null }) => ch.tour_id === tour.id)

  // Stub actions for channel operations
  const noopActions: TourStoreActions = { fetchAll: async () => { /* noop */ } }
  const { handleCreateChannel } = useTourChannelOperations({ actions: noopActions })

  const handleChannelClick = async () => {
    if (existingChannel) {
      router.push(`/workspace?channel=${existingChannel.id}`)
    } else {
      logger.log('🔵 [總覽快捷] 建立頻道:', tour.code)
      await handleCreateChannel(tour)
    }
  }

  // 如果有 orderFilter，取得該訂單的資料
  const order = orderFilter ? orders.find(o => o.id === orderFilter) : null

  // 根據是否為訂單視圖，顯示不同的卡片資料
  const overviewCards: Array<{
    title: string
    value?: string
    amount?: number
    icon: typeof DollarSign
    color: string
  }> = order
    ? [
        {
          title: COMP_TOURS_LABELS.訂單金額,
          amount: order.total_amount ?? 0,
          icon: DollarSign,
          color: 'text-morandi-gold',
        },
        {
          title: COMP_TOURS_LABELS.付款狀態,
          value: order.payment_status || '-',
          icon: order.payment_status === 'paid' ? CheckCircle : AlertCircle,
          color:
            order.payment_status === 'paid'
              ? 'text-morandi-green'
              : order.payment_status === 'partial'
                ? 'text-morandi-gold'
                : 'text-morandi-red',
        },
        {
          title: COMP_TOURS_LABELS.已付金額,
          amount: order.paid_amount ?? 0,
          icon: TrendingUp,
          color: 'text-morandi-green',
        },
        {
          title: COMP_TOURS_LABELS.未付金額,
          amount: order.remaining_amount ?? 0,
          icon: TrendingUp,
          color: 'text-morandi-red',
        },
        {
          title: COMP_TOURS_LABELS.訂單人數,
          value: `${order.member_count ?? 0} 人`,
          icon: Users,
          color: 'text-morandi-gold',
        },
        {
          title: COMP_TOURS_LABELS.聯絡人,
          value: order.contact_person || '-',
          icon: Users,
          color: 'text-morandi-primary',
        },
      ]
    : [
        {
          title: COMP_TOURS_LABELS.報價單價格,
          amount: tour.price ?? 0,
          icon: DollarSign,
          color: 'text-morandi-gold',
        },
        {
          title: COMP_TOURS_LABELS.合約狀態,
          value: tour.contract_status || COMP_TOURS_LABELS.未簽約,
          icon: tour.contract_status === 'signed' ? CheckCircle : AlertCircle,
          color: tour.contract_status === 'signed' ? 'text-morandi-green' : 'text-morandi-red',
        },
        {
          title: COMP_TOURS_LABELS.總收入,
          amount: tour.total_revenue ?? 0,
          icon: TrendingUp,
          color: 'text-morandi-green',
        },
        {
          title: COMP_TOURS_LABELS.總支出,
          amount: tour.total_cost ?? 0,
          icon: TrendingUp,
          color: 'text-morandi-red',
        },
        {
          title: COMP_TOURS_LABELS.淨利潤,
          amount: tour.profit ?? 0,
          icon: TrendingUp,
          color: (tour.profit ?? 0) >= 0 ? 'text-morandi-green' : 'text-morandi-red',
        },
        {
          title: COMP_TOURS_LABELS.總訂單數,
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
      {/* 快捷動作列 */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenContractDialog}
        >
          {TOUR_OVERVIEW.action_contract}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleChannelClick}
        >
          {existingChannel ? TOUR_OVERVIEW.action_enter_channel : TOUR_OVERVIEW.action_create_channel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onArchive}
        >
          {TOUR_OVERVIEW.action_archive}
        </Button>
      </div>

      {/* 基本資訊 + 快速操作 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-morandi-secondary" />
            <span className="text-morandi-secondary">{COMP_TOURS_LABELS.LABEL_9750}</span>
            <span className="font-medium text-morandi-primary">{tour.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-morandi-secondary" />
            <span className="text-morandi-secondary">{COMP_TOURS_LABELS.LABEL_5475}</span>
            <span className="font-medium text-morandi-primary">{tour.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <span className="font-medium text-morandi-primary">{tour.departure_date} ~ {tour.return_date}</span>
          </div>
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getStatusBadge(tour.status ?? ''))}>
            {tour.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onManageQuote} size="sm" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Calculator size={14} className="mr-1" />{COMP_TOURS_LABELS.LABEL_4601}
          </Button>
          {onManageItinerary && (
            <Button onClick={onManageItinerary} size="sm" variant="outline">
              <FileText size={14} className="mr-1" />{COMP_TOURS_LABELS.行程表}
            </Button>
          )}
          <Button onClick={onEdit} size="sm" variant="outline">
            <FileText size={14} className="mr-1" />{COMP_TOURS_LABELS.EDIT}
          </Button>
        </div>
      </div>

      {/* 財務概況 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* 區塊標題行 */}
        <div className="bg-morandi-container/50 border-b border-border/60 px-4 py-2">
          <span className="text-sm font-medium text-morandi-primary">{COMP_TOURS_LABELS.LABEL_3513}</span>
        </div>
        {/* 內容 */}
        <div className="flex items-stretch">
          {overviewCards.map((card, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className="w-px bg-border my-3" />
              )}
              <div className="flex-1 flex items-center gap-3 px-4 py-3">
                <div className={card.color}>
                  <card.icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-morandi-secondary">{card.title}</p>
                  {card.amount !== undefined ? (
                    <CurrencyCell amount={card.amount} className="text-sm font-semibold text-morandi-primary" />
                  ) : (
                    <p className="text-sm font-semibold text-morandi-primary">{card.value}</p>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
})
