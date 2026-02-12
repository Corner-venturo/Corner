'use client'

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useProposals } from '@/data'
import {
  createProposal,
  createPackage,
  updateProposal,
  archiveProposal,
  deleteProposal,
} from '@/services/proposal.service'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import type { Proposal, CreateProposalData, UpdateProposalData } from '@/types/proposal.types'
import type { CreateProposalWithPackageData } from '@/features/proposals/components/ProposalDialog'

interface UseProposalOperationsReturn {
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

  // Proposals data
  proposals: Proposal[]
  refreshProposals: () => Promise<void>

  // Handlers
  handleEditProposal: (proposal: Proposal) => void
  handleOpenArchiveDialog: (proposal: Proposal) => void
  handleDeleteProposal: (proposal: Proposal) => Promise<void>
  onCreateProposal: (data: CreateProposalData | UpdateProposalData) => Promise<void>
  onUpdateProposal: (data: CreateProposalData | UpdateProposalData) => Promise<void>
  onArchiveProposal: (reason: string) => Promise<void>
  handleProposalClick: (proposal: Proposal) => void

  /** 新建提案後自動開啟新增版本（建立後自動設為 true，開啟版本對話框後重設為 false） */
  autoOpenAddVersion: boolean
  setAutoOpenAddVersion: (value: boolean) => void
}

export function useProposalOperations(): UseProposalOperationsReturn {
  const { user } = useAuthStore()
  const { items: proposals, refresh: refreshProposals } = useProposals()

  // Dialog states
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [proposalEditDialogOpen, setProposalEditDialogOpen] = useState(false)
  const [proposalArchiveDialogOpen, setProposalArchiveDialogOpen] = useState(false)
  const [proposalDetailDialogOpen, setProposalDetailDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  // 新建提案後自動開啟新增版本
  const [autoOpenAddVersion, setAutoOpenAddVersion] = useState(false)

  // 編輯提案
  const handleEditProposal = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setProposalDetailDialogOpen(false)
    setProposalEditDialogOpen(true)
  }, [])

  // 開啟封存對話框
  const handleOpenArchiveDialog = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setProposalDetailDialogOpen(false)
    setProposalArchiveDialogOpen(true)
  }, [])

  // 刪除提案
  const handleDeleteProposal = useCallback(
    async (proposal: Proposal) => {
      // 查詢套件數量
      const { supabase } = await import('@/lib/supabase/client')
      const { data: packages } = await supabase
        .from('proposal_packages')
        .select('id')
        .eq('proposal_id', proposal.id)

      const packageCount = packages?.length || 0
      const packageInfo = packageCount > 0 ? `\n\n注意：此提案有 ${packageCount} 個版本，將一併刪除` : ''

      const confirmed = await confirm(`確定要刪除提案「${proposal.title}」嗎？${packageInfo}`, {
        type: 'warning',
        title: '刪除提案',
      })

      if (confirmed) {
        try {
          await deleteProposal(proposal)

          logger.log('[useProposalOperations] 刪除成功，重新整理列表...')
          refreshProposals()
          setProposalDetailDialogOpen(false)
          setSelectedProposal(null)
          await alert('提案已刪除', 'success')
        } catch (error) {
          logger.error('[useProposalOperations] 刪除提案失敗:', JSON.stringify(error, null, 2))
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
          await alert(`刪除提案失敗: ${errorMessage}`, 'error')
        }
      }
    },
    [refreshProposals]
  )

  // 新增提案（含第一個版本）
  const handleCreateProposal = useCallback(
    async (data: CreateProposalWithPackageData | UpdateProposalData) => {
      if (!user?.id) {
        await alert('無法取得使用者資訊', 'error')
        return
      }

      try {
        // 提取 firstPackage 資料
        const proposalWithPackage = data as CreateProposalWithPackageData
        const { firstPackage, ...proposalData } = proposalWithPackage

        logger.log('[useProposalOperations] 開始建立提案, proposalData:', JSON.stringify(proposalData))
        logger.log('[useProposalOperations] firstPackage:', JSON.stringify(firstPackage))

        // 1. 建立提案
        const newProposal = await createProposal(proposalData as CreateProposalData, user.id)
        logger.log('[useProposalOperations] 提案建立成功:', newProposal?.id)

        // 2. 如果有第一個版本資料，建立版本
        if (newProposal && firstPackage) {
          const packageData = {
            proposal_id: newProposal.id,
            version_name: firstPackage.version_name,
            destination: firstPackage.country ? `${firstPackage.country}${firstPackage.airport_code ? ` (${firstPackage.airport_code})` : ''}` : undefined,
            start_date: firstPackage.start_date || undefined,
            end_date: firstPackage.end_date || undefined,
            group_size: firstPackage.group_size || undefined,
            notes: firstPackage.notes || undefined,
          }
          logger.log('[useProposalOperations] 開始建立版本, packageData:', JSON.stringify(packageData))
          logger.log('[useProposalOperations] userId:', user.id, 'workspaceId:', user.workspace_id)
          await createPackage(packageData, user.id)
          logger.log('[useProposalOperations] 版本建立成功')
        }

        setProposalDialogOpen(false)
        // 刷新列表以顯示新提案
        await refreshProposals()
        // 自動展開新提案的詳情對話框（不再需要自動開新增版本）
        if (newProposal) {
          setSelectedProposal(newProposal)
          setProposalDetailDialogOpen(true)
        }
      } catch (error) {
        logger.error('[useProposalOperations] 建立提案失敗:', error)
        logger.error('[useProposalOperations] 錯誤詳情:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)))
        await alert(`建立提案失敗: ${error instanceof Error ? error.message : JSON.stringify(error)}`, 'error')
      }
    },
    [user?.id, refreshProposals]
  )

  // 更新提案
  const handleUpdateProposal = useCallback(
    async (data: CreateProposalData | UpdateProposalData) => {
      if (!selectedProposal || !user?.id) {
        await alert('無法取得資訊', 'error')
        return
      }

      try {
        await updateProposal(selectedProposal.id, data, user.id)
        refreshProposals()
        setProposalEditDialogOpen(false)
        setSelectedProposal(null)
      } catch {
        await alert('更新提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  // 封存提案
  const handleArchiveProposal = useCallback(
    async (reason: string) => {
      if (!selectedProposal || !user?.id) return

      try {
        await archiveProposal(selectedProposal.id, reason, user.id)
        refreshProposals()
        setProposalArchiveDialogOpen(false)
        setSelectedProposal(null)
      } catch {
        await alert('封存提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  // 點擊提案顯示詳情
  const handleProposalClick = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setProposalDetailDialogOpen(true)
  }, [])

  return {
    // Dialog states
    proposalDialogOpen,
    setProposalDialogOpen,
    proposalEditDialogOpen,
    setProposalEditDialogOpen,
    proposalArchiveDialogOpen,
    setProposalArchiveDialogOpen,
    proposalDetailDialogOpen,
    setProposalDetailDialogOpen,

    // Selected proposal
    selectedProposal,
    setSelectedProposal,

    // Proposals data
    proposals,
    refreshProposals,

    // Handlers
    handleEditProposal,
    handleOpenArchiveDialog,
    handleDeleteProposal,
    onCreateProposal: handleCreateProposal,
    onUpdateProposal: handleUpdateProposal,
    onArchiveProposal: handleArchiveProposal,
    handleProposalClick,

    // 新建提案後自動開啟新增版本
    autoOpenAddVersion,
    setAutoOpenAddVersion,
  }
}
