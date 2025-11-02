'use client'

import { useEffect, useState, useRef } from 'react'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, Package2 } from 'lucide-react'

import { useTimeboxStore } from '@/stores/timebox-store'

import BoxManager from './components/box-manager'
import ReviewDialog from './components/review-dialog'
import StatisticsPanel from './components/statistics-panel'
import WeekView from './components/week-view'
import DayView from './components/day-view'

export default function TimeboxPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date()) // 手機模式用
  const [timeInterval, setTimeInterval] = useState<30 | 60>(60) // 分鐘
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showBoxManager, setShowBoxManager] = useState(false)

  const { currentWeek, initializeCurrentWeek } = useTimeboxStore()

  // 手機模式滑動導航
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  // 初始化當前週（純本地模式）
  useEffect(() => {
    if (!currentWeek) {
      initializeCurrentWeek(new Date())
    }
  }, [currentWeek, initializeCurrentWeek])

  // 手機模式滑動切換日期
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth >= 768) return // 桌面模式不啟用

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const touchEndTime = Date.now()

      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current
      const deltaTime = touchEndTime - touchStartTime.current

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // 確保是水平滑動
      if (absX <= absY) return

      // 計算滑動速度
      const velocity = absX / deltaTime

      // 檢查是否達到滑動閾值（50px 或 0.3px/ms）
      if (absX < 50 && velocity < 0.3) return

      // 向右滑動 → 上一天
      if (deltaX > 0) {
        setSelectedDay(prev => {
          const newDay = new Date(prev)
          newDay.setDate(prev.getDate() - 1)
          return newDay
        })
      }
      // 向左滑動 → 下一天
      else if (deltaX < 0) {
        setSelectedDay(prev => {
          const newDay = new Date(prev)
          newDay.setDate(prev.getDate() + 1)
          return newDay
        })
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // 計算週的開始和結束日期
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 調整為週一開始
    return new Date(d.setDate(diff))
  }

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return end
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="時間箱管理"
        icon={Clock}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '箱型時間', href: '/timebox' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBoxManager(true)}
              className="items-center gap-2 border-border hover:border-morandi-gold/40 text-morandi-secondary hover:text-morandi-primary"
            >
              <Package2 className="h-4 w-4" />
              <span className="hidden sm:inline">管理箱子</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewDialog(true)}
              className="items-center gap-2 border-border hover:border-morandi-gold/40 text-morandi-secondary hover:text-morandi-primary"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">覆盤本週</span>
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-4 md:gap-6">
          {/* 週選擇器 - 桌面模式 */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date(selectedWeek)
                prev.setDate(prev.getDate() - 7)
                setSelectedWeek(prev)
              }}
              className="text-morandi-secondary hover:text-morandi-primary border-border hover:border-morandi-gold/20"
            >
              ←
            </Button>
            <span className="text-sm text-morandi-secondary min-w-[120px] text-center font-medium">
              {selectedWeek.toLocaleDateString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
              })}{' '}
              -{' '}
              {new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
                'zh-TW',
                {
                  month: 'numeric',
                  day: 'numeric',
                }
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new Date(selectedWeek)
                next.setDate(next.getDate() + 7)
                setSelectedWeek(next)
              }}
              className="text-morandi-secondary hover:text-morandi-primary border-border hover:border-morandi-gold/20"
            >
              →
            </Button>
          </div>

          {/* 日期顯示 - 手機模式 */}
          <div className="md:hidden flex items-center justify-center">
            <span className="text-base font-medium text-morandi-primary">
              {selectedDay.toLocaleDateString('zh-TW', {
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* 時間間隔切換 */}
          <div className="flex items-center gap-1">
            <Button
              variant={timeInterval === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeInterval(30)}
              className={
                timeInterval === 30
                  ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white border-morandi-gold/20'
                  : 'text-morandi-secondary hover:text-morandi-primary border-border hover:border-morandi-gold/20'
              }
            >
              <span className="hidden sm:inline">30分鐘</span>
              <span className="sm:hidden">30分</span>
            </Button>
            <Button
              variant={timeInterval === 60 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeInterval(60)}
              className={
                timeInterval === 60
                  ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white border-morandi-gold/20'
                  : 'text-morandi-secondary hover:text-morandi-primary border-border hover:border-morandi-gold/20'
              }
            >
              <span className="hidden sm:inline">1小時</span>
              <span className="sm:hidden">60分</span>
            </Button>
          </div>

          {/* 統計面板 - inline 模式（桌面） */}
          <div className="hidden md:block">
            <StatisticsPanel variant="inline" />
          </div>
        </div>
      </ResponsiveHeader>

      <div className="flex-1 overflow-hidden">
        {/* 時間箱視圖 - 填滿空間，內部可滾動 */}
        <div className="h-full">
          <div className="h-full border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            {/* 桌面模式 - 週視圖 */}
            <div className="hidden md:block h-full">
              <WeekView selectedWeek={selectedWeek} timeInterval={timeInterval} />
            </div>

            {/* 手機模式 - 日視圖 */}
            <div className="md:hidden h-full">
              <DayView selectedDay={selectedDay} timeInterval={timeInterval} />
            </div>
          </div>
        </div>
      </div>

      {/* 週覆盤對話框 */}
      <ReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        weekStart={getWeekStart(selectedWeek)}
        weekEnd={getWeekEnd(selectedWeek)}
      />

      {/* 管理箱子對話框 */}
      {showBoxManager && (
        <Dialog open={showBoxManager} onOpenChange={() => setShowBoxManager(false)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>管理箱子</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              <BoxManager />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
