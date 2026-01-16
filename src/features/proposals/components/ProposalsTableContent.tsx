'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Edit2,
  Trash2,
  Archive,
} from 'lucide-react'
import { useProposals, useProposalPackages } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import { ProposalDialog } from './ProposalDialog'
import { ProposalDetailDialog } from './ProposalDetailDialog'
import { ArchiveProposalDialog } from './ArchiveProposalDialog'
import { updateProposal, archiveProposal } from '@/services/proposal.service'
import type {
  Proposal,
  ProposalPackage,
  ProposalStatus,
  CreateProposalData,
  UpdateProposalData,
} from '@/types/proposal.types'

// 狀態配色
const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'text-morandi-secondary bg-morandi-container',
  negotiating: 'text-status-info bg-status-info-bg',
  converted: 'text-morandi-green bg-morandi-green/10',
  archived: 'text-morandi-muted bg-morandi-muted/10',
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: '草稿',
  negotiating: '洽談中',
  converted: '已轉團',
  archived: '已封存',
}

interface ProposalsTableContentProps {
  searchQuery?: string
}

export function ProposalsTableContent({ searchQuery = '' }: ProposalsTableContentProps) {
  const { user } = useAuthStore()
  const {
    items: proposals,
    fetchAll: refreshProposals,
  } = useProposals()
  const { items: allPackages, fetchAll: refreshPackages } = useProposalPackages()

  // 對話框狀態
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  // 篩選提案（只顯示未轉團的）
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // 排除已轉團的
      if (p.status === 'converted') return false
      // 搜尋過濾
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.code?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.customer_name?.toLowerCase().includes(q) ||
          p.destination?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [proposals, searchQuery])

  // 取得提案的套件
  const getProposalPackages = useCallback(
    (proposalId: string): ProposalPackage[] => {
      return allPackages.filter(p => p.proposal_id === proposalId)
    },
    [allPackages]
  )

  // 開啟詳情對話框
  const openDetailDialog = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setDetailDialogOpen(true)
  }, [])

  // 處理更新提案
  const handleUpdateProposal = useCallback(
    async (data: CreateProposalData | UpdateProposalData) => {
      if (!selectedProposal || !user?.id) {
        await alert('無法取得資訊', 'error')
        return
      }

      try {
        await updateProposal(selectedProposal.id, data, user.id)
        refreshProposals()
        setEditDialogOpen(false)
        setSelectedProposal(null)
      } catch (error) {
        await alert('更新提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  // 處理刪除提案
  const handleDeleteProposal = useCallback(
    async (proposal: Proposal) => {
      const packages = getProposalPackages(proposal.id)
      const packageInfo = packages.length > 0 ? `\n\n注意：此提案有 ${packages.length} 個套件，將一併刪除` : ''

      const confirmed = await confirm(`確定要刪除提案「${proposal.title}」嗎？${packageInfo}`, {
        type: 'warning',
        title: '刪除提案',
      })

      if (confirmed) {
        try {
          const { supabase } = await import('@/lib/supabase/client')

          // 先刪除相關套件
          if (packages.length > 0) {
            const { error: pkgError } = await supabase
              .from('proposal_packages')
              .delete()
              .eq('proposal_id', proposal.id)
            if (pkgError) throw pkgError
          }

          // 再刪除提案
          const { error } = await supabase.from('proposals').delete().eq('id', proposal.id)
          if (error) throw error

          refreshProposals()
          refreshPackages()
        } catch (error) {
          await alert('刪除提案失敗', 'error')
        }
      }
    },
    [getProposalPackages, refreshProposals, refreshPackages]
  )

  // 處理封存提案
  const handleArchiveProposal = useCallback(
    async (reason: string) => {
      if (!selectedProposal || !user?.id) return

      try {
        await archiveProposal(selectedProposal.id, reason, user.id)
        refreshProposals()
        setArchiveDialogOpen(false)
        setSelectedProposal(null)
      } catch (error) {
        await alert('封存提案失敗', 'error')
      }
    },
    [selectedProposal, user?.id, refreshProposals]
  )

  // 開啟編輯對話框
  const openEditDialog = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setEditDialogOpen(true)
  }, [])

  // 開啟封存對話框
  const openArchiveDialog = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal)
    setArchiveDialogOpen(true)
  }, [])

  // 表格欄位定義（與旅遊團一致）
  const columns: TableColumn<Proposal>[] = useMemo(
    () => [
      {
        key: 'code',
        label: '團號',
        sortable: true,
        width: '110px',
        render: (_, proposal) => (
          <span className="text-sm text-morandi-primary">{proposal.code || ''}</span>
        ),
      },
      {
        key: 'title',
        label: '旅遊團名稱',
        sortable: true,
        width: '180px',
        render: (_, proposal) => (
          <span className="text-sm text-morandi-primary">{proposal.title || ''}</span>
        ),
      },
      {
        key: 'expected_start_date',
        label: '出發日期',
        sortable: true,
        width: '100px',
        render: (_, proposal) => (
          <DateCell date={proposal.expected_start_date} showIcon={false} />
        ),
      },
      {
        key: 'destination',
        label: '目的地',
        sortable: true,
        width: '80px',
        render: (_, proposal) => (
          <span className="text-sm text-morandi-secondary">{proposal.destination || '-'}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        width: '80px',
        render: (_, proposal) => (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${STATUS_COLORS[proposal.status]}`}
          >
            {STATUS_LABELS[proposal.status]}
          </span>
        ),
      },
    ],
    []
  )

  // 渲染操作按鈕
  const renderActions = useCallback(
    (proposal: Proposal) => {
      const actions: Array<{
        icon: typeof Edit2
        label: string
        onClick: () => void
        variant?: 'default' | 'danger' | 'success' | 'warning'
      }> = [
        {
          icon: Edit2,
          label: '編輯',
          onClick: () => openEditDialog(proposal),
        },
      ]

      // 只有非已轉團和非已封存的提案可以封存
      if (proposal.status !== 'converted' && proposal.status !== 'archived') {
        actions.push({
          icon: Archive,
          label: '封存',
          onClick: () => openArchiveDialog(proposal),
        })
      }

      // 草稿和洽談中都可以刪除（已轉團和已封存不行）
      if (proposal.status === 'draft' || proposal.status === 'negotiating') {
        actions.push({
          icon: Trash2,
          label: '刪除',
          onClick: () => handleDeleteProposal(proposal),
          variant: 'danger',
        })
      }

      return <ActionCell actions={actions} />
    },
    [openEditDialog, openArchiveDialog, handleDeleteProposal]
  )

  return (
    <>
      <EnhancedTable
        data={filteredProposals}
        columns={columns}
        onRowClick={proposal => openDetailDialog(proposal)}
        actions={(proposal) => renderActions(proposal)}
        actionsWidth="50%"
        bordered
        emptyMessage="尚無提案資料"
      />

      {/* 提案詳細對話框 */}
      <ProposalDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open)
          if (!open) setSelectedProposal(null)
        }}
        proposal={selectedProposal}
        onPackagesChange={() => refreshPackages()}
      />

      {/* 編輯提案對話框 */}
      <ProposalDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode="edit"
        proposal={selectedProposal}
        onSubmit={handleUpdateProposal}
      />

      {/* 封存對話框 */}
      <ArchiveProposalDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        proposal={selectedProposal}
        onConfirm={handleArchiveProposal}
      />
    </>
  )
}
