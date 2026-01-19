'use client'

import React from 'react'
import { ProposalDialog, type CreateProposalWithPackageData } from '@/features/proposals/components/ProposalDialog'
import { ProposalDetailDialog } from '@/features/proposals/components/ProposalDetailDialog'
import { ArchiveProposalDialog } from '@/features/proposals/components/ArchiveProposalDialog'
import type { Proposal, UpdateProposalData } from '@/types/proposal.types'

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
  onCreateProposal: (data: CreateProposalWithPackageData | UpdateProposalData) => Promise<void>
  onUpdateProposal: (data: CreateProposalWithPackageData | UpdateProposalData) => Promise<void>
  onArchiveProposal: (reason: string) => Promise<void>
  onRefreshProposals: () => Promise<Proposal[] | undefined> | void

  /** 新建提案後自動開啟新增版本對話框 */
  autoOpenAddVersion?: boolean
  setAutoOpenAddVersion?: (value: boolean) => void
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
  autoOpenAddVersion = false,
  setAutoOpenAddVersion,
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
          // 關閉時清除選擇和自動開版本標記
          if (!open) {
            setSelectedProposal(null)
            setAutoOpenAddVersion?.(false)
          }
        }}
        proposal={selectedProposal}
        onPackagesChange={onRefreshProposals}
        autoOpenAddVersion={autoOpenAddVersion}
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
