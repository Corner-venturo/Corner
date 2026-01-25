/**
 * TourItineraryDialog - 旅遊團行程表選擇對話框
 * 讓用戶選擇建立「快速行程表」或「時間軸行程表」
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  FileText,
  Loader2,
  Zap,
  Clock,
  Eye,
} from 'lucide-react'
import type { Tour } from '@/stores/types'
import type { ProposalPackage, TimelineItineraryData, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { syncTimelineToQuote } from '@/lib/utils/itinerary-quote-sync'
import { TimelineItineraryDialog } from '@/features/proposals/components/TimelineItineraryDialog'
import { PackageItineraryDialog } from '@/features/proposals/components/PackageItineraryDialog'
import { toast } from 'sonner'

interface TourItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function TourItineraryDialog({
  isOpen,
  onClose,
  tour,
}: TourItineraryDialogProps) {
  // 狀態
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [packageItineraryDialogOpen, setPackageItineraryDialogOpen] = useState(false)
  const [tourProposalPackage, setTourProposalPackage] = useState<ProposalPackage | null>(null)

  // 🔧 優化：不在打開時查詢，只有用戶點擊時才載入
  // 對話框只是顯示兩個選項按鈕，不需要等資料

  // 🔧 簡化：只用 tour.proposal_package_id 判斷是否已有行程資料
  // 不需要載入整個 package 來判斷
  const hasExistingPackage = !!tour.proposal_package_id

  // 這些只有在 tourProposalPackage 載入後才有意義（用於子 Dialog）
  const itineraryType = tourProposalPackage?.itinerary_type || null
  const hasTimelineData = itineraryType === 'timeline' &&
    tourProposalPackage?.timeline_data &&
    typeof tourProposalPackage.timeline_data === 'object' &&
    Object.keys(tourProposalPackage.timeline_data).length > 0
  const hasQuickItinerary = itineraryType === 'simple' || !!tourProposalPackage?.itinerary_id

  // 為 PackageItineraryDialog 建立模擬 Proposal 物件（使用 Tour 資料）
  const fakeProposal = useMemo((): Proposal => ({
    id: tour.id,
    code: tour.code || '',
    title: tour.name,
    status: 'converted' as const,
    destination: tour.location || null,
    country_id: tour.country_id || null,
    main_city_id: tour.main_city_id || null,
    expected_start_date: tour.departure_date || null,
    expected_end_date: tour.return_date || null,
    created_at: tour.created_at || new Date().toISOString(),
    updated_at: tour.updated_at || new Date().toISOString(),
    workspace_id: tour.workspace_id || '',
  }), [tour])

  // 為旅遊團建立或取得 proposal_package
  const getOrCreatePackageForTour = async (): Promise<ProposalPackage | null> => {
    // 🔧 修正：每次都從資料庫查詢以確保資料是最新的
    // 避免使用過時的快取資料（例如之前 package 還沒有 itinerary_id 時的快取）

    // 如果 tour 有 proposal_package_id，直接查詢
    if (tour.proposal_package_id) {
      const { data: existingPkg, error: pkgError } = await supabase
        .from('proposal_packages')
        .select('*')
        .eq('id', tour.proposal_package_id)
        .single()

      if (!pkgError && existingPkg) {
        setTourProposalPackage(existingPkg as ProposalPackage)
        return existingPkg as ProposalPackage
      }
    }

    // 沒有現有 package，建立新的
    setIsCreatingPackage(true)
    try {
      let days = 5
      if (tour.departure_date && tour.return_date) {
        const start = new Date(tour.departure_date)
        const end = new Date(tour.return_date)
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }

      const newPackageData = {
        id: crypto.randomUUID(),
        proposal_id: null,
        version_name: tour.name || '行程版本',
        version_number: 1,
        days,
        start_date: tour.departure_date || null,
        end_date: tour.return_date || null,
        group_size: tour.max_participants || null,
        country_id: null,
        main_city_id: null,
        destination: tour.location || null,
        is_selected: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workspace_id: tour.workspace_id,
      }

       
      const { data: newPackage, error } = await dynamicFrom('proposal_packages')
        .insert(newPackageData)
        .select()
        .single()

      if (error) {
        logger.error('建立 proposal_package 失敗:', error)
        toast.error('建立行程表失敗')
        return null
      }

      const { error: updateError } = await supabase
        .from('tours')
        .update({ proposal_package_id: newPackage.id })
        .eq('id', tour.id)

      if (updateError) {
        logger.error('更新旅遊團關聯失敗:', updateError)
      }

      setTourProposalPackage(newPackage as ProposalPackage)
      return newPackage as ProposalPackage
    } catch (err) {
      logger.error('建立 package 錯誤:', err)
      toast.error('建立行程表失敗')
      return null
    } finally {
      setIsCreatingPackage(false)
    }
  }

  // 選擇快速行程表（PackageItineraryDialog）
  const handleSelectQuickItinerary = async () => {
    setIsCreatingPackage(true)
    try {
      const pkg = await getOrCreatePackageForTour()
      if (pkg) {
        // 🔧 確保 state 更新後再打開 Dialog
        setTourProposalPackage(pkg)
        // 使用 setTimeout 確保 state 已更新
        setTimeout(() => setPackageItineraryDialogOpen(true), 0)
      }
    } finally {
      setIsCreatingPackage(false)
    }
  }

  // 選擇時間軸行程表
  const handleSelectTimelineItinerary = async () => {
    setIsCreatingPackage(true)
    try {
      const pkg = await getOrCreatePackageForTour()
      if (pkg) {
        setTourProposalPackage(pkg)
        setTimeout(() => setTimelineDialogOpen(true), 0)
      }
    } finally {
      setIsCreatingPackage(false)
    }
  }

  // 刷新當前 package 資料
  const refreshPackage = useCallback(async () => {
    if (!tourProposalPackage?.id) return
    const { data, error } = await supabase
      .from('proposal_packages')
      .select('*')
      .eq('id', tourProposalPackage.id)
      .single()
    if (!error && data) {
      setTourProposalPackage(data as ProposalPackage)
    }
  }, [tourProposalPackage?.id])

  // 儲存時間軸資料
  const handleSaveTimeline = useCallback(async (timelineData: TimelineItineraryData) => {
    if (!tourProposalPackage) return

    try {
      const jsonData = JSON.parse(JSON.stringify(timelineData))

      const { error } = await supabase
        .from('proposal_packages')
        .update({
          itinerary_type: 'timeline',
          timeline_data: jsonData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tourProposalPackage.id)

      if (error) throw error

      if (tourProposalPackage.quote_id) {
        await syncTimelineToQuote(tourProposalPackage.quote_id, timelineData)
      }

      refreshPackage()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [tourProposalPackage, refreshPackage])

  // 注意：已移除 hasChildDialogOpen 模式，改用 Dialog level 系統處理多重遮罩

  return (
    <>
      {/* 主對話框：使用 level={1} */}
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
          <DialogContent level={1} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-morandi-gold" />
                <span>行程表</span>
              </DialogTitle>
              <DialogDescription>
                為「{tour.name}」選擇行程表類型
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {isCreatingPackage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-morandi-secondary" />
                  <span className="ml-2 text-sm text-morandi-secondary">處理中...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 已有行程資料時顯示 */}
                  {hasExistingPackage && (
                    <div className="p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-morandi-primary">
                        <Eye className="w-4 h-4 text-morandi-gold" />
                        <span>已有行程資料，點擊下方按鈕查看或編輯</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* 快速行程表 */}
                    <button
                      onClick={handleSelectQuickItinerary}
                      className="p-4 rounded-lg border-2 border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-morandi-gold/10 flex items-center justify-center group-hover:bg-morandi-gold/20 transition-colors">
                          <Zap className="w-5 h-5 text-morandi-gold" />
                        </div>
                      </div>
                      <span className="font-medium text-morandi-primary block mb-1">
                        快速行程表
                      </span>
                      <p className="text-xs text-morandi-secondary">
                        完整的行程編輯器，支援景點、餐食、住宿等詳細設定
                      </p>
                    </button>

                    {/* 時間軸行程表 */}
                    <button
                      onClick={handleSelectTimelineItinerary}
                      disabled={isCreatingPackage}
                      className="p-4 rounded-lg border-2 border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-morandi-container flex items-center justify-center group-hover:bg-morandi-container/80 transition-colors">
                          <Clock className="w-5 h-5 text-morandi-secondary" />
                        </div>
                      </div>
                      <span className="font-medium text-morandi-primary block mb-1">
                        時間軸行程表
                      </span>
                      <p className="text-xs text-morandi-secondary">
                        以時間軸方式編輯每日行程，適合快速建立
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      {/* 快速行程表對話框（level={2}） */}
      {tourProposalPackage && (
        <PackageItineraryDialog
          isOpen={packageItineraryDialogOpen}
          onClose={() => setPackageItineraryDialogOpen(false)}
          pkg={tourProposalPackage}
          proposal={fakeProposal}
          onItineraryCreated={refreshPackage}
        />
      )}

      {/* 時間軸行程表對話框 */}
      {tourProposalPackage && (
        <TimelineItineraryDialog
          isOpen={timelineDialogOpen}
          onClose={() => setTimelineDialogOpen(false)}
          pkg={tourProposalPackage}
          onSave={handleSaveTimeline}
        />
      )}
    </>
  )
}
