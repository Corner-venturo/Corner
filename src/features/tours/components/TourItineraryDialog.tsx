'use client'
/* eslint-disable venturo/no-custom-modal -- Loading overlay, not a dialog */
/**
 * TourItineraryDialog - 旅遊團行程表對話框
 * 統一入口：直接開啟 PackageItineraryDialog（與提案版本一致）
 */


import React, { useState, useMemo, useCallback, useEffect } from 'react'
import type { Tour } from '@/stores/types'
import type { ProposalPackage, Proposal } from '@/types/proposal.types'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { PackageItineraryDialog } from '@/features/proposals/components/package-itinerary'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { TOUR_ITINERARY_DIALOG } from '../constants'

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
  const [isLoading, setIsLoading] = useState(false)
  const [tourProposalPackage, setTourProposalPackage] = useState<ProposalPackage | null>(null)

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
  const getOrCreatePackageForTour = useCallback(async (): Promise<ProposalPackage | null> => {
    // 如果 tour 有 proposal_package_id，直接查詢
    if (tour.proposal_package_id) {
      const { data: existingPkg, error: pkgError } = await supabase
        .from('proposal_packages')
        .select('*')
        .eq('id', tour.proposal_package_id)
        .single()

      if (!pkgError && existingPkg) {
        return existingPkg as ProposalPackage
      }
    }

    // 沒有現有 package，建立新的
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

      return newPackage as ProposalPackage
    } catch (err) {
      logger.error('建立 package 錯誤:', err)
      toast.error('建立行程表失敗')
      return null
    }
  }, [tour])

  // 當對話框開啟時，自動載入或建立 package
  useEffect(() => {
    if (isOpen && !tourProposalPackage) {
      setIsLoading(true)
      getOrCreatePackageForTour()
        .then(pkg => {
          setTourProposalPackage(pkg)
        })
        .catch(err => logger.error('[getOrCreatePackageForTour]', err))
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, tourProposalPackage, getOrCreatePackageForTour])

  // 關閉時重置狀態
  const handleClose = useCallback(() => {
    setTourProposalPackage(null)
    onClose()
  }, [onClose])

  // 刷新 package 資料
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

  // 載入中顯示
  if (isOpen && isLoading) {
    return (
      <div className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-morandi-gold" />
          <span className="text-sm text-morandi-secondary">{TOUR_ITINERARY_DIALOG.loading}</span>
        </div>
      </div>
    )
  }

  // 直接開啟 PackageItineraryDialog（與提案版本一致）
  return (
    <>
      {tourProposalPackage && (
        <PackageItineraryDialog
          isOpen={isOpen}
          onClose={handleClose}
          pkg={tourProposalPackage}
          proposal={fakeProposal}
          onItineraryCreated={refreshPackage}
        />
      )}
    </>
  )
}
