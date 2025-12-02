'use client'

import { useEffect, useState } from 'react'
import { Cloud, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface SyncStatusIndicatorProps {
  isDropdownHovered?: boolean
}

/**
 * 簡化版同步狀態指示器
 * 純雲端架構下，始終顯示「已連線」狀態
 */
export function SyncStatusIndicator({ isDropdownHovered = false }: SyncStatusIndicatorProps = {}) {
  const { sidebarCollapsed } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setMounted(true)

    // 監聽網路狀態
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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

  const color = isOnline ? 'text-morandi-green' : 'text-morandi-red'
  const text = isOnline ? '雲端同步' : '離線中'

  return (
    <div
      className={cn(
        'w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer'
      )}
    >
      {isOnline ? (
        <Wifi
          size={20}
          className={cn(color, 'absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2')}
        />
      ) : (
        <Cloud
          size={20}
          className={cn(color, 'absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2')}
        />
      )}
      <span
        className={cn(
          'ml-[58px] block text-left leading-10 transition-opacity duration-300',
          color,
          sidebarCollapsed
            ? isDropdownHovered
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
            : 'opacity-100'
        )}
      >
        {text}
      </span>
    </div>
  )
}
