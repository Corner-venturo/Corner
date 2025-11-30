'use client'

import React, { useState } from 'react'
import { Building2, Check } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { useWorkspaceStore } from '@/stores'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * 切換 Workspace
 * 更新 store 並重新載入頁面
 */
async function switchWorkspace(workspaceId: string) {
  const store = useWorkspaceStore.getState()
  store.setCurrentWorkspace(workspaceId)
  logger.log('[Workspace Switch] 已切換到:', workspaceId)
  // 重新載入頁面以刷新資料
  window.location.reload()
}

/**
 * Workspace 切換器
 * 用於在不同分公司間切換（切換後會重新載入資料）
 */
export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore()
  const [switching, setSwitching] = useState(false)

  const currentWorkspace = workspaces.find((w: any) => w.id === currentWorkspaceId)

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId || switching) {
      return
    }

    setSwitching(true)
    try {
      await switchWorkspace(workspaceId)
    } catch (error) {
      logger.error('切換 Workspace 失敗:', error)
      alert('切換失敗，請稍後再試')
      setSwitching(false)
    }
  }

  if (workspaces.length <= 1) {
    // 只有一個 workspace 時不顯示切換器
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={switching} className="min-w-[140px]">
          <Building2 size={16} className="mr-2" />
          {switching ? '切換中...' : currentWorkspace?.name || '選擇工作空間'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {workspaces
          .filter((w: any) => w.is_active)
          .map((workspace: any) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitch(workspace.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>{workspace.name}</span>
                {workspace.id === currentWorkspaceId && (
                  <Check size={16} className="text-morandi-gold" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
