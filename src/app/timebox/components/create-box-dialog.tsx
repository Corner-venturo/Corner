'use client'

import { useState } from 'react'
import { useTimeboxStore, morandiColors } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ColorPicker from '@/components/ui/color-picker'

interface CreateBoxDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateBoxDialog({ isOpen, onClose }: CreateBoxDialogProps) {
  const { createBox } = useTimeboxStore()
  const [formData, setFormData] = useState({
    name: '',
    type: 'workout' as 'workout' | 'reminder',
    color: morandiColors[0].value,
  })

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    createBox({
      name: formData.name,
      type: formData.type,
      color: formData.color,
      user_id: 'current-user', // TODO: 實際用戶ID
    })

    setFormData({
      name: '',
      type: 'workout',
      color: morandiColors[0].value,
    })
    onClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'workout',
      color: morandiColors[0].value,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增箱子</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 箱子名稱 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              箱子名稱 *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="請輸入箱子名稱"
            />
          </div>

          {/* 箱子類型 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              箱子類型
            </label>
            <Select
              value={formData.type}
              onValueChange={(value: 'workout' | 'reminder') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workout">重訓箱子</SelectItem>
                <SelectItem value="reminder">文字提示箱子</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 顏色選擇 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              顏色選擇
            </label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="text-morandi-secondary hover:text-morandi-primary border-border hover:border-morandi-gold/20"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              建立
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}