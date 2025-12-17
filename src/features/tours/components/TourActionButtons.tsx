/**
 * TourActionButtons - Action buttons for tour operations
 */

'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  FileSignature,
  MessageSquare,
  LockOpen,
  Eye,
  Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tour, Quote, User } from '@/stores/types'

interface UseTourActionButtonsParams {
  quotes: Quote[]
  activeStatusTab: string
  user: User | null
  operations: {
    handleArchiveTour: (tour: Tour) => Promise<void>
  }
  openDialog: (type: string, data?: Tour) => void
  setSelectedTour: (tour: Tour) => void
  setDeleteConfirm: (state: { isOpen: boolean; tour: Tour | null }) => void
  handleCreateChannel: (tour: Tour) => Promise<void>
  handleUnlockTour: (tour: Tour) => Promise<void>
  // 新增：打開報價單/行程表/合約連結對話框
  onOpenQuoteDialog?: (tour: Tour) => void
  onOpenItineraryDialog?: (tour: Tour) => void
  onOpenContractDialog?: (tour: Tour) => void
}

export function useTourActionButtons(params: UseTourActionButtonsParams) {
  const router = useRouter()
  const {
    quotes,
    activeStatusTab,
    user,
    operations,
    openDialog,
    setSelectedTour,
    setDeleteConfirm,
    handleCreateChannel,
    handleUnlockTour,
    onOpenQuoteDialog,
    onOpenItineraryDialog,
    onOpenContractDialog,
  } = params

  const renderActions = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      const tourQuote = quotes.find(q => q.tour_id === tour.id)
      const hasQuote = !!tourQuote

      return (
        <div className="flex items-center gap-1">
          {/* 查看詳情 */}
          <button
            onClick={e => {
              e.stopPropagation()
              router.push(`/tours/${tour.id}`)
            }}
            className="p-1 text-morandi-primary/80 hover:text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors"
            title="查看詳情"
          >
            <Eye size={14} />
          </button>

          {/* 編輯 */}
          <button
            onClick={e => {
              e.stopPropagation()
              openDialog('edit', tour)
            }}
            className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯"
          >
            <Edit2 size={14} />
          </button>

          {/* 建立工作空間頻道 */}
          <button
            onClick={e => {
              e.stopPropagation()
              handleCreateChannel(tour)
            }}
            className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
            title="建立工作空間頻道"
          >
            <MessageSquare size={14} />
          </button>

          {/* 連結文件（報價單/行程表） */}
          <button
            onClick={e => {
              e.stopPropagation()
              setSelectedTour(tour)
              if (onOpenQuoteDialog) {
                onOpenQuoteDialog(tour)
              } else if (hasQuote) {
                router.push(`/quotes/${tourQuote.id}`)
              } else {
                router.push(`/quotes?tour_id=${tour.id}`)
              }
            }}
            className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
            title="連結文件"
          >
            <Link size={14} />
          </button>

          {/* 合約管理 */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (onOpenContractDialog) {
                onOpenContractDialog(tour)
              } else {
                router.push(`/contracts?tour_id=${tour.id}`)
              }
            }}
            className="p-1 text-morandi-gold/80 hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
            title="合約管理"
          >
            <FileSignature size={14} />
          </button>

          {/* 封存/解除封存 */}
          <button
            onClick={e => {
              e.stopPropagation()
              operations.handleArchiveTour(tour)
            }}
            className={cn(
              'p-1 rounded transition-colors',
              tour.archived
                ? 'text-morandi-gold/60 hover:text-morandi-gold hover:bg-morandi-gold/10'
                : 'text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-container'
            )}
            title={tour.archived ? '解除封存' : '封存'}
          >
            {tour.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>

          {/* 解鎖結團按鈕（僅封存分頁且管理員可見） */}
          {activeStatusTab === 'archived' &&
            tour.closing_status === 'closed' &&
            user?.permissions?.includes('super_admin') && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  handleUnlockTour(tour)
                }}
                className="p-1 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10 rounded transition-colors"
                title="解鎖結團"
              >
                <LockOpen size={14} />
              </button>
            )}

          {/* 刪除 */}
          <button
            onClick={e => {
              e.stopPropagation()
              setDeleteConfirm({ isOpen: true, tour })
            }}
            className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
            title="刪除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    },
    [
      quotes,
      activeStatusTab,
      user,
      operations,
      openDialog,
      router,
      setSelectedTour,
      setDeleteConfirm,
      handleCreateChannel,
      handleUnlockTour,
      onOpenQuoteDialog,
      onOpenItineraryDialog,
    ]
  )

  return {
    renderActions,
  }
}
