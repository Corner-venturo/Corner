'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { useTimeboxScheduledBoxes, type TimeboxScheduledBox, type TimeboxBox, weekDayNames } from '../../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'

interface BasicDialogProps {
  scheduledBox: TimeboxScheduledBox
  box: TimeboxBox
  onClose: () => void
}

export default function BasicDialog({ scheduledBox, box, onClose }: BasicDialogProps) {
  const { update: updateScheduledBox, delete: deleteScheduledBox } = useTimeboxScheduledBoxes()

  const handleComplete = async () => {
    if (!scheduledBox.completed) {
      await updateScheduledBox(scheduledBox.id, { completed: true })
    }
    onClose()
  }

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
          {/* 基本資訊 */}
          <div className="bg-muted rounded-lg p-4">
            <div className="space-y-2">
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

          {/* 按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-status-danger border-morandi-red/30 hover:bg-status-danger-bg"
            >
              <Trash2 size={16} className="mr-1" />
              移除排程
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                取消
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
