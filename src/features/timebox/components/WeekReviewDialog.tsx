'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen, TrendingUp, Target, Sparkles, Copy, Check, Save, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useTimeboxWeeks,
  useTimeboxScheduledBoxes,
  useTimeboxBoxes,
  formatDateString,
  getWeekStart,
  type TimeboxWeek,
} from '../hooks/useTimeboxData'
import { alert } from '@/lib/ui/alert-dialog'

interface WeekReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedWeek: Date
}

export default function WeekReviewDialog({ open, onOpenChange, selectedWeek }: WeekReviewDialogProps) {
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: weeks, update: updateWeek, create: createWeek } = useTimeboxWeeks()
  const { items: scheduledBoxes, create: createScheduledBox } = useTimeboxScheduledBoxes()
  const { items: boxes } = useTimeboxBoxes()

  const [reviewNotes, setReviewNotes] = useState('')
  const [nextWeekGoals, setNextWeekGoals] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // 取得當前週記錄
  const weekStartStr = formatDateString(getWeekStart(selectedWeek))
  const currentWeekRecord = useMemo(() => {
    if (!userId) return null
    return weeks.find(w => w.week_start === weekStartStr && w.user_id === userId)
  }, [weeks, weekStartStr, userId])

  // 取得上週記錄
  const lastWeekStart = new Date(getWeekStart(selectedWeek))
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekStartStr = formatDateString(lastWeekStart)
  const lastWeekRecord = useMemo(() => {
    if (!userId) return null
    return weeks.find(w => w.week_start === lastWeekStartStr && w.user_id === userId)
  }, [weeks, lastWeekStartStr, userId])

  // 取得下週記錄
  const nextWeekStart = new Date(getWeekStart(selectedWeek))
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  const nextWeekStartStr = formatDateString(nextWeekStart)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)
  const nextWeekEndStr = formatDateString(nextWeekEnd)
  const nextWeekRecord = useMemo(() => {
    if (!userId) return null
    return weeks.find(w => w.week_start === nextWeekStartStr && w.user_id === userId)
  }, [weeks, nextWeekStartStr, userId])

  // 當前週的排程
  const currentScheduledBoxes = useMemo(() => {
    if (!currentWeekRecord) return []
    return scheduledBoxes.filter(sb => sb.week_id === currentWeekRecord.id)
  }, [scheduledBoxes, currentWeekRecord])

  // 上週的排程
  const lastWeekScheduledBoxes = useMemo(() => {
    if (!lastWeekRecord) return []
    return scheduledBoxes.filter(sb => sb.week_id === lastWeekRecord.id)
  }, [scheduledBoxes, lastWeekRecord])

  // 下週的排程
  const nextWeekScheduledBoxes = useMemo(() => {
    if (!nextWeekRecord) return []
    return scheduledBoxes.filter(sb => sb.week_id === nextWeekRecord.id)
  }, [scheduledBoxes, nextWeekRecord])

  // 計算統計
  const stats = useMemo(() => {
    const total = currentScheduledBoxes.length
    const completed = currentScheduledBoxes.filter(sb => sb.completed).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const byType = { workout: 0, reminder: 0, basic: 0 }
    currentScheduledBoxes.forEach(sb => {
      if (sb.completed) {
        const box = boxes.find(b => b.id === sb.box_id)
        if (box) {
          const type = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
          byType[type]++
        }
      }
    })

    return { total, completed, completionRate, byType }
  }, [currentScheduledBoxes, boxes])

  // 載入現有的回顧內容
  useEffect(() => {
    if (currentWeekRecord) {
      // 從 data 欄位讀取（因為 review_notes 可能未在類型中定義）
      const weekData = currentWeekRecord as TimeboxWeek & { review_notes?: string; next_week_goals?: string }
      setReviewNotes(weekData.review_notes || '')
      setNextWeekGoals(weekData.next_week_goals || '')
    } else {
      setReviewNotes('')
      setNextWeekGoals('')
    }
  }, [currentWeekRecord])

  // 儲存回顧
  const handleSave = async () => {
    if (!currentWeekRecord) return

    setIsSaving(true)
    try {
      await updateWeek(currentWeekRecord.id, {
        review_notes: reviewNotes,
        next_week_goals: nextWeekGoals,
      } as Partial<TimeboxWeek>)
      void alert('週複盤已儲存', 'success')
    } finally {
      setIsSaving(false)
    }
  }

  // 複製上週排程到本週
  const handleCopyLastWeek = async () => {
    if (!lastWeekRecord || !currentWeekRecord || !userId) {
      void alert('找不到上週排程', 'warning')
      return
    }

    if (currentScheduledBoxes.length > 0) {
      void alert('本週已有排程，無法複製', 'warning')
      return
    }

    setIsCopying(true)
    try {
      for (const sb of lastWeekScheduledBoxes) {
        await createScheduledBox({
          user_id: userId,
          box_id: sb.box_id,
          week_id: currentWeekRecord.id,
          day_of_week: sb.day_of_week,
          start_time: sb.start_time,
          duration: sb.duration,
          completed: false,
          data: null,
        })
      }
      void alert(`已複製 ${lastWeekScheduledBoxes.length} 個排程到本週`, 'success')
    } finally {
      setIsCopying(false)
    }
  }

  // 複製本週排程到下週
  const handleCopyToNextWeek = async () => {
    if (!currentWeekRecord || !userId) {
      void alert('找不到本週記錄', 'warning')
      return
    }

    if (currentScheduledBoxes.length === 0) {
      void alert('本週沒有排程可複製', 'warning')
      return
    }

    setIsCopying(true)
    try {
      // 確保下週記錄存在
      let targetWeekId = nextWeekRecord?.id

      if (!targetWeekId) {
        // 創建下週記錄
        const newWeek = await createWeek({
          user_id: userId,
          week_start: nextWeekStartStr,
          week_end: nextWeekEndStr,
          name: null,
          archived: false,
        } as Omit<TimeboxWeek, 'id' | 'created_at' | 'updated_at'>)
        if (newWeek) {
          targetWeekId = newWeek.id
        }
      }

      if (!targetWeekId) {
        void alert('無法創建下週記錄', 'warning')
        return
      }

      // 檢查下週是否已有排程
      if (nextWeekScheduledBoxes.length > 0) {
        void alert('下週已有排程，無法複製', 'warning')
        return
      }

      // 複製所有排程
      for (const sb of currentScheduledBoxes) {
        // 找到箱子的預設內容
        const box = boxes.find(b => b.id === sb.box_id)
        await createScheduledBox({
          user_id: userId,
          box_id: sb.box_id,
          week_id: targetWeekId,
          day_of_week: sb.day_of_week,
          start_time: sb.start_time,
          duration: sb.duration,
          completed: false,
          data: box?.default_content || null,
        })
      }
      void alert(`已複製 ${currentScheduledBoxes.length} 個排程到下週`, 'success')
    } finally {
      setIsCopying(false)
    }
  }

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-morandi-gold" />
            週複盤 - {formatWeekRange(getWeekStart(selectedWeek))}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 本週統計 */}
          <div className="bg-morandi-container/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-morandi-primary mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-morandi-gold" />
              本週統計
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-primary">{stats.completionRate}%</div>
                <div className="text-xs text-morandi-secondary">完成率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-primary">{stats.completed}/{stats.total}</div>
                <div className="text-xs text-morandi-secondary">完成項目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-green">{stats.byType.workout}</div>
                <div className="text-xs text-morandi-secondary">重訓</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-gold">{stats.byType.reminder + stats.byType.basic}</div>
                <div className="text-xs text-morandi-secondary">其他</div>
              </div>
            </div>
          </div>

          {/* 本週回顧 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-morandi-primary mb-2">
              <Sparkles className="h-4 w-4 text-morandi-gold" />
              本週回顧
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="這週有什麼收穫？遇到什麼挑戰？有什麼值得慶祝的事？"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 下週目標 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-morandi-primary mb-2">
              <Target className="h-4 w-4 text-morandi-gold" />
              下週目標
            </label>
            <Textarea
              value={nextWeekGoals}
              onChange={(e) => setNextWeekGoals(e.target.value)}
              placeholder="下週想達成什麼？有什麼要特別注意的事？"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 複製排程區域 */}
          <div className="space-y-3">
            {/* 複製上週排程到本週 */}
            {lastWeekScheduledBoxes.length > 0 && currentScheduledBoxes.length === 0 && (
              <div className="bg-morandi-container/30 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-morandi-primary">複製上週排程</h4>
                    <p className="text-xs text-morandi-secondary mt-1">
                      上週有 {lastWeekScheduledBoxes.length} 個排程，要複製到本週嗎？
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopyLastWeek}
                    disabled={isCopying}
                    variant="outline"
                    className="gap-2"
                  >
                    {isCopying ? (
                      <>複製中...</>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        複製到本週
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 複製本週排程到下週 */}
            {currentScheduledBoxes.length > 0 && (
              <div className="bg-morandi-gold/10 border border-morandi-gold/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-morandi-primary">複製到下週</h4>
                    <p className="text-xs text-morandi-secondary mt-1">
                      本週有 {currentScheduledBoxes.length} 個排程
                      {nextWeekScheduledBoxes.length > 0 && (
                        <span className="text-morandi-red">（下週已有 {nextWeekScheduledBoxes.length} 個排程）</span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopyToNextWeek}
                    disabled={isCopying || nextWeekScheduledBoxes.length > 0}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    {isCopying ? (
                      <>複製中...</>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        複製到下週
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 按鈕區 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              {isSaving ? (
                <>儲存中...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  儲存回顧
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
