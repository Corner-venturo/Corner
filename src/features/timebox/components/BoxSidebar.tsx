'use client'

import { useState } from 'react'
import { Plus, Dumbbell, MessageSquare, Package, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { useTimeboxBoxes, morandiColors, type TimeboxBox } from '../hooks/useTimeboxData'
import { cn } from '@/lib/utils'

const typeIcons = {
  workout: Dumbbell,
  reminder: MessageSquare,
  basic: Package,
}

interface BoxSidebarProps {
  onManageClick: () => void
}

export default function BoxSidebar({ onManageClick }: BoxSidebarProps) {
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes, create: createBox, error } = useTimeboxBoxes()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newBoxName, setNewBoxName] = useState('')
  const [newBoxColor, setNewBoxColor] = useState(morandiColors[0].value)

  const userBoxes = boxes.filter(b => b.user_id === userId)

  const handleQuickAdd = async () => {
    if (!userId) {
      alert('請先登入')
      return
    }
    if (!newBoxName.trim()) {
      alert('請填寫箱子名稱')
      return
    }

    try {
      await createBox({
        user_id: userId,
        name: newBoxName.trim(),
        color: newBoxColor,
        type: 'basic',
        default_content: null,
      })

      setNewBoxName('')
      setNewBoxColor(morandiColors[0].value)
      setShowQuickAdd(false)
    } catch (error) {
      console.error('[BoxSidebar] 新增箱子失敗:', error)
      alert(error instanceof Error ? error.message : '新增失敗，請稍後再試')
    }
  }

  return (
    <div className="w-64 border-l border-border bg-morandi-bg/30 flex flex-col">
      {/* 標題 */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-morandi-primary">我的箱子</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onManageClick}
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* 快速新增 */}
      <div className="p-3 border-b border-border">
        {showQuickAdd ? (
          <div className="space-y-2">
            <Input
              value={newBoxName}
              onChange={e => setNewBoxName(e.target.value)}
              placeholder="箱子名稱..."
              className="h-9"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleQuickAdd()
                if (e.key === 'Escape') setShowQuickAdd(false)
              }}
            />
            <div className="flex gap-1 flex-wrap">
              {morandiColors.slice(0, 6).map(c => (
                <button
                  key={c.value}
                  onClick={() => setNewBoxColor(c.value)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    newBoxColor === c.value ? 'border-morandi-primary scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 bg-morandi-gold hover:bg-morandi-gold-hover"
                onClick={handleQuickAdd}
                disabled={!newBoxName.trim()}
              >
                建立
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setShowQuickAdd(false)}
              >
                取消
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-9"
            onClick={() => setShowQuickAdd(true)}
          >
            <Plus className="h-4 w-4" />
            快速新增箱子
          </Button>
        )}
      </div>

      {/* 箱子列表 */}
      <div className="flex-1 overflow-auto p-2">
        {error ? (
          <div className="text-center py-8 text-status-danger text-sm">
            <p>載入箱子失敗</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        ) : userBoxes.length === 0 ? (
          <div className="text-center py-8 text-morandi-secondary text-sm">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>還沒有箱子</p>
            <p className="text-xs mt-1">點擊上方新增</p>
          </div>
        ) : (
          <div className="space-y-1">
            {userBoxes.map(box => {
              const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
              const Icon = typeIcons[boxType] || Package
              const typeLabel = boxType === 'workout' ? '重訓' : boxType === 'reminder' ? '提醒' : '一般'
              return (
                <div
                  key={box.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/60 cursor-grab transition-colors group border border-transparent hover:border-border/50"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'box',
                      boxId: box.id,
                    }))
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: box.color || '#D4D4D4' }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-morandi-primary truncate">
                      {box.name}
                    </div>
                    <div className="text-xs text-morandi-secondary">
                      {typeLabel}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
