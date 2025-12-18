'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Trash2, Plus } from 'lucide-react'
import { RequestItem, categoryOptions } from '../types'

interface SupplierOption {
  id: string
  name: string | null
  type: 'supplier' | 'employee'
  group: string
}

interface EditableRequestItemListProps {
  items: RequestItem[]
  suppliers: SupplierOption[]
  updateItem: (itemId: string, updatedFields: Partial<RequestItem>) => void
  removeItem: (itemId: string) => void
  addNewEmptyItem: () => void
}

export function EditableRequestItemList({
  items,
  suppliers,
  updateItem,
  removeItem,
  addNewEmptyItem,
}: EditableRequestItemListProps) {
  const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  // 將供應商轉換成 Combobox 的選項格式
  const supplierOptions = suppliers.map(s => ({
    value: s.id,
    label: s.name || '未命名',
  }))

  return (
    <div className="border border-border rounded-md p-4">
      <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目</h3>

      {/* Header - 固定不動 */}
      <div className="grid grid-cols-12 gap-4 px-3 text-xs font-medium text-morandi-secondary mb-3">
        <div className="col-span-1">類別</div>
        <div className="col-span-3">供應商</div>
        <div className="col-span-3">項目描述</div>
        <div className="col-span-1 text-right">單價</div>
        <div className="col-span-1 text-center">數量</div>
        <div className="col-span-2 text-right">小計</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items - 固定高度可捲動 */}
      <div className="space-y-3 h-[200px] overflow-y-auto">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
            {/* Category */}
            <div className="col-span-1">
              <Select
                value={item.category}
                onValueChange={value =>
                  updateItem(item.id, { category: value as RequestItem['category'] })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="col-span-3">
              <Combobox
                options={supplierOptions}
                value={item.supplier_id}
                onChange={value => {
                  const supplier = suppliers.find(s => s.id === value)
                  updateItem(item.id, {
                    supplier_id: value,
                    supplierName: supplier?.name || '',
                  })
                }}
                placeholder="選擇供應商..."
              />
            </div>

            {/* Description */}
            <div className="col-span-3">
              <Input
                value={item.description}
                onChange={e => updateItem(item.id, { description: e.target.value })}
                placeholder="輸入項目描述"
                className="h-10"
              />
            </div>

            {/* Unit Price */}
            <div className="col-span-1">
              <Input
                type="number"
                value={item.unit_price}
                onChange={e =>
                  updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="h-10 text-right"
              />
            </div>

            {/* Quantity */}
            <div className="col-span-1">
              <Input
                type="number"
                value={item.quantity}
                onChange={e =>
                  updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                }
                placeholder="1"
                className="h-10 text-center"
              />
            </div>

            {/* Subtotal */}
            <div className="col-span-2 flex items-center h-10 justify-end">
              <span className="text-sm font-semibold text-morandi-gold whitespace-nowrap">
                NT$ {(item.unit_price * item.quantity).toLocaleString()}
              </span>
            </div>
            
            {/* Actions */}
            <div className="col-span-1 flex items-center h-10 justify-center gap-1">
              {/* 第一項不能刪除，顯示新增按鈕；其他項顯示刪除按鈕 */}
              {index === 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addNewEmptyItem}
                  className="text-morandi-gold hover:bg-morandi-gold/10"
                  title="新增項目"
                >
                  <Plus size={16} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-morandi-red hover:bg-morandi-red/10"
                  title="刪除項目"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-12 gap-4 px-3">
          <div className="col-span-9 flex justify-end items-center">
            <span className="text-lg font-semibold text-morandi-primary">總金額:</span>
          </div>
          <div className="col-span-2 flex justify-end items-center">
            <span className="text-xl font-bold text-morandi-gold whitespace-nowrap">
              NT$ {total_amount.toLocaleString()}
            </span>
          </div>
          <div className="col-span-1"></div>
        </div>
      </div>
    </div>
  )
}
