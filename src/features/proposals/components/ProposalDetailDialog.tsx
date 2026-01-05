/**
 * ProposalDetailDialog - 提案詳細資訊對話框
 * 用於在旅遊團頁面顯示提案詳情
 */

'use client'

import React, { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit2, Archive, X } from 'lucide-react'
import { useProposalPackages } from '@/hooks/cloud-hooks'
import { PackageListPanel } from './PackageListPanel'
import type { Proposal, ProposalPackage, ProposalStatus } from '@/types/proposal.types'

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

interface ProposalDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: Proposal | null
  onEdit?: (proposal: Proposal) => void
  onArchive?: (proposal: Proposal) => void
  onPackagesChange?: () => void
}

export function ProposalDetailDialog({
  open,
  onOpenChange,
  proposal,
  onEdit,
  onArchive,
  onPackagesChange,
}: ProposalDetailDialogProps) {
  const { items: allPackages, fetchAll: refreshPackages } = useProposalPackages()

  // 取得此提案的套件
  const packages = useMemo(() => {
    if (!proposal) return []
    return allPackages.filter(p => p.proposal_id === proposal.id)
  }, [allPackages, proposal])

  if (!proposal) return null

  const canEdit = proposal.status !== 'converted' && proposal.status !== 'archived'

  const handlePackagesChange = () => {
    refreshPackages()
    onPackagesChange?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-morandi-gold font-mono">{proposal.code}</span>
              <span className="text-morandi-primary">{proposal.title}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[proposal.status]}`}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => onEdit(proposal)}
                  >
                    <Edit2 size={14} />
                    編輯
                  </Button>
                )}
                {onArchive && proposal.status !== 'archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-morandi-red border-morandi-red hover:bg-morandi-red/10"
                    onClick={() => onArchive(proposal)}
                  >
                    <Archive size={14} />
                    封存
                  </Button>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* 基本資訊 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-morandi-container/20 rounded-lg">
          {proposal.customer_name && (
            <div>
              <div className="text-xs text-morandi-secondary">客戶</div>
              <div className="text-sm text-morandi-primary">{proposal.customer_name}</div>
            </div>
          )}
          {proposal.destination && (
            <div>
              <div className="text-xs text-morandi-secondary">目的地</div>
              <div className="text-sm text-morandi-primary">{proposal.destination}</div>
            </div>
          )}
          {proposal.expected_start_date && (
            <div>
              <div className="text-xs text-morandi-secondary">預計日期</div>
              <div className="text-sm text-morandi-primary">
                {proposal.expected_start_date}
                {proposal.expected_end_date && ` ~ ${proposal.expected_end_date}`}
              </div>
            </div>
          )}
          {proposal.group_size && (
            <div>
              <div className="text-xs text-morandi-secondary">預計人數</div>
              <div className="text-sm text-morandi-primary">{proposal.group_size} 人</div>
            </div>
          )}
        </div>

        {/* 套件列表 */}
        <div className="flex-1 overflow-auto mt-4">
          <PackageListPanel
            proposal={proposal}
            packages={packages}
            onPackagesChange={handlePackagesChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
