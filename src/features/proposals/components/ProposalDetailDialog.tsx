/**
 * ProposalDetailDialog - 提案詳細資訊對話框
 * 用於在旅遊團頁面顯示提案詳情
 */

'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProposalPackages } from '@/hooks/cloud-hooks'
import { PackageListPanel } from './PackageListPanel'
import { TimelineItineraryDialog } from './TimelineItineraryDialog'
import { PackageItineraryDialog } from './PackageItineraryDialog'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { syncTimelineToQuote } from '@/lib/utils/itinerary-quote-sync'
import type { Proposal, ProposalStatus, ProposalPackage, TimelineItineraryData } from '@/types/proposal.types'

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

  // 快速行程表對話框狀態（用於單一遮罩模式）
  const [itineraryDialogOpen, setItineraryDialogOpen] = useState(false)
  const [itineraryPackage, setItineraryPackage] = useState<ProposalPackage | null>(null)

  // 時間軸行程表對話框狀態（用於單一遮罩模式）
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [timelinePackage, setTimelinePackage] = useState<ProposalPackage | null>(null)

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

  // 開啟快速行程表對話框（由 PackageListPanel 呼叫）
  const handleOpenItineraryDialog = useCallback((pkg: ProposalPackage) => {
    setItineraryPackage(pkg)
    setItineraryDialogOpen(true)
  }, [])

  // 關閉快速行程表對話框
  const handleCloseItineraryDialog = useCallback(() => {
    setItineraryDialogOpen(false)
    setItineraryPackage(null)
  }, [])

  // 開啟時間軸行程表對話框（由 PackageListPanel 呼叫）
  const handleOpenTimelineDialog = useCallback((pkg: ProposalPackage) => {
    setTimelinePackage(pkg)
    setTimelineDialogOpen(true)
  }, [])

  // 關閉時間軸行程表對話框
  const handleCloseTimelineDialog = useCallback(() => {
    setTimelineDialogOpen(false)
    setTimelinePackage(null)
  }, [])

  // 儲存時間軸資料
  const handleSaveTimeline = useCallback(async (timelineData: TimelineItineraryData) => {
    if (!timelinePackage) return

    try {
      const jsonData = JSON.parse(JSON.stringify(timelineData))

      const { error } = await supabase
        .from('proposal_packages')
        .update({
          itinerary_type: 'timeline',
          timeline_data: jsonData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timelinePackage.id)

      if (error) throw error

      // 如果有關聯報價單，同步餐食和住宿資料
      if (timelinePackage.quote_id) {
        await syncTimelineToQuote(timelinePackage.quote_id, timelineData)
      }

      handlePackagesChange()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [timelinePackage, handlePackagesChange])

  if (!proposal) return null

  // 任何子 Dialog 開啟時，主 Dialog 關閉但不卸載（避免 ref 問題）
  const hasChildDialogOpen = itineraryDialogOpen || timelineDialogOpen

  return (
    <>
      {/* 主對話框：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
      {!hasChildDialogOpen && (
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                onOpenItineraryDialog={handleOpenItineraryDialog}
                onOpenTimelineDialog={handleOpenTimelineDialog}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 快速行程表對話框：放在主對話框外面（單一遮罩模式） */}
      {itineraryPackage && (
        <PackageItineraryDialog
          isOpen={itineraryDialogOpen}
          onClose={handleCloseItineraryDialog}
          pkg={itineraryPackage}
          proposal={proposal}
          onItineraryCreated={handlePackagesChange}
        />
      )}

      {/* 時間軸行程表對話框：放在主對話框外面（單一遮罩模式） */}
      <TimelineItineraryDialog
        isOpen={timelineDialogOpen}
        onClose={handleCloseTimelineDialog}
        pkg={timelinePackage}
        onSave={handleSaveTimeline}
      />
    </>
  )
}
