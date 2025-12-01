import { useState } from 'react'
import type { AdvanceItem } from '@/stores/workspace/types'

interface OrderForReceipt {
  id: string
  order_number: string | null
  contact_person: string
  total_amount: number
  paid_amount: number
  gap: number
}

/**
 * 管理選擇的訂單、代墊項目等狀態
 * 用於追蹤當前使用者選擇的項目
 */
export function useSelectionState() {
  const [selectedOrder, setSelectedOrder] = useState<OrderForReceipt | null>(null)
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState<AdvanceItem[] | null>(null)
  const [selectedAdvanceListId, setSelectedAdvanceListId] = useState<string>('')

  return {
    selectedOrder,
    setSelectedOrder,
    selectedAdvanceItem,
    setSelectedAdvanceItem,
    selectedAdvanceListId,
    setSelectedAdvanceListId,
  }
}
