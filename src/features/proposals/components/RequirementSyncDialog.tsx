/**
 * RequirementSyncDialog - 需求確認單 Dialog
 *
 * 使用共用的 RequirementsList 組件，並提供 Dialog 外殼
 *
 * 支援兩種模式：
 * - ProposalPackage 模式：提案階段使用
 * - Tour 模式：開團後使用
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ClipboardList, X } from 'lucide-react'
import { TourRequestFormDialog } from './TourRequestFormDialog'
import { RequirementsList } from '@/components/requirements'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import type { Tour } from '@/stores/types'

interface RequirementSyncDialogProps {
  isOpen: boolean
  onClose: () => void
  // 提案套件模式
  pkg?: ProposalPackage | null
  proposal?: Proposal | null
  // 旅遊團模式
  tour?: Tour | null
  onSyncComplete?: () => void
}

export function RequirementSyncDialog({
  isOpen,
  onClose,
  pkg,
  proposal,
  tour,
  onSyncComplete,
}: RequirementSyncDialogProps) {
  const { toast } = useToast()

  // 需求單 Dialog 狀態
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedRequestData, setSelectedRequestData] = useState<{
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  } | null>(null)

  // 判斷模式
  const mode = tour ? 'tour' : 'package'

  // 取得 quoteId
  const quoteId = tour
    ? (tour.quote_id || tour.locked_quote_id)
    : pkg?.quote_id

  // Realtime 訂閱報價單變更
  useEffect(() => {
    if (!isOpen || !quoteId) return

    const channel = supabase
      .channel(`quote-changes-${quoteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `id=eq.${quoteId}`,
        },
        () => {
          logger.log('報價單已更新')
          toast({ title: '報價單已更新', description: '需求總覽將自動刷新' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, quoteId, toast])

  // 開啟需求單 Dialog 的回調
  const handleOpenRequestDialog = useCallback((data: {
    category: string
    supplierName: string
    items: { serviceDate: string | null; title: string; quantity: number; note?: string }[]
    tour?: Tour
    pkg?: ProposalPackage
    startDate: string | null
  }) => {
    setSelectedRequestData(data)
    setRequestDialogOpen(true)
  }, [])

  // 判斷是否有子 Dialog 開啟
  const hasChildDialogOpen = requestDialogOpen

  // 來源資訊
  const source = tour
    ? {
        id: tour.id,
        code: tour.code,
        title: tour.name,
        startDate: tour.departure_date,
        groupSize: tour.current_participants || tour.max_participants,
      }
    : pkg
      ? {
          id: pkg.id,
          code: proposal?.code || '',
          title: proposal?.title || '',
          startDate: pkg.start_date,
          groupSize: proposal?.group_size,
        }
      : null

  if (!source) return null

  return (
    <>
      {/* 主 Dialog：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
      {!hasChildDialogOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList size={18} className="text-morandi-gold" />
                需求確認單
                {mode === 'tour' && (
                  <span className="text-xs font-normal text-morandi-secondary ml-1">
                    ({source.code})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <RequirementsList
                tourId={tour?.id}
                proposalPackageId={pkg?.id}
                quoteId={quoteId}
                onOpenRequestDialog={handleOpenRequestDialog}
              />
            </div>

            {/* 底部按鈕 */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="gap-2">
                <X size={16} />
                關閉
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 需求單 Dialog */}
      {selectedRequestData && (
        <TourRequestFormDialog
          isOpen={requestDialogOpen}
          onClose={() => {
            setRequestDialogOpen(false)
            setSelectedRequestData(null)
          }}
          pkg={pkg}
          proposal={proposal}
          tour={tour}
          category={selectedRequestData.category}
          supplierName={selectedRequestData.supplierName}
          items={selectedRequestData.items}
          tourCode={source.code}
          tourName={source.title}
          departureDate={selectedRequestData.startDate || undefined}
          pax={source.groupSize || undefined}
        />
      )}
    </>
  )
}
