'use client'

import { useTimeboxStore, ScheduledBox } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

interface BasicDialogProps {
  scheduledBox: ScheduledBox
  onClose: () => void
}

export default function BasicDialog({ scheduledBox, onClose }: BasicDialogProps) {
  const { boxes, toggleBoxCompletion, removeScheduledBox } = useTimeboxStore()
  const { confirm, confirmDialogProps } = useConfirmDialog()

  const box = boxes.find(b => b.id === scheduledBox.box_id)

  // 標記完成
  const handleComplete = () => {
    if (!scheduledBox.completed) {
      toggleBoxCompletion(scheduledBox.id)
    }
    onClose()
  }

  // 刪除排程
  const handleDelete = async () => {
    const confirmed = await confirm({
      type: 'warning',
      title: '移除排程',
      message: '確定要移除此排程嗎？',
      details: [
        `箱子：${box?.name}`,
        `時間：${formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}`,
      ],
      confirmLabel: '確認移除',
      cancelLabel: '取消',
    })

    if (!confirmed) {
      return
    }

    removeScheduledBox(scheduledBox.id)
    onClose()
  }

  if (!box) return null

  const formatDateTime = (dayOfWeek: number, start_time: string) => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${days[dayOfWeek]} ${start_time}`
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
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {box.name} - {formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本資訊 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">持續時間：</span>
                <span className="font-medium">{formatDuration(scheduledBox.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">狀態：</span>
                <span
                  className={`font-medium ${scheduledBox.completed ? 'text-green-600' : 'text-gray-600'}`}
                >
                  {scheduledBox.completed ? '已完成' : '未完成'}
                </span>
              </div>
              {scheduledBox.completed && scheduledBox.completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">完成時間：</span>
                  <span className="text-sm">
                    {new Date(scheduledBox.completed_at).toLocaleString('zh-TW')}
                  </span>
                </div>
              )}
            </div>
          </div>

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
              <Button onClick={handleComplete}>
                {scheduledBox.completed ? '已完成' : '標記完成'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <ConfirmDialog {...confirmDialogProps} />
    </Dialog>
  )
}
