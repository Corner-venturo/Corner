'use client'

import { useState, useEffect } from 'react'
import { useTimeboxStore, ReminderData, ScheduledBox } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface ReminderDialogProps {
  scheduledBox: ScheduledBox
  onClose: () => void
}

export default function ReminderDialog({ scheduledBox, onClose }: ReminderDialogProps) {
  const { boxes, updateReminderData, toggleBoxCompletion, removeScheduledBox } = useTimeboxStore()
  const [text, setText] = useState('')

  const box = boxes.find(b => b.id === scheduledBox.boxId)

  // 載入現有資料
  useEffect(() => {
    if (scheduledBox.data) {
      const reminderData = scheduledBox.data as ReminderData
      setText(reminderData.text || '')
    }
  }, [scheduledBox.data])

  // 更新內容
  const handleUpdate = () => {
    const reminderData: ReminderData = {
      text,
      lastUpdated: new Date()
    }

    updateReminderData(scheduledBox.id, reminderData)
    onClose()
  }

  // 標記完成
  const handleComplete = () => {
    if (text.trim()) {
      handleUpdate()
    }
    if (!scheduledBox.completed) {
      toggleBoxCompletion(scheduledBox.id)
    }
    onClose()
  }

  // 刪除排程
  const handleDelete = () => {
    const confirmMessage = `確定要移除此提醒排程嗎？\n\n箱子：${box?.name}`;

    if (!confirm(confirmMessage)) {
      return;
    }

    removeScheduledBox(scheduledBox.id);
    onClose();
  }

  if (!box) return null

  const formatDateTime = (dayOfWeek: number, start_time: string) => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${days[dayOfWeek]} ${start_time}`
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
            {box.name} - {formatDateTime(scheduledBox.dayOfWeek, scheduledBox.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 提示內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提示內容
            </label>
            <Textarea
              placeholder="例如：保濕程序&#10;1. 卸妝&#10;2. 洗臉&#10;3. 化妝水&#10;4. 精華液&#10;5. 乳液&#10;6. 面膜敷30分鐘"
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
              className="text-morandi-red border-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} className="mr-1" />
              移除排程
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleUpdate}>
                更新內容
              </Button>
              <Button onClick={handleComplete}>
                {scheduledBox.completed ? '已完成' : '標記完成'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}