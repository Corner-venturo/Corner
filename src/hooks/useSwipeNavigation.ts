'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DEFAULT_NAV_ITEMS } from '@/components/layout/mobile-bottom-nav'

interface SwipeConfig {
  threshold?: number // 最小滑動距離（px）
  velocity?: number // 最小滑動速度（px/ms）
}

export function useSwipeNavigation(config: SwipeConfig = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  const threshold = config.threshold ?? 50 // 預設 50px
  const velocityThreshold = config.velocity ?? 0.3 // 預設 0.3px/ms

  useEffect(() => {
    // 只在手機模式 (< 768px) 啟用
    if (typeof window === 'undefined') return
    if (window.innerWidth >= 768) return

    const handleTouchStart = (e: TouchEvent) => {
      // 只取第一個觸控點
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const touchEndX = touch.clientX
      const touchEndY = touch.clientY
      const touchEndTime = Date.now()

      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current
      const deltaTime = touchEndTime - touchStartTime.current

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // 確保是水平滑動（橫向距離 > 縱向距離）
      if (absX <= absY) return

      // 計算滑動速度
      const velocity = absX / deltaTime

      // 檢查是否達到滑動閾值或速度
      if (absX < threshold && velocity < velocityThreshold) return

      // 獲取當前選中的導航項目
      let selectedItemIds: string[] = []
      try {
        const stored = localStorage.getItem('venturo_mobile_nav')
        if (stored) {
          selectedItemIds = JSON.parse(stored)
        } else {
          selectedItemIds = ['home', 'calendar', 'tours', 'orders']
        }
      } catch {
        selectedItemIds = ['home', 'calendar', 'tours', 'orders']
      }

      // 過濾出選中的項目
      const selectedItems = selectedItemIds
        .map(id => DEFAULT_NAV_ITEMS.find(item => item.id === id))
        .filter(item => item !== undefined)
        .slice(0, 4)

      // 找到當前頁面在導航項目中的索引
      const currentIndex = selectedItems.findIndex(item => {
        if (item.href === '/') return pathname === '/'
        return pathname.startsWith(item.href)
      })

      // 如果當前頁面不在導航欄中，不執行滑動切換
      if (currentIndex === -1) return

      let nextIndex = -1

      // 向右滑動 → 上一頁
      if (deltaX > 0 && currentIndex > 0) {
        nextIndex = currentIndex - 1
      }
      // 向左滑動 → 下一頁
      else if (deltaX < 0 && currentIndex < selectedItems.length - 1) {
        nextIndex = currentIndex + 1
      }

      // 切換頁面
      if (nextIndex !== -1 && selectedItems[nextIndex]) {
        router.push(selectedItems[nextIndex].href)
      }
    }

    // 監聽 touch 事件
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pathname, router, threshold, velocityThreshold])
}
