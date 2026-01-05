'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Edit2,
  Trash2,
  Archive,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useProposals, useProposalPackages, useCustomers } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell, NumberCell, TextCell } from '@/components/table-cells'
import { ProposalDialog } from './ProposalDialog'
import { PackageListPanel } from './PackageListPanel'
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
  const { items: customers } = useCustomers()

  // 展開狀態
  const [expandedProposals, setExpandedProposals] = useState<string[]>([])

  // 對話框狀態
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

  // 取得客戶名稱
  const getCustomerName = useCallback(
    (customerId: string | null | undefined): string => {
      if (!customerId) return ''
      const customer = customers.find(c => c.id === customerId)
      return customer?.name || ''
    },
    [customers]
  )

  // 切換展開/收合
  const toggleExpand = useCallback((proposalId: string) => {
    setExpandedProposals(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
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
      if (packages.length > 0) {
        await alert(
          `此提案有 ${packages.length} 個套件，請先刪除所有套件後再刪除提案`,
          'warning'
        )
        return
      }

      const confirmed = await confirm(`確定要刪除提案「${proposal.title}」嗎？`, {
        type: 'warning',
        title: '刪除提案',
      })

      if (confirmed) {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { error } = await supabase.from('proposals' as 'notes').delete().eq('id', proposal.id)
          if (error) throw error
          refreshProposals()
        } catch (error) {
          await alert('刪除提案失敗', 'error')
        }
      }
    },
    [getProposalPackages, refreshProposals]
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

  // 表格欄位定義
  const columns: TableColumn<Proposal>[] = useMemo(
    () => [
      {
        key: 'expand',
        label: '',
        width: '40px',
        render: (_, proposal) => {
          const isExpanded = expandedProposals.includes(proposal.id)
          const packageCount = getProposalPackages(proposal.id).length
          return (
            <button
              onClick={e => {
                e.stopPropagation()
                toggleExpand(proposal.id)
              }}
              className="p-1 hover:bg-morandi-container/50 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-morandi-secondary" />
              ) : (
                <ChevronRight
                  size={16}
                  className={
                    packageCount === 0 ? 'text-morandi-muted' : 'text-morandi-secondary'
                  }
                />
              )}
            </button>
          )
        },
      },
      {
        key: 'code',
        label: '提案編號',
        sortable: true,
        width: '120px',
        render: (_, proposal) => (
          <span className="font-mono text-sm text-morandi-gold">{proposal.code}</span>
        ),
      },
      {
        key: 'title',
        label: '提案名稱',
        sortable: true,
        render: (_, proposal) => (
          <div>
            <div className="font-medium text-morandi-primary">{proposal.title}</div>
            {proposal.destination && (
              <div className="text-sm text-morandi-secondary">{proposal.destination}</div>
            )}
          </div>
        ),
      },
      {
        key: 'customer_name',
        label: '客戶',
        sortable: true,
        width: '150px',
        render: (_, proposal) => (
          <TextCell
            text={
              proposal.customer_name ||
              getCustomerName(proposal.customer_id) ||
              '-'
            }
          />
        ),
      },
      {
        key: 'package_count',
        label: '套件數',
        width: '80px',
        render: (_, proposal) => {
          const count = getProposalPackages(proposal.id).length
          return <NumberCell value={count} suffix="個" />
        },
      },
      {
        key: 'expected_start_date',
        label: '預計日期',
        sortable: true,
        width: '120px',
        render: (_, proposal) => (
          <DateCell date={proposal.expected_start_date} showIcon={false} />
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        width: '100px',
        render: (_, proposal) => (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${STATUS_COLORS[proposal.status]}`}
          >
            {STATUS_LABELS[proposal.status]}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: '建立日期',
        sortable: true,
        width: '120px',
        render: (_, proposal) => <DateCell date={proposal.created_at} showIcon={false} />,
      },
    ],
    [expandedProposals, getProposalPackages, getCustomerName, toggleExpand]
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

      // 只有草稿可以刪除
      if (proposal.status === 'draft') {
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

  // 渲染展開內容（套件列表）
  const renderExpanded = useCallback(
    (proposal: Proposal) => {
      return (
        <PackageListPanel
          proposal={proposal}
          packages={getProposalPackages(proposal.id)}
          onPackagesChange={() => refreshPackages()}
        />
      )
    },
    [getProposalPackages, refreshPackages]
  )

  return (
    <>
      <EnhancedTable
        data={filteredProposals}
        columns={columns}
        onRowClick={proposal => toggleExpand(proposal.id)}
        actions={(proposal) => renderActions(proposal)}
        expandable={{
          expanded: expandedProposals,
          onExpand: toggleExpand,
          renderExpanded,
        }}
        bordered
        emptyMessage="尚無提案資料"
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
