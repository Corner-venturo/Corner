/**
 * CostTemplateDialog - 新增/編輯價目表項目
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CostTemplate } from '@/types/supplier.types'
import { useCostTemplateStore } from '@/stores'

interface CostTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  supplierId: string
  category: string
  editingTemplate?: CostTemplate | null
}

// 常用單位
const UNITS = [
  { value: '趟', label: '趟' },
  { value: '次', label: '次' },
  { value: '晚', label: '晚' },
  { value: '人', label: '人' },
  { value: '天', label: '天' },
  { value: '車', label: '車' },
  { value: '團', label: '團' },
]

// 常用幣別
const CURRENCIES = [
  { value: 'VND', label: 'VND (越南盾)' },
  { value: 'TWD', label: 'TWD (台幣)' },
  { value: 'USD', label: 'USD (美金)' },
  { value: 'CNY', label: 'CNY (人民幣)' },
  { value: 'JPY', label: 'JPY (日圓)' },
]

export const CostTemplateDialog: React.FC<CostTemplateDialogProps> = ({
  isOpen,
  onClose,
  supplierId,
  category,
  editingTemplate,
}) => {
  const { create, update } = useCostTemplateStore()
  const [formData, setFormData] = useState({
    item_name: '',
    cost_price: '',
    unit: '趟',
    currency: 'VND',
    notes: '',
  })

  const isEditing = !!editingTemplate

  // 編輯時填入資料
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        item_name: editingTemplate.item_name,
        cost_price: String(editingTemplate.cost_price),
        unit: editingTemplate.unit,
        currency: editingTemplate.currency,
        notes: editingTemplate.notes || '',
      })
    } else {
      // 新增時重置
      setFormData({
        item_name: '',
        cost_price: '',
        unit: '趟',
        currency: 'VND',
        notes: '',
      })
    }
  }, [editingTemplate, isOpen])

  const handleSubmit = async () => {
    // 驗證
    if (!formData.item_name.trim()) {
      alert('請輸入項目名稱')
      return
    }
    if (!formData.cost_price || Number(formData.cost_price) <= 0) {
      alert('請輸入有效的單價')
      return
    }

    try {
      if (isEditing && editingTemplate) {
        // 編輯
        await update(editingTemplate.id, {
          item_name: formData.item_name.trim(),
          cost_price: Number(formData.cost_price),
          unit: formData.unit,
          currency: formData.currency,
          notes: formData.notes.trim() || null,
        })
      } else {
        // 新增
        // 取得預設城市 (暫時用第一個，之後可改為選擇)
        await create({
          supplier_id: supplierId,
          city_id: 'default-city', // TODO: 讓用戶選擇城市
          category,
          item_name: formData.item_name.trim(),
          cost_price: Number(formData.cost_price),
          unit: formData.unit,
          currency: formData.currency,
          notes: formData.notes.trim() || null,
          is_active: true,
          display_order: 0,
        })
      }

      onClose()
    } catch (error) {
      console.error('儲存失敗:', error)
      alert('儲存失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '編輯項目' : '新增項目'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 項目名稱 */}
          <div className="space-y-2">
            <Label htmlFor="item_name">
              項目名稱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item_name"
              placeholder="例如：市區飯店 - 會安 (4人車單程)"
              value={formData.item_name}
              onChange={e => setFormData({ ...formData, item_name: e.target.value })}
            />
          </div>

          {/* 單價 + 幣別 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">
                單價 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cost_price"
                type="number"
                placeholder="270000"
                value={formData.cost_price}
                onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">幣別</Label>
              <Select
                value={formData.currency}
                onValueChange={value => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 單位 */}
          <div className="space-y-2">
            <Label htmlFor="unit">
              單位 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.unit}
              onValueChange={value => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map(unit => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 備註 */}
          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              placeholder="例如：含過路費，超時 150,000/小時"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? '儲存' : '新增'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
