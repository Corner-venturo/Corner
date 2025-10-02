'use client'

import { useState } from 'react'
import { useTimeboxStore } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  weekStart: Date
  weekEnd: Date
}

export default function ReviewDialog({ isOpen, onClose, weekStart, weekEnd }: ReviewDialogProps) {
  const {
    getWeekStatistics,
    archiveCurrentWeek,
    copyToNextWeek,
    weekRecords,
    initializeCurrentWeek
  } = useTimeboxStore()

  const [archiveName, setArchiveName] = useState('')
  const [copyToNext, setCopyToNext] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [notes, setNotes] = useState('')

  const stats = getWeekStatistics()

  // 生成預設存檔名稱
  const getDefaultArchiveName = () => {
    const year = weekStart.getFullYear()
    const weekNumber = getWeekNumber(weekStart)
    return `${year}年第${weekNumber}週`
  }

  // 計算週數
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // 格式化日期範圍
  const formatDateRange = () => {
    return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  }

  // 格式化時間
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小時${mins > 0 ? ` ${mins}分鐘` : ''}`
    }
    return `${mins}分鐘`
  }

  const handleArchive = () => {
    const finalArchiveName = archiveName.trim() || getDefaultArchiveName()

    // 存檔當前週
    archiveCurrentWeek(finalArchiveName)

    // 如果選擇複製到下週
    if (copyToNext) {
      const nextWeekStart = new Date(weekEnd)
      nextWeekStart.setDate(nextWeekStart.getDate() + 1)

      if (selectedTemplate) {
        // 使用選擇的模板
        copyToNextWeek(selectedTemplate)
      } else {
        // 初始化空白的下週
        initializeCurrentWeek(nextWeekStart)
      }
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            本週覆盤 ({formatDateRange()})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 本週統計 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">本週統計</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">完成率：</span>
                <span className="font-medium">{Math.round(stats.completionRate * 100)}%</span>
              </div>
              <div>
                <span className="text-gray-600">運動時間：</span>
                <span className="font-medium">{formatTime(stats.totalWorkoutTime)}</span>
              </div>
              {stats.totalWorkoutVolume && stats.totalWorkoutVolume > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-600">總訓練量：</span>
                  <span className="font-medium">{stats.totalWorkoutVolume.toLocaleString()} kg</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">完成項目分布：</div>
              <div className="flex space-x-4 mt-1 text-sm">
                <span>運動 {stats.completedByType.workout} 次</span>
                <span>保養 {stats.completedByType.reminder} 次</span>
                <span>其他 {stats.completedByType.basic} 次</span>
              </div>
            </div>
          </div>

          {/* 存檔名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              存檔名稱
            </label>
            <Input
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder={getDefaultArchiveName()}
            />
          </div>

          {/* 覆盤筆記 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              覆盤筆記 (選填)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="記錄本週的心得、改進建議或下週計劃..."
              rows={3}
            />
          </div>

          {/* 複製到下週選項 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="copyToNext"
                checked={copyToNext}
                onCheckedChange={(checked) => setCopyToNext(checked as boolean)}
              />
              <label htmlFor="copyToNext" className="text-sm font-medium">
                複製排程到下週（清除完成狀態）
              </label>
            </div>

            {/* 模板選擇 */}
            {copyToNext && weekRecords.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇存檔模板（選填）
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇之前的週存檔作為模板" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekRecords
                      .filter(record => record.archived)
                      .slice(-10) // 只顯示最近10週
                      .map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          {record.name} (完成率: {Math.round(record.statistics.completionRate * 100)}%)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  選擇模板會複製該週的排程安排
                </p>
              </div>
            )}
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleArchive}>
              存檔
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}