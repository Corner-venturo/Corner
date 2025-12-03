'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ChannelChat } from '@/components/workspace/ChannelChat'
import { useWorkspaceChannels } from '@/stores/workspace-store'

export default function WorkspacePage() {

  const { loadWorkspaces, loadChannelGroups, loadChannels, currentWorkspace } =
    useWorkspaceChannels()
  const [hasLoaded, setHasLoaded] = useState(false)

  // 🔥 Step 1: 載入 workspaces（只執行一次）
  useEffect(() => {
    if (hasLoaded) return

    const init = async () => {
      logger.log('🔵 [WorkspacePage] 載入工作空間')
      await loadWorkspaces()
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 🔥 Step 2: 當 workspace 載入後，載入 channels 和 groups（只執行一次）
  useEffect(() => {
    if (hasLoaded || !currentWorkspace) return

    const loadData = async () => {
      logger.log('🔵 [WorkspacePage] 載入頻道和群組')
      await Promise.all([loadChannelGroups(currentWorkspace.id), loadChannels(currentWorkspace.id)])
      setHasLoaded(true)
      logger.log('✅ [WorkspacePage] 初始化完成')
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="工作空間"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '工作空間', href: '/workspace' },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        <ChannelChat />
      </div>
    </div>
  )
}
