'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Dumbbell, MessageSquare, Package, Edit, Trash2 } from 'lucide-react'
import { useTimeboxBoxes, morandiColors, type TimeboxBox } from '../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'

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
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  const { items: boxes, create: createBox, update: updateBox, delete: deleteBox } = useTimeboxBoxes()

  const [editingBox, setEditingBox] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    type: 'basic' as 'workout' | 'reminder' | 'basic',
    color: morandiColors[0].value,
  })

  // 使用者的箱子
  const userBoxes = boxes.filter(b => b.user_id === userId)

  const handleSubmit = async () => {
    if (!formData.name.trim() || !userId) return

    if (editingBox) {
      await updateBox(editingBox, {
        name: formData.name,
        type: formData.type,
        color: formData.color,
      })
      setEditingBox(null)
    } else {
      await createBox({
        name: formData.name,
        type: formData.type,
        color: formData.color,
        user_id: userId,
        default_content: null,
      })
    }

    resetForm()
  }

  const handleEdit = (box: TimeboxBox) => {
    setFormData({
      name: box.name,
      type: (box.type || 'basic') as 'workout' | 'reminder' | 'basic',
      color: box.color || morandiColors[0].value,
    })
    setEditingBox(box.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('確定要刪除這個箱子嗎？', {
      title: '刪除箱子',
      type: 'warning',
    })
    if (confirmed) {
      await deleteBox(id)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingBox(null)
    setFormData({
      name: '',
      type: 'basic',
      color: morandiColors[0].value,
    })
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      {/* 標題與新增按鈕 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-morandi-primary">我的箱子</h2>
          <p className="text-sm text-morandi-secondary">建立箱子模板，用於排程到時間表中</p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold/90 text-white"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            新增箱子
          </Button>
        )}
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-morandi-container/10">
          <h3 className="font-medium mb-4">{editingBox ? '編輯箱子' : '新增箱子'}</h3>
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
              <div className="flex flex-wrap gap-2">
                {morandiColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                className="text-morandi-secondary border-border"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold/90"
              >
                {editingBox ? '更新' : '建立'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 箱子列表 */}
      <div className="flex-1 overflow-y-auto">
        {userBoxes.length === 0 ? (
          <div className="text-center text-morandi-secondary/80 py-16">
            還沒有建立任何箱子
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userBoxes.map((box) => {
              const boxType = (box.type || 'basic') as 'workout' | 'reminder' | 'basic'
              const Icon = typeIcons[boxType] || Package
              return (
                <div
                  key={box.id}
                  className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderLeft: `4px solid ${box.color || '#D4D4D4'}` }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: box.color || '#D4D4D4' }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary truncate">
                      {box.name}
                    </div>
                    <div className="text-sm text-morandi-secondary">
                      {typeLabels[boxType]}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-morandi-secondary hover:text-morandi-primary"
                      onClick={() => handleEdit(box)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-morandi-secondary hover:text-destructive"
                      onClick={() => handleDelete(box.id)}
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
