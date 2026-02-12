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
  Calculator,
  FileCheck,
  ClipboardList,
  Palette,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tour, Quote, User } from '@/stores/types'
import type { Proposal } from '@/types/proposal.types'
import { TOUR_ACTIONS } from '../constants'

// 擴展 Tour 類型，增加提案標記
type TourOrProposal = Tour & {
  __isProposal?: boolean
  __originalProposal?: Proposal
}

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
  // 新增：打開報價單（含行程表）/合約連結對話框
  onOpenQuoteDialog?: (tour: Tour) => void
  onOpenItineraryDialog?: (tour: Tour) => void
  onOpenContractDialog?: (tour: Tour) => void
  // 結案
  onCloseTour?: (tour: Tour) => void
  // 封存對話框
  onOpenArchiveDialog?: (tour: Tour) => void
  // 需求總覽對話框
  onOpenRequirementsDialog?: (tour: Tour) => void
  // 提案點擊處理（查看版本）
  onProposalClick?: (proposal: Proposal) => void
  // 提案操作
  onProposalEdit?: (proposal: Proposal) => void
  onProposalArchive?: (proposal: Proposal) => void
  onProposalDelete?: (proposal: Proposal) => void
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
    onOpenQuoteDialog,
    // onOpenItineraryDialog 已棄用 - 設計按鈕現在直接跳轉到 /brochure
    onOpenContractDialog,
    onCloseTour,
    onOpenArchiveDialog,
    onOpenRequirementsDialog,
    onProposalClick,
    onProposalEdit,
    onProposalArchive,
    onProposalDelete,
  } = params

  const renderActions = useCallback(
    (row: unknown) => {
      const item = row as TourOrProposal

      // 如果是提案，顯示提案專用操作
      if (item.__isProposal && item.__originalProposal) {
        const proposal = item.__originalProposal
        const canEdit = proposal.status !== 'converted' && proposal.status !== 'archived'
        const canDelete = proposal.status === 'draft' || proposal.status === 'negotiating'

        return (
          <div className="flex items-center gap-1">
            {/* 查看版本 */}
            <button
              onClick={e => {
                e.stopPropagation()
                onProposalClick?.(proposal)
              }}
              className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
              title={TOUR_ACTIONS.view_versions}
            >
              <ClipboardList size={14} />
              <span>{TOUR_ACTIONS.versions}</span>
            </button>

            {/* 編輯 */}
            {canEdit && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onProposalEdit?.(proposal)
                }}
                className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
                title={TOUR_ACTIONS.edit}
              >
                <Edit2 size={14} />
                <span>{TOUR_ACTIONS.edit}</span>
              </button>
            )}

            {/* 封存 */}
            {canEdit && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onProposalArchive?.(proposal)
                }}
                className="px-1.5 py-0.5 text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-secondary/10 rounded transition-colors flex items-center gap-0.5 text-xs"
                title={TOUR_ACTIONS.archive}
              >
                <Archive size={14} />
                <span>{TOUR_ACTIONS.archive}</span>
              </button>
            )}

            {/* 刪除 */}
            {canDelete && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onProposalDelete?.(proposal)
                }}
                className="px-1.5 py-0.5 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors flex items-center gap-0.5 text-xs"
                title={TOUR_ACTIONS.delete}
              >
                <Trash2 size={14} />
                <span>{TOUR_ACTIONS.delete}</span>
              </button>
            )}
          </div>
        )
      }

      // 旅遊團操作
      const tour = item as Tour
      const tourQuote = quotes.find(q => q.tour_id === tour.id)
      const hasQuote = !!tourQuote

      return (
        <div className="flex items-center gap-1">
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
            className="px-1.5 py-0.5 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-secondary/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.create_channel}
          >
            <MessageSquare size={14} />
            <span>{TOUR_ACTIONS.channel}</span>
          </button>

          {/* 報價與行程（整合） */}
          <button
            onClick={e => {
              e.stopPropagation()
              setSelectedTour(tour)
              if (onOpenQuoteDialog) {
                onOpenQuoteDialog(tour)
              } else if (hasQuote) {
                // 根據報價單類型跳轉到對應路由
                if (tourQuote.quote_type === 'quick') {
                  router.push(`/quotes/quick/${tourQuote.id}`)
                } else {
                  router.push(`/quotes/${tourQuote.id}`)
                }
              } else {
                router.push(`/quotes?tour_id=${tour.id}`)
              }
            }}
            className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.quote_management}
          >
            <Calculator size={14} />
            <span>{TOUR_ACTIONS.quote_itinerary}</span>
          </button>

          {/* 設計 */}
          <button
            onClick={e => {
              e.stopPropagation()
              // 直接跳轉到設計頁面，不需要中間的 Dialog
              router.push(`/brochure?tour_id=${tour.id}`)
            }}
            className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.design_title}
          >
            <Palette size={14} />
            <span>{TOUR_ACTIONS.design}</span>
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
            className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.contract_title}
          >
            <FileSignature size={14} />
            <span>{TOUR_ACTIONS.contract}</span>
          </button>

          {/* 需求總覽 */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (onOpenRequirementsDialog) {
                onOpenRequirementsDialog(tour)
              }
            }}
            className="px-1.5 py-0.5 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.requirements_title}
          >
            <ListChecks size={14} />
            <span>{TOUR_ACTIONS.requirements}</span>
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
                : 'text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-secondary/10'
            )}
            title={tour.archived ? TOUR_ACTIONS.unarchive : TOUR_ACTIONS.archive}
          >
            {tour.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            <span>{tour.archived ? TOUR_ACTIONS.unarchive_short : TOUR_ACTIONS.archive}</span>
          </button>

          {/* 結案（僅進行中狀態可見） */}
          {tour.status === '進行中' && onCloseTour && (
            <button
              onClick={e => {
                e.stopPropagation()
                onCloseTour(tour)
              }}
              className="px-1.5 py-0.5 text-morandi-green hover:bg-morandi-green/10 rounded transition-colors flex items-center gap-0.5 text-xs"
              title={TOUR_ACTIONS.close_tour}
            >
              <FileCheck size={14} />
              <span>{TOUR_ACTIONS.close_tour}</span>
            </button>
          )}

          {/* 刪除 */}
          <button
            onClick={e => {
              e.stopPropagation()
              setDeleteConfirm({ isOpen: true, tour })
            }}
            className="px-1.5 py-0.5 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors flex items-center gap-0.5 text-xs"
            title={TOUR_ACTIONS.delete}
          >
            <Trash2 size={14} />
            <span>{TOUR_ACTIONS.delete}</span>
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
      onOpenQuoteDialog,
      onCloseTour,
      onOpenArchiveDialog,
      onOpenRequirementsDialog,
      onProposalClick,
      onProposalEdit,
      onProposalArchive,
      onProposalDelete,
    ]
  )

  return {
    renderActions,
  }
}
