'use client'

import { useEffect, useState } from 'react'
import { useSyncStatus } from '@/lib/sync/sync-status-service'
import { Cloud, CloudOff, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface SyncStatusIndicatorProps {
  isDropdownHovered?: boolean
}

export function SyncStatusIndicator({ isDropdownHovered = false }: SyncStatusIndicatorProps = {}) {
  const { pendingCount, isOnline, lastSyncTime, updateStatus } = useSyncStatus()
  const { sidebarCollapsed } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    setMounted(true)
    updateStatus()

    // 初始檢查
    const interval = setInterval(updateStatus, 30000)
    return () => clearInterval(interval)
  }, [updateStatus])

  // 在客戶端掛載前不渲染動態內容
  if (!mounted) {
    return (
      <div
        className={cn(
          'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer'
        )}
      >
        <Cloud
          size={20}
          className={cn(
            'text-morandi-green',
            'absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2'
          )}
        />
        <span
          className={cn(
            'ml-[58px] block text-left leading-10 transition-opacity duration-300',
            'text-morandi-green',
            sidebarCollapsed
              ? isDropdownHovered
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
              : 'opacity-100'
          )}
        >
          載入中...
        </span>
      </div>
    )
  }

  // 決定燈號顏色和圖示
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        color: 'text-morandi-red',
        icon: CloudOff,
        text: '離線模式',
      }
    }

    if (pendingCount > 0) {
      return {
        color: 'text-morandi-gold',
        icon: AlertCircle,
        text: `${pendingCount} 筆待同步`,
      }
    }

    return {
      color: 'text-morandi-green',
      icon: Cloud,
      text: '已同步',
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '尚未同步'
    try {
      return formatDistanceToNow(new Date(lastSyncTime), {
        addSuffix: true,
        locale: zhTW,
      })
    } catch {
      return '尚未同步'
    }
  }

  return (
    <div
      className={cn(
        'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer'
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon
        size={20}
        className={cn(config.color, 'absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2')}
      />
      {pendingCount > 0 && isOnline && (
        <span className="absolute left-10 top-3 w-2 h-2 bg-morandi-gold rounded-full animate-pulse" />
      )}
      <span
        className={cn(
          'ml-[58px] block text-left leading-10 transition-opacity duration-300',
          config.color,
          sidebarCollapsed
            ? isDropdownHovered
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
            : 'opacity-100'
        )}
      >
        {config.text}
      </span>

      {/* Hover 詳細資訊彈出框 */}
      {showTooltip && (
        <div
          className="fixed left-[200px] bg-card border border-border rounded-lg shadow-lg py-3 px-4 min-w-64 z-[60]"
          style={{
            top: 'auto',
            bottom: '16px',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-morandi-secondary">網路連線</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-morandi-green" />
                    <span className="text-morandi-green">已連線</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-morandi-red" />
                    <span className="text-morandi-red">離線</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-morandi-secondary">最後同步</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-morandi-secondary" />
                <span className="text-morandi-primary">{formatLastSyncTime()}</span>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="bg-morandi-container rounded p-2">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-morandi-gold" />
                  <span className="text-morandi-primary">{pendingCount} 筆變更待同步</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
