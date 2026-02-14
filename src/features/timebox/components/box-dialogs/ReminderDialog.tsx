'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Check, X } from 'lucide-react'
import {
  useTimeboxScheduledBoxes,
  useTimeboxBoxes,
  type TimeboxScheduledBox,
  type TimeboxBox,
  type ReminderData,
  weekDayNames,
} from '../../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'
import { BOX_DIALOGS_LABELS } from './constants/labels'

interface ReminderDialogProps {
  scheduledBox: TimeboxScheduledBox
  box: TimeboxBox
  onClose: () => void
}

export default function ReminderDialog({ scheduledBox, box, onClose }: ReminderDialogProps) {
  const { update: updateScheduledBox, delete: deleteScheduledBox } = useTimeboxScheduledBoxes()
  const { update: updateBox } = useTimeboxBoxes()
  const [text, setText] = useState('')

  // 載入現有資料
  useEffect(() => {
    if (scheduledBox.data) {
      const reminderData = scheduledBox.data as unknown as ReminderData
      setText(reminderData.text || '')
    }
  }, [scheduledBox.data])

  // 同時更新排程和箱子預設內容
  const saveContent = async (reminderData: ReminderData) => {
    // 更新排程
    await updateScheduledBox(scheduledBox.id, { data: reminderData as unknown as Record<string, unknown> })
    // 更新箱子預設內容（下次新增排程會自動帶入）
    await updateBox(box.id, { default_content: reminderData as unknown as Record<string, unknown> })
  }

  const handleUpdate = async () => {
    const reminderData: ReminderData = {
      text,
      lastUpdated: new Date().toISOString(),
    }

    await saveContent(reminderData)
    onClose()
  }

  const handleComplete = async () => {
    if (text.trim()) {
      const reminderData: ReminderData = {
        text,
        lastUpdated: new Date().toISOString(),
      }
      await saveContent(reminderData)
      await updateScheduledBox(scheduledBox.id, { completed: true })
    } else if (!scheduledBox.completed) {
      await updateScheduledBox(scheduledBox.id, { completed: true })
    }
    onClose()
  }

  const handleDelete = async () => {
    const confirmMessage = `確定要移除此提醒排程嗎？\n\n箱子：${box.name}`

    const confirmed = await confirm(confirmMessage, {
      title: '移除提醒排程',
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

  const getLastUpdated = () => {
    if (scheduledBox.data) {
      const reminderData = scheduledBox.data as unknown as ReminderData
      if (reminderData.lastUpdated) {
        return new Date(reminderData.lastUpdated).toLocaleString('zh-TW')
      }
    }
    return null
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent level={1} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {box.name} - {formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 提示內容 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              {BOX_DIALOGS_LABELS.LABEL_9596}
            </label>
            <Textarea
              placeholder={`例如：保濕程序\n1. 卸妝\n2. 洗臉\n3. 化妝水\n4. 精華液\n5. 乳液\n6. 面膜敷30分鐘`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="resize-none"
            />
          </div>

          {/* 最後更新時間 */}
          {getLastUpdated() && (
            <div className="text-sm text-morandi-secondary">
              最後更新：{getLastUpdated()}
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-status-danger border-morandi-red/30 hover:bg-status-danger-bg gap-1"
            >
              <Trash2 size={16} />
              {BOX_DIALOGS_LABELS.LABEL_5077}
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" className="gap-2" onClick={onClose}>
                <X size={16} />
                {BOX_DIALOGS_LABELS.CANCEL}
              </Button>
              <Button variant="outline" onClick={handleUpdate} className="gap-1">
                <Check size={16} />
                {BOX_DIALOGS_LABELS.LABEL_3227}
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
