'use client'

import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, ChevronLeft, ChevronRight, Settings } from 'lucide-react'

import BoxManager from '@/features/timebox/components/BoxManager'
import WeekView from '@/features/timebox/components/WeekView'
import { getWeekStart } from '@/features/timebox/hooks/useTimeboxData'

export default function TimeboxPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [timeInterval, setTimeInterval] = useState<30 | 60>(60)
  const [showBoxManager, setShowBoxManager] = useState(false)

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
          <div className="flex items-center gap-3">
            {/* 週選擇器 */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-l-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-morandi-primary min-w-[100px] text-center px-2">
                {weekStart.getMonth() + 1}/{weekStart.getDate()} - {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-r-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className={`h-9 border-morandi-gold/30 bg-card text-morandi-gold hover:bg-morandi-gold hover:border-morandi-gold hover:text-white transition-all shadow-sm font-medium rounded-lg ${
                isCurrentWeek ? 'bg-morandi-gold text-white border-morandi-gold' : ''
              }`}
            >
              本週
            </Button>

            {/* 時間間隔切換 */}
            <div className="flex items-center bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimeInterval(30)}
                className={`h-9 px-3 rounded-none transition-all ${
                  timeInterval === 30
                    ? 'bg-morandi-gold text-white hover:bg-morandi-gold-hover'
                    : 'hover:bg-morandi-container/50'
                }`}
              >
                30分
              </Button>
              <div className="w-px h-5 bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimeInterval(60)}
                className={`h-9 px-3 rounded-none transition-all ${
                  timeInterval === 60
                    ? 'bg-morandi-gold text-white hover:bg-morandi-gold-hover'
                    : 'hover:bg-morandi-container/50'
                }`}
              >
                1小時
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBoxManager(true)}
              className="h-9 border-border hover:border-morandi-gold/40 text-morandi-secondary hover:text-morandi-primary shadow-sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              管理箱子
            </Button>
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
    </div>
  )
}
