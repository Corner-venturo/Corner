'use client'

import { LABELS } from './constants/labels'

import { useState, useMemo } from 'react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
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

  // 統計數據
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
    <ContentPageLayout
      title={LABELS.LABEL_9636}
      icon={Clock}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '箱型時間', href: '/timebox' }
      ]}
      contentClassName="flex-1 overflow-hidden"
      headerActions={(
          <div className="flex items-center gap-2">
            {/* 週選擇器 */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0 rounded-none border-r border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={goToCurrentWeek}
                className={`text-sm px-3 h-8 transition-colors ${
                  isCurrentWeek
                    ? 'text-morandi-gold font-medium bg-morandi-gold/5'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                }`}
              >
                {weekStart.getMonth() + 1}/{weekStart.getDate()} - {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0 rounded-none border-l border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 時間間隔切換 */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setTimeInterval(30)}
                className={`px-3 h-8 text-sm transition-colors ${
                  timeInterval === 30
                    ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                }`}
              >
                30分
              </button>
              <button
                onClick={() => setTimeInterval(60)}
                className={`px-3 h-8 text-sm border-l border-border transition-colors ${
                  timeInterval === 60
                    ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                    : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
                }`}
              >
                1小時
              </button>
            </div>

            {/* 統計（整合為一個區塊） */}
            {stats.total > 0 && (
              <div className="hidden lg:flex items-center h-8 px-3 border border-border rounded-lg text-sm text-morandi-secondary bg-morandi-container/20">
                <span className="text-morandi-gold font-medium">{stats.completed}</span>
                <span className="mx-0.5">/</span>
                <span>{stats.total}</span>
                <span className="mx-2 text-border">·</span>
                <span className="text-morandi-gold font-medium">{stats.hours}</span>
                <span className="ml-0.5">h</span>
              </div>
            )}

            {/* 功能按鈕群組 */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManifestation(true)}
                className="h-8 w-8 p-0 rounded-none text-morandi-secondary hover:text-morandi-gold"
                title={LABELS.LABEL_4938}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWeekReview(true)}
                className="h-8 w-8 p-0 rounded-none border-l border-border text-morandi-secondary hover:text-morandi-gold"
                title={LABELS.LABEL_4141}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBoxManager(true)}
                className="h-8 w-8 p-0 rounded-none border-l border-border text-morandi-secondary hover:text-morandi-gold"
                title={LABELS.MANAGE_BOXES}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
    >
        <WeekView
          selectedWeek={selectedWeek}
          timeInterval={timeInterval}
        />

      {/* 管理箱子對話框 */}
      <Dialog open={showBoxManager} onOpenChange={setShowBoxManager}>
        <DialogContent level={1} className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{LABELS.MANAGE_BOXES}</DialogTitle>
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
        <DialogContent level={1} className="max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-morandi-gold" />
              {LABELS.LABEL_7491}
            </DialogTitle>
          </DialogHeader>
          <ManifestationNotebook />
        </DialogContent>
      </Dialog>
    </ContentPageLayout>
  )
}
