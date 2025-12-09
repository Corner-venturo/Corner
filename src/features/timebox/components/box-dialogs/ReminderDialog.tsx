'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import {
  useTimeboxScheduledBoxes,
  type TimeboxScheduledBox,
  type TimeboxBox,
  type ReminderData,
  weekDayNames,
} from '../../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'

interface ReminderDialogProps {
  scheduledBox: TimeboxScheduledBox
  box: TimeboxBox
  onClose: () => void
}

export default function ReminderDialog({ scheduledBox, box, onClose }: ReminderDialogProps) {
  const { update: updateScheduledBox, delete: deleteScheduledBox } = useTimeboxScheduledBoxes()
  const [text, setText] = useState('')

  // 載入現有資料
  useEffect(() => {
    if (scheduledBox.data) {
      const reminderData = scheduledBox.data as ReminderData
      setText(reminderData.text || '')
    }
  }, [scheduledBox.data])

  const handleUpdate = async () => {
    const reminderData: ReminderData = {
      text,
      lastUpdated: new Date().toISOString(),
    }

    await updateScheduledBox(scheduledBox.id, { data: reminderData })
    onClose()
  }

  const handleComplete = async () => {
    if (text.trim()) {
      const reminderData: ReminderData = {
        text,
        lastUpdated: new Date().toISOString(),
      }
      await updateScheduledBox(scheduledBox.id, {
        data: reminderData,
        completed: true,
      })
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
      const reminderData = scheduledBox.data as ReminderData
      if (reminderData.lastUpdated) {
        return new Date(reminderData.lastUpdated).toLocaleString('zh-TW')
      }
    }
    return null
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {box.name} - {formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 提示內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提示內容
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
            <div className="text-sm text-gray-500">
              最後更新：{getLastUpdated()}
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-500 border-red-300 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1" />
              移除排程
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button variant="outline" onClick={handleUpdate}>
                更新內容
              </Button>
              <Button onClick={handleComplete} disabled={scheduledBox.completed}>
                {scheduledBox.completed ? '已完成' : '標記完成'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
