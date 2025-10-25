'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AddEventDialogState, NewEventForm } from '../types'

interface AddEventDialogProps {
  dialog: AddEventDialogState
  newEvent: NewEventForm
  onNewEventChange: (event: NewEventForm) => void
  onSubmit: () => void
  onClose: () => void
}

// 生成15分鐘間隔的時間選項
const generateTimeOptions = () => {
  const options = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push(timeString)
    }
  }
  return options
}

export function AddEventDialog({
  dialog,
  newEvent,
  onNewEventChange,
  onSubmit,
  onClose,
}: AddEventDialogProps) {
  const timeOptions = generateTimeOptions()

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增行事曆事項</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            if (newEvent.title.trim()) {
              onSubmit()
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">開始日期</label>
              <div className="mt-1 p-3 bg-morandi-container/20 rounded-lg">
                <p className="text-base font-semibold text-morandi-primary">
                  {dialog.selectedDate}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">結束日期（選填）</label>
              <Input
                type="date"
                value={newEvent.end_date}
                onChange={e => onNewEventChange({ ...newEvent, end_date: e.target.value })}
                min={dialog.selectedDate}
                className="mt-1"
                placeholder="跨天活動請選擇"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary">標題</label>
            <Input
              value={newEvent.title}
              onChange={e => onNewEventChange({ ...newEvent, title: e.target.value })}
              placeholder="輸入事項標題"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">事件類型</label>
              <select
                value={newEvent.visibility}
                onChange={e => onNewEventChange({ ...newEvent, visibility: e.target.value as 'personal' | 'company' })}
                className="mt-1 w-full p-2 border border-border rounded-md bg-white"
              >
                <option value="personal">個人行事曆</option>
                <option value="company">公司行事曆</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">開始時間（選填）</label>
              <select
                value={newEvent.start_time}
                onChange={e => onNewEventChange({ ...newEvent, start_time: e.target.value })}
                className="mt-1 w-full p-2 border border-border rounded-md bg-white"
              >
                <option value="">不指定時間</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 如果有結束日期，顯示結束時間 */}
          {newEvent.end_date && (
            <div>
              <label className="text-sm font-medium text-morandi-primary">結束時間（選填）</label>
              <select
                value={newEvent.end_time}
                onChange={e => onNewEventChange({ ...newEvent, end_time: e.target.value })}
                className="mt-1 w-full p-2 border border-border rounded-md bg-white"
              >
                <option value="">不指定時間</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-morandi-primary">說明（選填）</label>
            <Input
              value={newEvent.description}
              onChange={e => onNewEventChange({ ...newEvent, description: e.target.value })}
              placeholder="輸入說明"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!newEvent.title.trim()}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
