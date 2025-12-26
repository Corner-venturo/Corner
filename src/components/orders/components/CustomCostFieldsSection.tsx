/**
 * CustomCostFieldsSection - 自訂費用欄位區域
 * 團體模式使用，管理自訂費用項目
 */

'use client'

import React, { useState } from 'react'
import { Coins, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CustomCostField } from '../order-member.types'

interface CustomCostFieldsSectionProps {
  fields: CustomCostField[]
  onAddField: (name: string) => void
  onRemoveField: (fieldId: string) => void
}

export function CustomCostFieldsSection({
  fields,
  onAddField,
  onRemoveField,
}: CustomCostFieldsSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')

  const handleAdd = () => {
    if (newFieldName.trim()) {
      onAddField(newFieldName.trim())
      setNewFieldName('')
      setShowAddDialog(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-morandi-gold" />
        <span className="text-sm font-medium text-morandi-primary">
          自訂費用欄位 ({fields.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="ml-auto"
        >
          <Plus size={14} className="mr-1" />
          新增欄位
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded border border-emerald-200"
            >
              <span className="flex-1 text-sm text-morandi-primary">
                {field.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveField(field.id)}
                className="text-status-danger hover:text-status-danger"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 新增欄位對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增自訂費用欄位</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="輸入欄位名稱（例如：簽證費、小費）"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAdd} disabled={!newFieldName.trim()}>
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
