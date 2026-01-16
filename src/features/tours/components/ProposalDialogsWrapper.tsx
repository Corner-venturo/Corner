'use client'

import React from 'react'
import { ProposalDialog } from '@/features/proposals/components/ProposalDialog'
import { ProposalDetailDialog } from '@/features/proposals/components/ProposalDetailDialog'
import { ArchiveProposalDialog } from '@/features/proposals/components/ArchiveProposalDialog'
import type { Proposal, CreateProposalData, UpdateProposalData } from '@/types/proposal.types'

interface ProposalDialogsWrapperProps {
  // Dialog states
  proposalDialogOpen: boolean
  setProposalDialogOpen: (open: boolean) => void
  proposalEditDialogOpen: boolean
  setProposalEditDialogOpen: (open: boolean) => void
  proposalArchiveDialogOpen: boolean
  setProposalArchiveDialogOpen: (open: boolean) => void
  proposalDetailDialogOpen: boolean
  setProposalDetailDialogOpen: (open: boolean) => void

  // Selected proposal
  selectedProposal: Proposal | null
  setSelectedProposal: (proposal: Proposal | null) => void

  // Handlers
  onCreateProposal: (data: CreateProposalData | UpdateProposalData) => Promise<void>
  onUpdateProposal: (data: CreateProposalData | UpdateProposalData) => Promise<void>
  onArchiveProposal: (reason: string) => Promise<void>
  onRefreshProposals: () => Promise<Proposal[] | undefined> | void
}

export function ProposalDialogsWrapper({
  proposalDialogOpen,
  setProposalDialogOpen,
  proposalEditDialogOpen,
  setProposalEditDialogOpen,
  proposalArchiveDialogOpen,
  setProposalArchiveDialogOpen,
  proposalDetailDialogOpen,
  setProposalDetailDialogOpen,
  selectedProposal,
  setSelectedProposal,
  onCreateProposal,
  onUpdateProposal,
  onArchiveProposal,
  onRefreshProposals,
}: ProposalDialogsWrapperProps) {
  return (
    <>
      {/* 新增提案對話框 */}
      <ProposalDialog
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        mode="create"
        onSubmit={onCreateProposal}
      />

      {/* 提案詳細對話框 */}
      <ProposalDetailDialog
        open={proposalDetailDialogOpen}
        onOpenChange={(open) => {
          setProposalDetailDialogOpen(open)
          // 關閉時清除選擇，但不改變 tab 狀態
          if (!open) {
            setSelectedProposal(null)
          }
        }}
        proposal={selectedProposal}
        onPackagesChange={onRefreshProposals}
      />

      {/* 編輯提案對話框 */}
      <ProposalDialog
        open={proposalEditDialogOpen}
        onOpenChange={(open) => {
          setProposalEditDialogOpen(open)
          if (!open) setSelectedProposal(null)
        }}
        mode="edit"
        proposal={selectedProposal}
        onSubmit={onUpdateProposal}
      />

      {/* 封存提案對話框 */}
      <ArchiveProposalDialog
        open={proposalArchiveDialogOpen}
        onOpenChange={(open) => {
          setProposalArchiveDialogOpen(open)
          if (!open) setSelectedProposal(null)
        }}
        proposal={selectedProposal}
        onConfirm={onArchiveProposal}
      />
    </>
  )
}
