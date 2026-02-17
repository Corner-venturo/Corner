'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Itinerary } from '@/stores/types'
import { alertError } from '@/lib/ui/alert-dialog'
import { ITINERARY_ACTIONS_LABELS } from '../constants/labels'

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

export function useItineraryDialogs() {
  const router = useRouter()

  // 新增行程對話框
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)

  // 密碼解鎖對話框
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)

  // 複製行程對話框
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<Itinerary | null>(null)
  const [duplicateTourCode, setDuplicateTourCode] = useState('')
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  // 打開新增行程對話框
  const handleOpenTypeSelect = useCallback(() => {
    setIsTypeSelectOpen(true)
  }, [])

  // 打開複製行程對話框
  const handleOpenDuplicateDialog = useCallback((itinerary: Itinerary) => {
    setDuplicateSource(itinerary)
    setDuplicateTourCode('')
    setDuplicateTitle('')
    setIsDuplicateDialogOpen(true)
  }, [])

  // 處理行程點擊（進行中需密碼解鎖）
  const handleRowClick = useCallback(
    (itinerary: Itinerary) => {
      // 如果是進行中狀態（已綁定旅遊團），需要密碼解鎖
      if (itinerary.status === '進行中') {
        setPendingEditId(itinerary.id)
        setPasswordInput('')
        setIsPasswordDialogOpen(true)
      } else {
        router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
      }
    },
    [router]
  )

  // 密碼驗證
  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === COMPANY_PASSWORD) {
      setIsPasswordDialogOpen(false)
      if (pendingEditId) {
        router.push(`/itinerary/new?itinerary_id=${pendingEditId}`)
      }
    } else {
      alertError('密碼錯誤！')
    }
  }, [passwordInput, pendingEditId, router])

  return {
    // 新增行程對話框
    isTypeSelectOpen,
    setIsTypeSelectOpen,
    handleOpenTypeSelect,

    // 密碼解鎖對話框
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    passwordInput,
    setPasswordInput,
    handlePasswordSubmit,

    // 複製行程對話框
    isDuplicateDialogOpen,
    setIsDuplicateDialogOpen,
    duplicateSource,
    setDuplicateSource,
    duplicateTourCode,
    setDuplicateTourCode,
    duplicateTitle,
    setDuplicateTitle,
    isDuplicating,
    setIsDuplicating,
    handleOpenDuplicateDialog,

    // 通用處理
    handleRowClick,
  }
}
