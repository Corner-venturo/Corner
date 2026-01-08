/**
 * ProposalDetailDialog - 提案詳細資訊對話框
 * 用於在旅遊團頁面顯示提案詳情
 */

'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProposalPackages } from '@/hooks/cloud-hooks'
import { PackageListPanel } from './PackageListPanel'
import type { Proposal, ProposalStatus } from '@/types/proposal.types'

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
  onPackagesChange?: () => void
}

export function ProposalDetailDialog({
  open,
  onOpenChange,
  proposal,
  onPackagesChange,
}: ProposalDetailDialogProps) {
  const { items: allPackages, fetchAll: refreshPackages } = useProposalPackages()
  const [showAddDialog, setShowAddDialog] = useState(false)
  // 追蹤子 Dialog 是否開啟（用於單一遮罩模式）
  const [childDialogOpen, setChildDialogOpen] = useState(false)

  // 取得此提案的套件
  const packages = useMemo(() => {
    if (!proposal) return []
    return allPackages.filter(p => p.proposal_id === proposal.id)
  }, [allPackages, proposal])

  if (!proposal) return null

  const canAddVersion = proposal.status !== 'converted' && proposal.status !== 'archived'

  const handlePackagesChange = () => {
    refreshPackages()
    onPackagesChange?.()
  }

  return (
    <Dialog
      open={open && !childDialogOpen}
      onOpenChange={(v) => !childDialogOpen && onOpenChange(v)}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <VisuallyHidden>
          <DialogTitle>提案詳情 - {proposal.code}</DialogTitle>
        </VisuallyHidden>
        {/* 標題區 - pr-8 為關閉按鈕留空間 */}
        <div className="flex items-center justify-between pr-8 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-morandi-gold font-mono text-lg">{proposal.code}</span>
            <span className="text-morandi-primary font-medium">{proposal.title || '(未命名)'}</span>
            <span
              className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[proposal.status]}`}
            >
              {STATUS_LABELS[proposal.status]}
            </span>
          </div>
          {canAddVersion && (
            <Button
              size="sm"
              className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus size={14} />
              新增版本
            </Button>
          )}
        </div>

        {/* 套件列表 */}
        <div className="flex-1 overflow-auto">
          <PackageListPanel
            proposal={proposal}
            packages={packages}
            onPackagesChange={handlePackagesChange}
            showAddDialog={showAddDialog}
            onShowAddDialogChange={setShowAddDialog}
            onChildDialogChange={setChildDialogOpen}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
