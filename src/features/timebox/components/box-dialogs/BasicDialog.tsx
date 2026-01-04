'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Edit2, Save, Check, FileText, X } from 'lucide-react'
import { useTimeboxScheduledBoxes, useTimeboxBoxes, type TimeboxScheduledBox, type TimeboxBox, weekDayNames } from '../../hooks/useTimeboxData'
import { confirm, alert } from '@/lib/ui/alert-dialog'

interface BasicData {
  notes?: string
  lastUpdated?: string
}

interface BasicDialogProps {
  scheduledBox: TimeboxScheduledBox
  box: TimeboxBox
  onClose: () => void
}

export default function BasicDialog({ scheduledBox, box, onClose }: BasicDialogProps) {
  const { update: updateScheduledBox, delete: deleteScheduledBox } = useTimeboxScheduledBoxes()
  const { update: updateBox } = useTimeboxBoxes()
  const [isEditing, setIsEditing] = useState(false)
  const [editStartTime, setEditStartTime] = useState(scheduledBox.start_time.substring(0, 5))
  const [editDuration, setEditDuration] = useState(scheduledBox.duration)
  const [notes, setNotes] = useState('')

  // 載入現有筆記
  useEffect(() => {
    if (scheduledBox.data) {
      const basicData = scheduledBox.data as unknown as BasicData
      setNotes(basicData.notes || '')
    }
  }, [scheduledBox.data])

  // 同時更新排程和箱子預設內容
  const saveContent = async (basicData: BasicData) => {
    // 更新排程
    await updateScheduledBox(scheduledBox.id, { data: basicData as unknown as Record<string, unknown> })
    // 更新箱子預設內容（下次新增排程會自動帶入）
    await updateBox(box.id, { default_content: basicData as unknown as Record<string, unknown> })
  }

  const handleSaveNotes = async () => {
    const basicData: BasicData = {
      notes,
      lastUpdated: new Date().toISOString(),
    }
    await saveContent(basicData)
    void alert('筆記已儲存', 'success')
  }

  const handleComplete = async () => {
    if (!scheduledBox.completed) {
      // 完成時也保存筆記
      const basicData: BasicData = {
        notes,
        lastUpdated: new Date().toISOString(),
      }
      await saveContent(basicData)
      await updateScheduledBox(scheduledBox.id, { completed: true })
    }
    onClose()
  }

  const handleSaveEdit = async () => {
    await updateScheduledBox(scheduledBox.id, {
      start_time: editStartTime + ':00',
      duration: editDuration,
    })
    setIsEditing(false)
    void alert('時間已更新', 'success')
  }

  const getLastUpdated = () => {
    if (scheduledBox.data) {
      const basicData = scheduledBox.data as unknown as BasicData
      if (basicData.lastUpdated) {
        return new Date(basicData.lastUpdated).toLocaleString('zh-TW')
      }
    }
    return null
  }

  // 生成時間選項 (06:00 - 23:30)
  const timeOptions = []
  for (let hour = 6; hour < 24; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`)
    timeOptions.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  // 生成持續時間選項
  const durationOptions = [30, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480]

  const handleDelete = async () => {
    const confirmMessage = `確定要移除此排程嗎？\n\n箱子：${box.name}\n時間：${formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}`

    const confirmed = await confirm(confirmMessage, {
      title: '移除排程',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    await deleteScheduledBox(scheduledBox.id)
    onClose()
  }

  const formatDateTime = (dayOfWeek: number, startTime: string) => {
    return `${weekDayNames[dayOfWeek]} ${startTime.substring(0, 5)}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}小時 ${mins}分鐘` : `${hours}小時`
    }
    return `${minutes}分鐘`
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {box.name} - {formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本資訊 / 編輯表單 */}
          {isEditing ? (
            <div className="bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-morandi-gold">
                <Edit2 className="h-4 w-4" />
                編輯時間
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-morandi-primary mb-1">開始時間</label>
                  <Select value={editStartTime} onValueChange={setEditStartTime}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-morandi-primary mb-1">持續時間</label>
                  <Select value={editDuration.toString()} onValueChange={(v) => setEditDuration(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(d => (
                        <SelectItem key={d} value={d.toString()}>{formatDuration(d)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(false)}>
                  <X size={14} />
                  取消
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1">
                  <Save className="h-3 w-3" />
                  儲存
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-morandi-secondary">開始時間：</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{scheduledBox.start_time.substring(0, 5)}</span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-morandi-gold hover:text-morandi-gold-hover"
                      title="編輯時間"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-morandi-secondary">持續時間：</span>
                  <span className="font-medium">{formatDuration(scheduledBox.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-morandi-secondary">狀態：</span>
                  <span className={`font-medium ${scheduledBox.completed ? 'text-status-success' : 'text-morandi-secondary'}`}>
                    {scheduledBox.completed ? '已完成' : '未完成'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 筆記區域 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-morandi-primary mb-2">
              <FileText className="w-4 h-4" />
              筆記內容
            </label>
            <Textarea
              placeholder="記錄今天的想法、進度或備註..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="resize-none"
            />
            {getLastUpdated() && (
              <p className="text-xs text-morandi-secondary mt-1">
                最後更新：{getLastUpdated()}
              </p>
            )}
          </div>

          {/* 按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-status-danger border-morandi-red/30 hover:bg-status-danger-bg gap-1"
            >
              <Trash2 size={16} />
              移除排程
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" className="gap-2" onClick={onClose}>
                <X size={16} />
                取消
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveNotes}
                disabled={!notes.trim()}
                className="gap-1"
              >
                <Save size={16} />
                儲存筆記
              </Button>
              <Button
                onClick={handleComplete}
                disabled={scheduledBox.completed}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
              >
                <Check size={16} />
                {scheduledBox.completed ? '已完成' : '標記完成'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
