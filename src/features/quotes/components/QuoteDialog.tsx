/**
 * QuoteDialog - Form dialog for adding/editing quotes
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tour } from '@/types/tour.types'

interface QuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    status: 'proposed' | 'approved'
    group_size: number | ''
    tour_id: string | null
    is_pinned: boolean
    code: string
  }
  setFormField: (field: string, value: string | number | boolean | null) => void
  tours: Tour[]
  onSubmit: () => Promise<boolean>
  onClose: () => void
}

export const QuoteDialog: React.FC<QuoteDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormField,
  tours,
  onSubmit,
  onClose,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      const success = await onSubmit()
      if (success) {
        onClose()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (
            target.closest('[role="listbox"]') ||
            target.closest('[data-radix-select-viewport]') ||
            target.closest('[cmdk-root]')
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>新增報價單</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 選擇是否關聯旅遊團 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">關聯旅遊團（選填）</label>
            <Combobox
              options={[
                { value: '', label: '獨立報價單（無旅遊團）' },
                ...tours
                  .filter(t => !t._deleted)
                  .map(tour => ({
                    value: tour.id,
                    label: `${tour.code} - ${tour.name}`,
                    data: tour,
                  })),
              ]}
              value={formData.tour_id || ''}
              onChange={value => {
                if (!value) {
                  setFormField('tour_id', null)
                  setFormField('accommodation_days', 0)
                } else {
                  const tour = tours.find(t => t.id === value)
                  if (tour) {
                    setFormField('tour_id', value)
                    setFormField('name', tour.name)
                    setFormField('group_size', tour.max_participants || 1)

                    // 計算住宿天數
                    let accommodationDays = 0
                    if (tour.departure_date && tour.return_date) {
                      const startDate = new Date(tour.departure_date)
                      const endDate = new Date(tour.return_date)
                      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      accommodationDays = Math.max(0, totalDays - 1)
                    }
                    setFormField('accommodation_days', accommodationDays)
                  }
                }
              }}
              placeholder="搜尋或選擇旅遊團..."
              emptyMessage="找不到旅遊團"
              className="mt-1"
            />
            <p className="text-xs text-morandi-secondary mt-1">
              選擇旅遊團後，報價單編號將使用團號
            </p>
          </div>

          {/* 團體名稱 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">團體名稱</label>
            <Input
              value={formData.name}
              onChange={e => setFormField('name', e.target.value)}
              placeholder="輸入團體名稱"
              className="mt-1"
            />
          </div>

          {/* 人數 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">人數</label>
            <Input
              type="text" inputMode="decimal"
              value={formData.group_size}
              onChange={e => {
                const value = e.target.value
                setFormField('group_size', value === '' ? '' : Number(value))
              }}
              placeholder="1"
              className="mt-1"
              min="1"
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">狀態</label>
            <Select value={formData.status} onValueChange={value => setFormField('status', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">提案</SelectItem>
                <SelectItem value="approved">已核准</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 置頂選項 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={e => setFormField('is_pinned', e.target.checked)}
                className="h-4 w-4 rounded border-morandi-border text-morandi-gold focus:ring-morandi-gold"
              />
              <label htmlFor="is_pinned" className="text-sm text-morandi-primary cursor-pointer">
                設為置頂範本（方便複製使用）
              </label>
            </div>

            {formData.is_pinned && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">商品編號（選填）</label>
                <Input
                  value={formData.code}
                  onChange={e => setFormField('code', e.target.value)}
                  placeholder="例如：JP-BASIC, EU-LUXURY"
                  className="mt-1"
                />
                <p className="text-xs text-morandi-secondary mt-1">不填寫則自動生成 Q 開頭的編號</p>
              </div>
            )}
          </div>

          {/* 動作按鈕 */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.group_size || formData.group_size < 1}
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
