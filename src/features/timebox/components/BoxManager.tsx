'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Dumbbell, MessageSquare, Package, Trash2, Save, X } from 'lucide-react'
import { useTimeboxBoxes, morandiColors, type TimeboxBox, type ReminderData } from '../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { TIMEBOX_LABELS } from './constants/labels'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

const typeLabels = {
  workout: '重訓',
  reminder: '提醒',
  basic: '一般',
}

export default function BoxManager() {
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes, create: createBox, update: updateBox, delete: deleteBox, isLoading } = useTimeboxBoxes()

  const [selectedBox, setSelectedBox] = useState<TimeboxBox | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    type: 'basic' as 'workout' | 'reminder' | 'basic',
    color: morandiColors[0].value,
    default_duration: 60,
    default_content: '' as string, // 文字提示的預設內容
  })

  // 使用者的箱子
  const userBoxes = boxes.filter(b => b.user_id === userId)

  const openEditDialog = (box: TimeboxBox) => {
    const reminderText = box.type === 'reminder' && box.default_content
      ? (box.default_content as unknown as ReminderData)?.text || ''
      : ''

    setFormData({
      name: box.name,
      type: (box.type || 'basic') as 'workout' | 'reminder' | 'basic',
      color: box.color || morandiColors[0].value,
      default_duration: box.default_duration || 60,
      default_content: reminderText,
    })
    setSelectedBox(box)
    setIsCreating(false)
  }

  const openCreateDialog = () => {
    setFormData({
      name: '',
      type: 'basic',
      color: morandiColors[0].value,
      default_duration: 60,
      default_content: '',
    })
    setSelectedBox(null)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('請填寫名稱')
      return
    }
    if (!userId) {
      alert('請先登入')
      return
    }

    try {
      // 準備 default_content（只有 reminder 類型才需要）
      const defaultContent = formData.type === 'reminder' && formData.default_content.trim()
        ? { text: formData.default_content, lastUpdated: new Date().toISOString() }
        : null

      if (selectedBox) {
        // 編輯模式
        await updateBox(selectedBox.id, {
          name: formData.name,
          type: formData.type,
          color: formData.color,
          default_duration: formData.default_duration,
          default_content: defaultContent as unknown as Record<string, unknown> | null,
        })
      } else {
        // 新增模式
        await createBox({
          name: formData.name,
          type: formData.type,
          color: formData.color,
          default_duration: formData.default_duration,
          user_id: userId,
          default_content: defaultContent as unknown as Record<string, unknown> | null,
        })
      }

      closeDialog()
    } catch (error) {
      logger.error('[BoxManager] 儲存失敗:', error)
      alert(error instanceof Error ? error.message : '儲存失敗，請稍後再試')
    }
  }

  const handleDelete = async () => {
    if (!selectedBox) return

    const confirmed = await confirm(`確定要刪除「${selectedBox.name}」嗎？`, {
      title: '刪除箱子',
      type: 'warning',
    })
    if (confirmed) {
      await deleteBox(selectedBox.id)
      closeDialog()
    }
  }

  const closeDialog = () => {
    setSelectedBox(null)
    setIsCreating(false)
  }

  // 載入中或 user 未準備好
  if (isLoading || !userId) {
    return (
      <div className="text-center text-morandi-secondary py-8">
        {isLoading ? '載入中...' : '請先登入'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 簡潔的箱子列表 */}
      <div className="space-y-1">
        {userBoxes.length === 0 ? (
          <div className="text-center text-morandi-secondary py-8">
            {TIMEBOX_LABELS.NOT_FOUND_5847}
          </div>
        ) : (
          userBoxes.map((box) => {
            const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
            const Icon = typeIcons[boxType] || Package
            return (
              <button
                key={box.id}
                onClick={() => openEditDialog(box)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-morandi-container/30 transition-colors text-left group"
              >
                {/* 顏色圓點 + 圖標 */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: box.color || '#D4D4D4' }}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* 名稱與類型 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-morandi-primary truncate">
                    {box.name}
                  </div>
                  <div className="text-xs text-morandi-secondary">
                    {typeLabels[boxType]} · {(box.default_duration || 60) >= 60 ? `${(box.default_duration || 60) / 60}小時` : `${box.default_duration || 60}分鐘`}
                  </div>
                </div>

                {/* 提示有預設內容 */}
                {boxType === 'reminder' && box.default_content && (
                  <div className="text-xs text-morandi-gold">{TIMEBOX_LABELS.SETTINGS_7373}</div>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* 新增按鈕 */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={openCreateDialog}
      >
        <Plus className="h-4 w-4" />
        {TIMEBOX_LABELS.ADD_7028}
      </Button>

      {/* 編輯/新增對話框 */}
      <Dialog open={!!selectedBox || isCreating} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent level={1} className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBox ? '編輯箱子' : '新增箱子'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 名稱 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                {TIMEBOX_LABELS.NAME}
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={TIMEBOX_LABELS.LABEL_7747}
              />
            </div>

            {/* 類型 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                {TIMEBOX_LABELS.TYPE}
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: 'workout' | 'reminder' | 'basic') =>
                  setFormData({ ...formData, type: value, default_content: value !== 'reminder' ? '' : formData.default_content })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{TIMEBOX_LABELS.LABEL_9487}</SelectItem>
                  <SelectItem value="workout">{TIMEBOX_LABELS.LABEL_3464}</SelectItem>
                  <SelectItem value="reminder">{TIMEBOX_LABELS.LABEL_2802}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 顏色 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                {TIMEBOX_LABELS.LABEL_418}
              </label>
              <div className="flex flex-wrap gap-2">
                {morandiColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      formData.color === c.value
                        ? 'border-morandi-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* 預設時長 */}
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                {TIMEBOX_LABELS.LABEL_6251}
              </label>
              <div className="flex flex-wrap gap-2">
                {[30, 60, 90, 120, 180].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData({ ...formData, default_duration: duration })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      formData.default_duration === duration
                        ? 'bg-morandi-gold text-white'
                        : 'bg-morandi-container/50 text-morandi-secondary hover:bg-morandi-container'
                    }`}
                  >
                    {duration >= 60 ? `${duration / 60}小時` : `${duration}分鐘`}
                  </button>
                ))}
              </div>
            </div>

            {/* 文字提示內容（僅 reminder 類型） */}
            {formData.type === 'reminder' && (
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">
                  {TIMEBOX_LABELS.LABEL_3950}
                </label>
                <Textarea
                  placeholder={`例如：保濕程序\n1. 卸妝\n2. 洗臉\n3. 化妝水...`}
                  value={formData.default_content}
                  onChange={(e) => setFormData({ ...formData, default_content: e.target.value })}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-morandi-secondary mt-1">
                  {TIMEBOX_LABELS.ADD_2897}
                </p>
              </div>
            )}

            {/* 按鈕 */}
            <div className="flex justify-between pt-4 border-t">
              {selectedBox ? (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-status-danger border-morandi-red/30 hover:bg-status-danger-bg gap-1"
                >
                  <Trash2 size={16} />
                  {TIMEBOX_LABELS.DELETE}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog} className="gap-1">
                  <X size={16} />
                  {TIMEBOX_LABELS.CANCEL}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover gap-1"
                >
                  <Save size={16} />
                  {TIMEBOX_LABELS.SAVE}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
