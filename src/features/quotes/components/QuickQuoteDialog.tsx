/**
 * QuickQuoteDialog - 快速報價單表單（簡單收款用）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, X } from 'lucide-react'
import { CurrencyCell } from '@/components/table-cells'

interface QuickQuoteItem {
  id: string
  description: string // 摘要
  quantity: number // 數量
  unit_price: number // 單價
  amount: number // 金額
  notes: string // 備註
}

interface QuickQuoteFormData {
  customer_name: string // 客戶名稱
  contact_phone: string // 聯絡電話
  contact_address: string // 通訊地址
  tour_code: string // 團體編號
  handler_name: string // 承辦業務
  issue_date: string // 開單日期
  items: QuickQuoteItem[] // 收費明細
  received_amount: number | '' // 已收金額
}

interface QuickQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: QuickQuoteFormData
  setFormField: (field: string, value: string | number | QuickQuoteItem[] | ((prev: QuickQuoteFormData) => string | number | QuickQuoteItem[])) => void
  onSubmit: () => Promise<boolean>
  onClose: () => void
}

export const QuickQuoteDialog: React.FC<QuickQuoteDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormField,
  onSubmit,
  onClose,
}) => {
  // 使用 local state 管理 items，避免 stale closure 問題
  const [localItems, setLocalItems] = useState<QuickQuoteItem[]>(formData.items)

  // 當 dialog 開啟時，同步 formData.items 到 local state
  useEffect(() => {
    if (open) {
      setLocalItems(formData.items)
    }
  }, [open, formData.items])

  // 當 localItems 變化時，同步回 parent
  useEffect(() => {
    if (open && localItems !== formData.items) {
      setFormField('items', localItems)
    }
  }, [localItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.customer_name.trim()) {
      // 確保最新的 items 已同步
      setFormField('items', localItems)
      const success = await onSubmit()
      if (success) {
        onClose()
      }
    }
  }

  // 計算應收金額（所有項目的金額總和）
  const totalAmount = localItems.reduce((sum, item) => sum + item.amount, 0)

  // 計算應收餘額
  const balanceAmount = totalAmount - (Number(formData.received_amount) || 0)

  // 新增項目
  const addItem = () => {
    const newItem: QuickQuoteItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      notes: '',
    }
    setLocalItems(prev => [...prev, newItem])
  }

  // 刪除項目
  const removeItem = (id: string) => {
    setLocalItems(prev => prev.filter(item => item.id !== id))
  }

  // 更新項目
  const updateItem = (id: string, field: keyof QuickQuoteItem, value: string | number) => {
    setLocalItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          // 自動計算金額
          if (field === 'quantity' || field === 'unit_price') {
            updated.amount = updated.quantity * updated.unit_price
          }
          return updated
        }
        return item
      })
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增快速報價單</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 客戶資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">客戶名稱 *</label>
              <Input
                value={formData.customer_name}
                onChange={e => setFormField('customer_name', e.target.value)}
                placeholder="輸入客戶姓名"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
              <Input
                value={formData.contact_phone}
                onChange={e => setFormField('contact_phone', e.target.value)}
                placeholder="輸入聯絡電話"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">通訊地址</label>
              <Input
                value={formData.contact_address}
                onChange={e => setFormField('contact_address', e.target.value)}
                placeholder="輸入通訊地址"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">團體編號</label>
              <Input
                value={formData.tour_code}
                onChange={e => setFormField('tour_code', e.target.value)}
                placeholder="輸入團體編號"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">承辦業務</label>
              <Input
                value={formData.handler_name}
                onChange={e => setFormField('handler_name', e.target.value)}
                placeholder="輸入承辦業務"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">開單日期</label>
              <DatePicker
                value={formData.issue_date}
                onChange={(date) => setFormField('issue_date', date || '')}
                placeholder="選擇日期"
                className="mt-1"
              />
            </div>
          </div>

          {/* 收費明細表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-morandi-primary">收費明細表</label>
              <Button type="button" size="sm" onClick={addItem} variant="outline" className="gap-1">
                <Plus size={16} />
                新增項目
              </Button>
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-morandi-container/20">
                  <tr>
                    <th className="px-3 py-2 text-left">摘要</th>
                    <th className="px-3 py-2 text-center w-20">數量</th>
                    <th className="px-3 py-2 text-center w-28">單價</th>
                    <th className="px-3 py-2 text-center w-28">金額</th>
                    <th className="px-3 py-2 text-left w-32">備註</th>
                    <th className="px-3 py-2 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder="項目說明"
                          className="h-8 w-full px-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          autoComplete="off"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="text" inputMode="decimal"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={e => {
                            const val = e.target.value
                            // 允許空值
                            if (val === '' || val === '-') {
                              updateItem(item.id, 'quantity', 0)
                            } else {
                              const num = parseFloat(val)
                              if (!isNaN(num)) {
                                updateItem(item.id, 'quantity', num)
                              }
                            }
                          }}
                          className="h-8 text-center"
                          step="0.01"
                          placeholder=""
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="text" inputMode="decimal"
                          value={item.unit_price === 0 ? '' : item.unit_price}
                          onChange={e => {
                            const val = e.target.value
                            // 允許空值
                            if (val === '' || val === '-') {
                              updateItem(item.id, 'unit_price', 0)
                            } else {
                              const num = parseFloat(val)
                              if (!isNaN(num)) {
                                updateItem(item.id, 'unit_price', num)
                              }
                            }
                          }}
                          className="h-8 text-right"
                          step="0.01"
                          placeholder=""
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <CurrencyCell amount={item.amount} className="font-medium justify-end" />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={e => updateItem(item.id, 'notes', e.target.value)}
                          placeholder="備註"
                          className="h-8 w-full px-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          autoComplete="off"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-morandi-red hover:text-status-danger text-lg"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  {localItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-morandi-secondary">
                        尚無項目，點擊「新增項目」開始
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 金額統計 */}
          <div className="grid grid-cols-3 gap-4 bg-morandi-container/10 p-4 rounded-md">
            <div>
              <label className="text-sm font-medium text-morandi-primary">應收金額</label>
              <CurrencyCell amount={totalAmount} className="mt-1 text-lg font-bold" />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">已收金額</label>
              <Input
                type="text" inputMode="decimal"
                value={formData.received_amount}
                onChange={e => {
                  const value = e.target.value
                  setFormField('received_amount', value === '' ? '' : Number(value))
                }}
                placeholder="0"
                className="mt-1"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">應收餘額</label>
              <CurrencyCell
                amount={balanceAmount}
                variant={balanceAmount > 0 ? 'expense' : 'income'}
                className="mt-1 text-lg font-bold"
              />
            </div>
          </div>

          {/* 動作按鈕 */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.customer_name.trim()}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Plus size={16} />
              建立快速報價單
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
