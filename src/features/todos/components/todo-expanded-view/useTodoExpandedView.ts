'use client'

import { useState, useCallback } from 'react'
import { QuickActionTab } from './types'

export function useTodoExpandedView() {
  const [activeTab, setActiveTab] = useState<QuickActionTab>('receipt')

  const handleTabChange = useCallback((tab: QuickActionTab) => {
    setActiveTab(tab)
  }, [])

  return {
    activeTab,
    setActiveTab: handleTabChange,
  }
}
