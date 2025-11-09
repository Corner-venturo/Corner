import { useState } from 'react'

/**
 * 管理選擇的訂單、代墊項目等狀態
 * 用於追蹤當前使用者選擇的項目
 */
export function useSelectionState() {
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null)
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState<unknown>(null)
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
