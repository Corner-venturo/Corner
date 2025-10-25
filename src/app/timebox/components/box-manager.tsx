'use client'

import { useState } from 'react'
import { useTimeboxStore, morandiColors } from '@/stores/timebox-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ColorPicker from '@/components/ui/color-picker'
import { Plus, Dumbbell, MessageSquare, Package, Edit, Trash2 } from 'lucide-react'

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

export default function BoxManager() {
  const { boxes, createBox, updateBox, deleteBox } = useTimeboxStore()
  const { user } = useAuthStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBox, setEditingBox] = useState<string | null>(null)

  // 新增/編輯表單狀態
  const [formData, setFormData] = useState({
    name: '',
    type: 'basic' as 'workout' | 'reminder' | 'basic',
    color: morandiColors[0].value,
  })

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingBox) {
      updateBox(editingBox, {
        name: formData.name,
        type: formData.type,
        color: formData.color,
      })
      setEditingBox(null)
    } else {
      createBox({
        name: formData.name,
        type: formData.type,
        color: formData.color,
        user_id: user?.employee_number || 'guest',
      })
    }

    setFormData({
      name: '',
      type: 'basic',
      color: morandiColors[0].value,
    })
    setIsCreateDialogOpen(false)
  }

  const handleEdit = (box: any) => {
    setFormData({
      name: box.name,
      type: box.type,
      color: box.color,
    })
    setEditingBox(box.id)
    setIsCreateDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個箱子嗎？')) {
      deleteBox(id)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-morandi-primary">我的箱子</h2>
          <p className="text-sm text-morandi-secondary">調整順序或拖曳到時間表中</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              <Plus className="h-4 w-4 mr-2" />
              新增箱子
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBox ? '編輯箱子' : '新增箱子'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-morandi-secondary mb-2">
                  箱子名稱 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="請輸入箱子名稱"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-secondary mb-2">
                  箱子類型
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'workout' | 'reminder' | 'basic') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">普通箱子</SelectItem>
                    <SelectItem value="workout">重訓箱子</SelectItem>
                    <SelectItem value="reminder">文字提示箱子</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-morandi-secondary mb-2">
                  顏色選擇
                </label>
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setEditingBox(null)
                    setFormData({
                      name: '',
                      type: 'basic',
                      color: morandiColors[0].value,
                    })
                  }}
                  className="text-morandi-secondary border-border"
                >
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                  {editingBox ? '更新' : '建立'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto">
        {boxes.length === 0 ? (
          <div className="text-center text-morandi-secondary/80 py-16">
            還沒有建立任何箱子
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boxes.map((box) => {
              const Icon = typeIcons[box.type]
              return (
                <div
                  key={box.id}
                  className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderLeft: `4px solid ${box.color}` }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'box',
                      boxId: box.id,
                    }))
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: box.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary truncate">
                      {box.name}
                    </div>
                    <div className="text-sm text-morandi-secondary">
                      {typeLabels[box.type]}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-morandi-secondary hover:text-morandi-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(box)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-morandi-secondary hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(box.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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