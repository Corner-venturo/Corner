'use client'

import { useState } from 'react'
import { useTimeboxStore } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Dumbbell, MessageSquare, Package } from 'lucide-react'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

const typeLabels = {
  workout: '重訓箱子',
  reminder: '文字提示箱子',
  basic: '普通箱子',
}

interface BoxSelectorProps {
  onSelect: (boxId: string, duration: number) => void
  onClose: () => void
  timeInterval: 30 | 60
}

export default function BoxSelector({ onSelect, onClose, timeInterval }: BoxSelectorProps) {
  const { boxes } = useTimeboxStore()
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [duration, setDuration] = useState(timeInterval)


  // 生成持續時間選項（30分鐘的倍數）
  const durationOptions = []
  for (let i = timeInterval; i <= 480; i += timeInterval) { // 最多8小時
    durationOptions.push(i)
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}小時 ${mins}分鐘` : `${hours}小時`
    }
    return `${minutes}分鐘`
  }

  const handleConfirm = () => {
    if (selectedBox) {
      onSelect(selectedBox, duration)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>選擇箱子</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 箱子選擇 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              選擇箱子
            </label>
            {boxes.length === 0 ? (
              <div className="text-center text-morandi-secondary py-4">
                <div className="mb-3">還沒有建立任何箱子</div>
                <Button
                  onClick={() => {
                    onClose()
                    // 觸發建立箱子對話框
                    const createButton = document.querySelector('[data-create-box]') as HTMLButtonElement
                    if (createButton) {
                      createButton.click()
                    }
                  }}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  立即建立箱子
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {boxes.map((box) => {
                  const Icon = typeIcons[box.type]
                  return (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => setSelectedBox(box.id)}
                      className={`w-full rounded-lg border text-left transition-colors px-3 py-2 ${
                        selectedBox === box.id
                          ? 'border-morandi-gold/60 bg-morandi-gold/10'
                          : 'border-border hover:border-morandi-gold/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white"
                          style={{ backgroundColor: box.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-morandi-primary">{box.name}</div>
                          <div className="text-sm text-morandi-secondary">{typeLabels[box.type]}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 持續時間選擇 */}
          {selectedBox && (
            <div>
              <label className="block text-sm font-medium text-morandi-secondary mb-2">
                持續時間
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.slice(0, 12).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDuration(option as 30 | 60)}
                    className={`p-2 text-sm rounded border transition-colors ${
                      duration === option
                        ? 'border-morandi-gold/60 bg-morandi-gold/10 text-morandi-primary'
                        : 'border-border hover:border-morandi-gold/40'
                    }`}
                  >
                    {formatDuration(option)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="text-morandi-secondary border-border">
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedBox}
            >
              確認
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}