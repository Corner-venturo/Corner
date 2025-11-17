/**
 * useDisbursementForm Hook
 * 處理出納單的表單狀態和驗證
 */

import { useState, useMemo } from 'react'
import { PaymentRequest } from '../types'

export function useDisbursementForm(pendingRequests: PaymentRequest[]) {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [selectedRequestsForNew, setSelectedRequestsForNew] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // 計算選中金額
  const selectedAmount = useMemo(() => {
    return selectedRequests.reduce((sum, requestId) => {
      const request = pendingRequests.find((r: PaymentRequest) => r.id === requestId)
      return sum + (request?.amount || 0)
    }, 0)
  }, [selectedRequests, pendingRequests])

  // 計算新增出納單選中金額
  const selectedAmountForNew = useMemo(() => {
    return selectedRequestsForNew.reduce((sum, requestId) => {
      const request = pendingRequests.find((r: PaymentRequest) => r.id === requestId)
      return sum + (request?.amount || 0)
    }, 0)
  }, [selectedRequestsForNew, pendingRequests])

  // 處理勾選
  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    )
  }

  // 處理新增對話框勾選
  const handleSelectRequestForNew = (requestId: string) => {
    setSelectedRequestsForNew(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    )
  }

  // 全選/取消全選
  const handleSelectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(pendingRequests.map((r: PaymentRequest) => r.id))
    }
  }

  // 全選/取消全選（新增出納單用）
  const handleSelectAllForNew = () => {
    if (selectedRequestsForNew.length === pendingRequests.length) {
      setSelectedRequestsForNew([])
    } else {
      setSelectedRequestsForNew(pendingRequests.map((r: PaymentRequest) => r.id))
    }
  }

  // 重置表單
  const resetForm = () => {
    setSelectedRequestsForNew([])
    setIsAddDialogOpen(false)
  }

  // 重置選擇
  const clearSelections = () => {
    setSelectedRequests([])
  }

  return {
    selectedRequests,
    selectedRequestsForNew,
    isAddDialogOpen,
    selectedAmount,
    selectedAmountForNew,
    setIsAddDialogOpen,
    handleSelectRequest,
    handleSelectRequestForNew,
    handleSelectAll,
    handleSelectAllForNew,
    resetForm,
    clearSelections,
  }
}
