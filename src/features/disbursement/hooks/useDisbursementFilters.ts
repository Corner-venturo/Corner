/**
 * useDisbursementFilters Hook
 * 處理出納單的篩選和搜尋邏輯
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DisbursementTab } from '../types'

export function useDisbursementFilters() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DisbursementTab>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogSearchTerm, setDialogSearchTerm] = useState('')

  // 支援 URL 參數設定初始分頁
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['pending', 'current', 'all'].includes(tab)) {
      setActiveTab(tab as DisbursementTab)
    }
  }, [searchParams])

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    dialogSearchTerm,
    setDialogSearchTerm,
  }
}
