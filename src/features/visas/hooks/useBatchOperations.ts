'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import type { Visa } from '@/stores/types'

/**
 * 批次操作邏輯 Hook
 * 負責批次送件、取件、退件的對話框狀態和處理
 */
export function useBatchOperations(
  visas: Visa[],
  selectedRows: string[],
  updateVisa: (id: string, updates: Record<string, unknown>) => Promise<void | Visa>,
  onComplete: () => void
) {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [pickupDate, setPickupDate] = useState(getTodayString())
  const [rejectDate, setRejectDate] = useState(getTodayString())

  // 取得選中的簽證資料
  const selectedVisas = useMemo(() => {
    return visas.filter(v => selectedRows.includes(v.id))
  }, [visas, selectedRows])

  // 批次取件
  const handleBatchPickup = async () => {
    selectedRows.forEach(id => {
      const visa = visas.find(v => v.id === id)
      const updates: Record<string, unknown> = {
        status: 'collected',
        pickup_date: pickupDate,
      }
      if (!visa?.documents_returned_date) {
        updates.documents_returned_date = pickupDate
      }
      updateVisa(id, updates)
    })
    setIsPickupDialogOpen(false)
    onComplete()
    toast.success('已取件')
  }

  // 批次退件
  const handleBatchReject = async () => {
    selectedRows.forEach(id => {
      updateVisa(id, {
        status: 'rejected',
        documents_returned_date: rejectDate,
      })
    })
    setIsRejectDialogOpen(false)
    onComplete()
    toast.success('已標記退件')
  }

  return {
    // 對話框狀態
    isSubmitDialogOpen,
    setIsSubmitDialogOpen,
    isPickupDialogOpen,
    setIsPickupDialogOpen,
    isRejectDialogOpen,
    setIsRejectDialogOpen,

    // 表單狀態
    pickupDate,
    setPickupDate,
    rejectDate,
    setRejectDate,

    // 資料
    selectedVisas,

    // 處理函數
    handleBatchPickup,
    handleBatchReject,
  }
}
