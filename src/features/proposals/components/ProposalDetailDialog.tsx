/**
 * ProposalDetailDialog - 提案詳細資訊對話框
 * 用於在旅遊團頁面顯示提案詳情
 */

'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProposalPackages } from '@/hooks/cloudHooks'
import { PackageListPanel } from './PackageListPanel'
import { PackageItineraryDialog } from './PackageItineraryDialog'
import type { Proposal, ProposalStatus, ProposalPackage } from '@/types/proposal.types'

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
  /** 開啟時自動顯示新增版本對話框（新建提案後直接開版本） */
  autoOpenAddVersion?: boolean
}

export function ProposalDetailDialog({
  open,
  onOpenChange,
  proposal,
  onPackagesChange,
  autoOpenAddVersion = false,
}: ProposalDetailDialogProps) {
  const { items: allPackages, fetchAll: refreshPackages } = useProposalPackages()
  const [showAddDialog, setShowAddDialog] = useState(false)

  // 當 autoOpenAddVersion 變為 true 時，開啟新增版本對話框
  useEffect(() => {
    if (autoOpenAddVersion && open) {
      setShowAddDialog(true)
    }
  }, [autoOpenAddVersion, open])

  // 行程表對話框狀態（用於單一遮罩模式）
  const [itineraryDialogOpen, setItineraryDialogOpen] = useState(false)
  const [itineraryPackage, setItineraryPackage] = useState<ProposalPackage | null>(null)

  // 追蹤 PackageListPanel 內的子 Dialog 狀態
  const [packageListChildDialogOpen, setPackageListChildDialogOpen] = useState(false)

  // 取得此提案的套件
  const packages = useMemo(() => {
    if (!proposal) return []
    return allPackages.filter(p => p.proposal_id === proposal.id)
  }, [allPackages, proposal])

  const canAddVersion = proposal ? proposal.status !== 'converted' && proposal.status !== 'archived' : false

  const handlePackagesChange = useCallback(() => {
    refreshPackages()
    onPackagesChange?.()
  }, [refreshPackages, onPackagesChange])

  // 開啟行程表對話框（由 PackageListPanel 呼叫）
  const handleOpenItineraryDialog = useCallback((pkg: ProposalPackage) => {
    setItineraryPackage(pkg)
    setItineraryDialogOpen(true)
  }, [])

  // 關閉行程表對話框
  const handleCloseItineraryDialog = useCallback(() => {
    setItineraryDialogOpen(false)
    setItineraryPackage(null)
  }, [])

  if (!proposal) return null

  // 注意：已移除 hasChildDialogOpen 模式，改用 Dialog level 系統處理多重遮罩

  return (
    <>
      {/* 主對話框：使用 level={1} */}
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent level={1} className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
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
                onChildDialogChange={setPackageListChildDialogOpen}
                onOpenItineraryDialog={handleOpenItineraryDialog}
                onNavigateAway={() => onOpenChange(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

      {/* 行程表對話框（level={2}） */}
      {itineraryPackage && (
        <PackageItineraryDialog
          isOpen={itineraryDialogOpen}
          onClose={handleCloseItineraryDialog}
          pkg={itineraryPackage}
          proposal={proposal}
          onItineraryCreated={handlePackagesChange}
        />
      )}
    </>
  )
}
