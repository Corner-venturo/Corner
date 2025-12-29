'use client'

import { useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, ChevronLeft, ChevronRight, Settings, BookOpen, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

import BoxManager from '@/features/timebox/components/BoxManager'
import WeekView from '@/features/timebox/components/WeekView'
import ManifestationNotebook from '@/features/timebox/components/ManifestationNotebook'
import WeekReviewDialog from '@/features/timebox/components/WeekReviewDialog'
import {
  getWeekStart,
  formatDateString,
  useTimeboxBoxes,
  useTimeboxWeeks,
  useTimeboxScheduledBoxes,
} from '@/features/timebox/hooks/useTimeboxData'

export default function TimeboxPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [timeInterval, setTimeInterval] = useState<30 | 60>(60)
  const [showBoxManager, setShowBoxManager] = useState(false)
  const [showWeekReview, setShowWeekReview] = useState(false)
  const [showManifestation, setShowManifestation] = useState(false)

  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes } = useTimeboxBoxes()
  const { items: weeks } = useTimeboxWeeks()
  const { items: scheduledBoxes } = useTimeboxScheduledBoxes()

  const goToPreviousWeek = () => {
    const prev = new Date(selectedWeek)
    prev.setDate(prev.getDate() - 7)
    setSelectedWeek(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(selectedWeek)
    next.setDate(next.getDate() + 7)
    setSelectedWeek(next)
  }

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date())
  }

  // 計算週的開始和結束日期
  const weekStart = getWeekStart(selectedWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const isCurrentWeek = getWeekStart(new Date()).getTime() === weekStart.getTime()

  // 簡潔的統計數據（文青風格）
  const stats = useMemo(() => {
    if (!userId) return { completed: 0, total: 0, hours: 0 }

    const weekStartStr = formatDateString(weekStart)
    const currentWeek = weeks.find(w => w.week_start === weekStartStr && w.user_id === userId)
    if (!currentWeek) return { completed: 0, total: 0, hours: 0 }

    const weekScheduled = scheduledBoxes.filter(sb => sb.week_id === currentWeek.id)
    const completed = weekScheduled.filter(sb => sb.completed).length
    const total = weekScheduled.length
    const hours = weekScheduled.filter(sb => sb.completed).reduce((sum, sb) => sum + sb.duration, 0) / 60

    return { completed, total, hours: Math.round(hours * 10) / 10 }
  }, [userId, weekStart, weeks, scheduledBoxes])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="箱型時間"
        icon={Clock}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '箱型時間', href: '/timebox' }
        ]}
        actions={(
          <div className="flex items-center gap-4">
            {/* 文青風格統計 - 簡潔的文字 */}
            <div className="hidden lg:flex items-center gap-6 text-sm text-morandi-secondary">
              <span>
                完成 <span className="font-medium text-morandi-primary">{stats.completed}</span>
                <span className="mx-1">/</span>
                <span className="text-morandi-muted">{stats.total}</span>
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-medium text-morandi-primary">{stats.hours}</span> 小時
              </span>
            </div>

            <div className="hidden lg:block w-px h-6 bg-border" />

            {/* 週選擇器 */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0 hover:text-morandi-gold"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={goToCurrentWeek}
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  isCurrentWeek
                    ? 'text-morandi-gold font-medium'
                    : 'text-morandi-secondary hover:text-morandi-primary'
                }`}
              >
                {weekStart.getMonth() + 1}/{weekStart.getDate()} - {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0 hover:text-morandi-gold"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 時間間隔切換 */}
            <div className="flex items-center text-sm">
              <button
                onClick={() => setTimeInterval(30)}
                className={`px-2 py-1 rounded-l border border-r-0 transition-colors ${
                  timeInterval === 30
                    ? 'bg-morandi-gold/10 border-morandi-gold/30 text-morandi-gold'
                    : 'border-border text-morandi-secondary hover:text-morandi-primary'
                }`}
              >
                30分
              </button>
              <button
                onClick={() => setTimeInterval(60)}
                className={`px-2 py-1 rounded-r border transition-colors ${
                  timeInterval === 60
                    ? 'bg-morandi-gold/10 border-morandi-gold/30 text-morandi-gold'
                    : 'border-border text-morandi-secondary hover:text-morandi-primary'
                }`}
              >
                1小時
              </button>
            </div>

            <button
              onClick={() => setShowManifestation(true)}
              className="text-morandi-secondary hover:text-morandi-gold transition-colors"
              title="每日顯化"
            >
              <Sparkles className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowWeekReview(true)}
              className="text-morandi-secondary hover:text-morandi-gold transition-colors"
              title="週複盤"
            >
              <BookOpen className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowBoxManager(true)}
              className="text-morandi-secondary hover:text-morandi-gold transition-colors"
              title="管理箱子"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <div className="flex-1 overflow-hidden">
        <WeekView
          selectedWeek={selectedWeek}
          timeInterval={timeInterval}
        />
      </div>

      {/* 管理箱子對話框 */}
      <Dialog open={showBoxManager} onOpenChange={setShowBoxManager}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>管理箱子</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
            <BoxManager />
          </div>
        </DialogContent>
      </Dialog>

      {/* 週複盤對話框 */}
      <WeekReviewDialog
        open={showWeekReview}
        onOpenChange={setShowWeekReview}
        selectedWeek={selectedWeek}
      />

      {/* 顯化筆記本對話框 */}
      <Dialog open={showManifestation} onOpenChange={setShowManifestation}>
        <DialogContent className="max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-morandi-gold" />
              顯化筆記本
            </DialogTitle>
          </DialogHeader>
          <ManifestationNotebook />
        </DialogContent>
      </Dialog>
    </div>
  )
}
