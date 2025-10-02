'use client'

/**
 * 🔄 同步狀態指示器組件
 *
 * 顯示目前的同步狀態和待同步數量
 * 可點擊手動觸發同步
 */

import { useAutoSync } from '@/lib/offline/auto-sync-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cloud,
  CloudOff,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SyncIndicator() {
  const { syncStatus, isOnline, triggerSync } = useAutoSync()

  const handleSync = async () => {
    try {
      await triggerSync()
    } catch (error) {
      console.error('同步失敗:', error)
    }
  }

  // 計算同步狀態
  const pendingCount = syncStatus?.pendingCount || 0
  const isSyncing = syncStatus?.isSyncing || false
  const hasErrors = (syncStatus?.errors?.length || 0) > 0

  // 顯示圖示
  const renderIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-muted-foreground" />
    }
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    if (hasErrors) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
    if (pendingCount === 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <Cloud className="h-4 w-4 text-blue-500" />
  }

  // 顯示提示文字
  const getTooltipText = () => {
    if (!isOnline) return '離線模式'
    if (isSyncing) return '同步中...'
    if (hasErrors) return `同步失敗: ${syncStatus?.errors?.length || 0} 個錯誤`
    if (pendingCount === 0) return '所有資料已同步'
    return `待同步: ${pendingCount} 筆`
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className="gap-2"
            >
              {renderIcon()}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
