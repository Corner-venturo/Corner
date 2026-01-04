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
  Lock,
  Calculator,
  FileText,
  CheckCircle2,
  FileCheck,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tour, Quote, User } from '@/stores/types'

interface UseTourActionButtonsParams {
  quotes: Quote[]
  activeStatusTab: string
  user: User | null
  operations: {
    handleArchiveTour: (tour: Tour, reason?: string) => Promise<void>
  }
  onEditTour: (tour: Tour) => void
  setSelectedTour: (tour: Tour) => void
  setDeleteConfirm: (state: { isOpen: boolean; tour: Tour | null }) => void
  handleCreateChannel: (tour: Tour) => Promise<void>
  handleUnlockTour: (tour: Tour) => Promise<void>
  // 新增：打開報價單/行程表/合約連結對話框
  onOpenQuoteDialog?: (tour: Tour) => void
  onOpenItineraryDialog?: (tour: Tour) => void
  onOpenContractDialog?: (tour: Tour) => void
  // V2.0：確認出團 & 解鎖
  onConfirmTour?: (tour: Tour) => void
  onUnlockLockedTour?: (tour: Tour) => void
  // 結案
  onCloseTour?: (tour: Tour) => void
  // 封存對話框
  onOpenArchiveDialog?: (tour: Tour) => void
  // 團確單對話框
  onOpenTourConfirmationDialog?: (tour: Tour) => void
}

export function useTourActionButtons(params: UseTourActionButtonsParams) {
  const router = useRouter()
  const {
    quotes,
    activeStatusTab,
    user,
    operations,
    onEditTour,
    setSelectedTour,
    setDeleteConfirm,
    handleCreateChannel,
    handleUnlockTour,
    onOpenQuoteDialog,
    onOpenItineraryDialog,
    onOpenContractDialog,
    onConfirmTour,
    onUnlockLockedTour,
    onCloseTour,
    onOpenArchiveDialog,
    onOpenTourConfirmationDialog,
  } = params

  const renderActions = useCallback(
    (row: unknown) => {
      const tour = row as Tour
      const tourQuote = quotes.find(q => q.tour_id === tour.id)
      const hasQuote = !!tourQuote

      return (
        <div className="flex items-center gap-1">
          {/* 確認出團（僅提案狀態可見） */}
          {tour.status === '提案' && onConfirmTour && (
            <button
              onClick={e => {
                e.stopPropagation()
                onConfirmTour(tour)
              }}
              className="px-1.5 py-0.5 text-status-success hover:text-status-success hover:bg-status-success-bg rounded transition-colors flex items-center gap-0.5 text-xs"
              title="確認出團"
            >
              <CheckCircle2 size={14} />
              <span>確認</span>
            </button>
          )}

          {/* 進行中狀態的解鎖 */}
          {tour.status === '進行中' && (
            onUnlockLockedTour ? (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onUnlockLockedTour(tour)
                }}
                className="px-1.5 py-0.5 text-status-warning hover:text-status-warning hover:bg-status-warning-bg rounded transition-colors flex items-center gap-0.5 text-xs"
                title="解鎖回提案"
              >
                <LockOpen size={14} />
                <span>解鎖</span>
              </button>
            ) : (
              <span className="px-1.5 py-0.5 text-morandi-gold flex items-center gap-0.5 text-xs" title="行程已鎖定">
                <Lock size={14} />
                <span>鎖定</span>
              </span>
            )
          )}

          {/* 結案（僅進行中狀態可見） */}
          {tour.status === '進行中' && onCloseTour && (
            <button
              onClick={e => {
                e.stopPropagation()
                onCloseTour(tour)
              }}
              className="px-1.5 py-0.5 text-morandi-green hover:text-morandi-green hover:bg-status-success-bg rounded transition-colors flex items-center gap-0.5 text-xs"
              title="結案"
            >
              <FileCheck size={14} />
              <span>結案</span>
            </button>
          )}

          {/* 編輯 */}
          <button
            onClick={e => {
              e.stopPropagation()
              onEditTour(tour)
            }}
            className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="編輯"
          >
            <Edit2 size={14} />
            <span>編輯</span>
          </button>

          {/* 建立工作空間頻道 */}
          <button
            onClick={e => {
              e.stopPropagation()
              handleCreateChannel(tour)
            }}
            className="px-1.5 py-0.5 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="建立工作空間頻道"
          >
            <MessageSquare size={14} />
            <span>頻道</span>
          </button>

          {/* 報價單 */}
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
            className="px-1.5 py-0.5 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="報價單"
          >
            <Calculator size={14} />
            <span>報價</span>
          </button>

          {/* 行程表 */}
          <button
            onClick={e => {
              e.stopPropagation()
              setSelectedTour(tour)
              if (onOpenItineraryDialog) {
                onOpenItineraryDialog(tour)
              } else {
                router.push(`/itinerary?tour_id=${tour.id}`)
              }
            }}
            className="px-1.5 py-0.5 text-morandi-primary hover:text-morandi-primary/80 hover:bg-morandi-primary/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="行程表"
          >
            <FileText size={14} />
            <span>行程</span>
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
            className="px-1.5 py-0.5 text-morandi-gold/80 hover:text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="合約管理"
          >
            <FileSignature size={14} />
            <span>合約</span>
          </button>

          {/* 團確單 */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (onOpenTourConfirmationDialog) {
                onOpenTourConfirmationDialog(tour)
              }
            }}
            className="px-1.5 py-0.5 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="團確單管理"
          >
            <ClipboardList size={14} />
            <span>團確</span>
          </button>

          {/* 封存/解除封存 */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (tour.archived) {
                // 解除封存：直接執行
                operations.handleArchiveTour(tour)
              } else if (onOpenArchiveDialog) {
                // 封存：打開對話框選擇原因
                onOpenArchiveDialog(tour)
              } else {
                // 沒有對話框時直接封存（向後相容）
                operations.handleArchiveTour(tour)
              }
            }}
            className={cn(
              'px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5 text-xs',
              tour.archived
                ? 'text-morandi-gold/60 hover:text-morandi-gold hover:bg-morandi-gold/10'
                : 'text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-container'
            )}
            title={tour.archived ? '解除封存' : '封存'}
          >
            {tour.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            <span>{tour.archived ? '解封' : '封存'}</span>
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
                className="px-1.5 py-0.5 text-morandi-gold hover:text-morandi-gold/80 hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
                title="解鎖結團"
              >
                <LockOpen size={14} />
                <span>解鎖</span>
              </button>
            )}

          {/* 刪除 */}
          <button
            onClick={e => {
              e.stopPropagation()
              setDeleteConfirm({ isOpen: true, tour })
            }}
            className="px-1.5 py-0.5 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title="刪除"
          >
            <Trash2 size={14} />
            <span>刪除</span>
          </button>
        </div>
      )
    },
    [
      quotes,
      activeStatusTab,
      user,
      operations,
      onEditTour,
      router,
      setSelectedTour,
      setDeleteConfirm,
      handleCreateChannel,
      handleUnlockTour,
      onOpenQuoteDialog,
      onOpenItineraryDialog,
      onConfirmTour,
      onUnlockLockedTour,
      onCloseTour,
      onOpenArchiveDialog,
      onOpenTourConfirmationDialog,
    ]
  )

  return {
    renderActions,
  }
}
