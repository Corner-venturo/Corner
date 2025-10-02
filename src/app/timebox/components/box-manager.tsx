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
        userId: user?.employeeNumber || 'guest',
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
    <div className="w-full bg-white flex flex-col">
      {/* 標題與新增按鈕 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">我的箱子</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新增箱子
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBox ? '編輯箱子' : '新增箱子'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 箱子名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                {/* 顏色選擇 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setEditingBox(null)
                      setFormData({
                        name: '',
                        type: 'basic',
                        color: morandiColors[0].value,
                      })
                    }}
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
      </div>

      {/* 箱子列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {boxes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            還沒有建立任何箱子
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boxes.map((box) => {
              const Icon = typeIcons[box.type]
              return (
                <div
                  key={box.id}
                  className="group relative p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-move transform hover:scale-105"
                  style={{ borderLeftColor: box.color, borderLeftWidth: '4px' }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      type: 'box',
                      boxId: box.id,
                    }))
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {/* 圖示 */}
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white"
                      style={{ backgroundColor: box.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* 箱子資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {box.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {typeLabels[box.type]}
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(box)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(box.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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