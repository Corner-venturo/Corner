import { useState } from 'react'
import { QuickActionTab } from './types'

export function useTodoExpandedView() {
  const [activeTab, setActiveTab] = useState<QuickActionTab>('receipt')

  return {
    activeTab,
    setActiveTab,
  }
}
