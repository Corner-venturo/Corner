/**
 * TourItineraryDialog - 旅遊團行程表選擇對話框
 * 讓用戶選擇建立「快速行程表」或「時間軸行程表」
 */

'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
import { useProposalPackages } from '@/hooks/cloud-hooks'
import type { Tour } from '@/stores/types'
import type { ProposalPackage, TimelineItineraryData, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
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
  // Proposal Packages（用於取得 timeline_data）
  const { items: proposalPackages, fetchAll: fetchProposalPackages } = useProposalPackages()

  // 狀態
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [packageItineraryDialogOpen, setPackageItineraryDialogOpen] = useState(false)
  const [dynamicPackage, setDynamicPackage] = useState<ProposalPackage | null>(null)

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchProposalPackages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 取得 tour 關聯的 proposal_package
  const tourProposalPackage = useMemo(() => {
    if (dynamicPackage) return dynamicPackage
    if (!tour.proposal_package_id) return null
    return proposalPackages.find(p => p.id === tour.proposal_package_id) || null
  }, [tour, proposalPackages, dynamicPackage])

  // 檢查行程表類型
  const itineraryType = tourProposalPackage?.itinerary_type || null

  // 檢查是否有時間軸行程表（timeline_data）
  const hasTimelineData = itineraryType === 'timeline' &&
    tourProposalPackage?.timeline_data &&
    typeof tourProposalPackage.timeline_data === 'object' &&
    Object.keys(tourProposalPackage.timeline_data).length > 0

  // 檢查是否有快速行程表（itinerary record）
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
    if (tourProposalPackage) return tourProposalPackage

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
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newPackage, error } = await (supabase as any)
        .from('proposal_packages')
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

      setDynamicPackage(newPackage as ProposalPackage)
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
    const pkg = await getOrCreatePackageForTour()
    if (pkg) {
      setPackageItineraryDialogOpen(true)
    }
  }

  // 選擇時間軸行程表
  const handleSelectTimelineItinerary = async () => {
    const pkg = await getOrCreatePackageForTour()
    if (pkg) {
      setTimelineDialogOpen(true)
    }
  }

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

      fetchProposalPackages()
    } catch (error) {
      logger.error('儲存時間軸資料失敗:', error)
      throw error
    }
  }, [tourProposalPackage, fetchProposalPackages])

  // 任何子 Dialog 開啟時，主 Dialog 關閉
  const hasChildDialogOpen = timelineDialogOpen || packageItineraryDialogOpen

  return (
    <>
      {/* 主對話框：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
      {!hasChildDialogOpen && (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
          <DialogContent className="max-w-md">
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
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 已有行程表時顯示 */}
                  {(hasQuickItinerary || hasTimelineData) && (
                    <div className="p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-morandi-primary">
                        <Eye className="w-4 h-4 text-morandi-gold" />
                        <span>
                          已有{hasQuickItinerary ? '快速行程表' : '時間軸行程表'}，點擊下方按鈕編輯
                        </span>
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
                      {hasQuickItinerary && (
                        <div className="mt-2 text-xs text-morandi-gold">
                          ✓ 已建立
                        </div>
                      )}
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
                      {hasTimelineData && (
                        <div className="mt-2 text-xs text-morandi-gold">
                          ✓ 已建立
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 快速行程表對話框 */}
      {tourProposalPackage && (
        <PackageItineraryDialog
          isOpen={packageItineraryDialogOpen}
          onClose={() => setPackageItineraryDialogOpen(false)}
          pkg={tourProposalPackage}
          proposal={fakeProposal}
          onItineraryCreated={() => {
            fetchProposalPackages()
          }}
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
