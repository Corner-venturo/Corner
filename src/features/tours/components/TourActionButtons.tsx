'use client'
/**
 * TourActionButtons - Simplified action menu (⋮) for tour operations
 * Only contains: Archive, Delete
 */

import { useCallback } from 'react'
import { MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Tour, User } from '@/stores/types'
import type { Proposal } from '@/types/proposal.types'
import { TOUR_ACTIONS } from '../constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 擴展 Tour 類型，增加提案標記
type TourOrProposal = Tour & {
  __isProposal?: boolean
  __originalProposal?: Proposal
}

interface UseTourActionButtonsParams {
  quotes: unknown[]
  activeStatusTab: string
  user: User | null
  operations: {
    handleArchiveTour: (tour: Tour, reason?: string) => Promise<void>
  }
  onEditTour: (tour: Tour) => void
  setSelectedTour: (tour: Tour) => void
  setDeleteConfirm: (state: { isOpen: boolean; tour: Tour | null }) => void
  handleCreateChannel: (tour: Tour) => Promise<void>
  onOpenQuoteDialog?: (tour: Tour) => void
  onOpenItineraryDialog?: (tour: Tour) => void
  onOpenContractDialog?: (tour: Tour) => void
  onCloseTour?: (tour: Tour) => void
  onOpenArchiveDialog?: (tour: Tour) => void
  onOpenRequirementsDialog?: ((tour: Tour) => void) | undefined
  onProposalClick?: (proposal: Proposal) => void
  onProposalEdit?: (proposal: Proposal) => void
  onProposalArchive?: (proposal: Proposal) => void
  onProposalDelete?: (proposal: Proposal) => void
}

export function useTourActionButtons(params: UseTourActionButtonsParams) {
  const {
    operations,
    setDeleteConfirm,
    onOpenArchiveDialog,
    onProposalArchive,
    onProposalDelete,
  } = params

  const renderActions = useCallback(
    (row: unknown) => {
      const item = row as TourOrProposal

      // 提案：只顯示封存和刪除
      if (item.__isProposal && item.__originalProposal) {
        const proposal = item.__originalProposal
        const canEdit = proposal.status !== 'converted' && proposal.status !== 'archived'
        const canDelete = proposal.status === 'draft' || proposal.status === 'negotiating'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-morandi-container/50 transition-colors"
              >
                <MoreVertical size={16} className="text-morandi-secondary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <DropdownMenuItem onClick={() => onProposalArchive?.(proposal)}>
                  <Archive size={14} className="mr-2" />
                  {TOUR_ACTIONS.archive}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onProposalDelete?.(proposal)}
                  className="text-morandi-red focus:text-morandi-red"
                >
                  <Trash2 size={14} className="mr-2" />
                  {TOUR_ACTIONS.delete}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }

      // 旅遊團：封存/解封 + 刪除
      const tour = item as Tour

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-morandi-container/50 transition-colors"
            >
              <MoreVertical size={16} className="text-morandi-secondary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() => {
                if (tour.archived) {
                  operations.handleArchiveTour(tour)
                } else if (onOpenArchiveDialog) {
                  onOpenArchiveDialog(tour)
                } else {
                  operations.handleArchiveTour(tour)
                }
              }}
            >
              {tour.archived ? (
                <>
                  <ArchiveRestore size={14} className="mr-2" />
                  {TOUR_ACTIONS.unarchive}
                </>
              ) : (
                <>
                  <Archive size={14} className="mr-2" />
                  {TOUR_ACTIONS.archive}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteConfirm({ isOpen: true, tour })}
              className="text-morandi-red focus:text-morandi-red"
            >
              <Trash2 size={14} className="mr-2" />
              {TOUR_ACTIONS.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    [operations, setDeleteConfirm, onOpenArchiveDialog, onProposalArchive, onProposalDelete]
  )

  return {
    renderActions,
  }
}
