'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'

interface AddFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (fieldName: string) => boolean
}

export function AddFieldDialog({ open, onOpenChange, onAdd }: AddFieldDialogProps) {
  const [fieldName, setFieldName] = useState('')

  const handleAdd = () => {
    const success = onAdd(fieldName)
    if (success) {
      setFieldName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增自訂欄位</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              欄位名稱
            </label>
            <Input
              value={fieldName}
              onChange={e => setFieldName(e.target.value)}
              placeholder="例如：分車、分房、分桌"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAdd()
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => {
                onOpenChange(false)
                setFieldName('')
              }}
            >
              <X size={16} />
              取消
            </Button>
            <Button onClick={handleAdd} className="gap-1">
              <Plus size={16} />
              新增欄位
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
