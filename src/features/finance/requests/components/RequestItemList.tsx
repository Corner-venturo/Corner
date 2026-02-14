'use client'

import { Button } from '@/components/ui/button'
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
import { CurrencyCell } from '@/components/table-cells'
import { REQUEST_DETAIL_DIALOG_LABELS, REQUEST_ITEM_LIST_LABELS } from '../../constants/labels';

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

// 每列高度約 48px，固定顯示 4 列
const ROW_HEIGHT = 48
const VISIBLE_ROWS = 4
const TABLE_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS

export function EditableRequestItemList({
  items,
  suppliers,
  updateItem,
  removeItem,
  addNewEmptyItem,
}: EditableRequestItemListProps) {
  const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  const supplierOptions = suppliers.map(s => ({
    value: s.id,
    label: s.name || REQUEST_DETAIL_DIALOG_LABELS.未命名,
  }))

  // 無 focus 樣式的 input class（使用 globals.css 的 input-no-focus）
  const inputClass = 'input-no-focus w-full h-9 px-1 bg-transparent text-sm'

  return (
    <div>
      <h3 className="text-sm font-medium text-morandi-primary mb-3">{REQUEST_ITEM_LIST_LABELS.LABEL_475}</h3>

      {/* 表頭 */}
      <div className="border-b border-morandi-container/60">
        <div className="grid grid-cols-[80px_1fr_1fr_96px_64px_112px_48px] px-2 py-2.5">
          <span className="text-xs font-medium text-morandi-secondary">{REQUEST_ITEM_LIST_LABELS.LABEL_2946}</span>
          <span className="text-xs font-medium text-morandi-secondary">{REQUEST_ITEM_LIST_LABELS.LABEL_561}</span>
          <span className="text-xs font-medium text-morandi-secondary">{REQUEST_ITEM_LIST_LABELS.LABEL_6008}</span>
          <span className="text-xs font-medium text-morandi-secondary text-right">{REQUEST_ITEM_LIST_LABELS.LABEL_9413}</span>
          <span className="text-xs font-medium text-morandi-secondary text-center">{REQUEST_ITEM_LIST_LABELS.QUANTITY}</span>
          <span className="text-xs font-medium text-morandi-secondary text-right">{REQUEST_ITEM_LIST_LABELS.LABEL_832}</span>
          <span></span>
        </div>
      </div>

      {/* 項目區域 - 最小 4 列高度，超過則可滾動 */}
      <div
        className="overflow-visible"
        style={{ minHeight: `${TABLE_HEIGHT}px`, maxHeight: `${TABLE_HEIGHT * 1.5}px`, overflowY: items.length > VISIBLE_ROWS ? 'auto' : 'visible' }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`grid grid-cols-[80px_1fr_1fr_96px_64px_112px_48px] px-2 py-1.5 border-b border-morandi-container/30 items-center ${index === 0 ? 'bg-card' : 'hover:bg-morandi-container/5'}`}
          >
            {/* Category */}
            <div>
              <Select
                value={item.category}
                onValueChange={value =>
                  updateItem(item.id, { category: value as RequestItem['category'] })
                }
              >
                <SelectTrigger
                  className="input-no-focus h-9 border-0 shadow-none bg-transparent text-sm px-1"
                >
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
            <div>
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
                placeholder={REQUEST_ITEM_LIST_LABELS.選擇供應商}
                className="input-no-focus [&_input]:h-9 [&_input]:px-1 [&_input]:bg-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <input
                type="text"
                value={item.description}
                onChange={e => updateItem(item.id, { description: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Unit Price */}
            <div>
              <input
                type="number"
                value={item.unit_price || ''}
                onChange={e =>
                  updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className={`${inputClass} text-right placeholder:text-morandi-muted`}
              />
            </div>

            {/* Quantity */}
            <div>
              <input
                type="number"
                value={item.quantity || ''}
                onChange={e =>
                  updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                }
                placeholder="1"
                className={`${inputClass} text-center placeholder:text-morandi-muted`}
              />
            </div>

            {/* Subtotal */}
            <div className="text-right pr-2">
              <CurrencyCell amount={item.unit_price * item.quantity} className="text-morandi-gold" />
            </div>

            {/* Actions */}
            <div className="text-center">
              {index === 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addNewEmptyItem}
                  className="h-8 w-8 text-morandi-gold hover:bg-morandi-gold/10"
                  title={REQUEST_ITEM_LIST_LABELS.新增項目}
                >
                  <Plus size={16} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-8 w-8 text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10"
                  title={REQUEST_DETAIL_DIALOG_LABELS.刪除項目}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* 空白佔位列，確保始終顯示 4 列高度 */}
        {items.length < VISIBLE_ROWS &&
          Array.from({ length: VISIBLE_ROWS - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="grid grid-cols-[80px_1fr_1fr_96px_64px_112px_48px] px-2 py-1.5 border-b border-morandi-container/30 items-center"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ))
        }
      </div>

      {/* Total */}
      <div className="flex justify-end items-center gap-6 pt-4 mt-2">
        <span className="text-sm text-morandi-secondary">{REQUEST_ITEM_LIST_LABELS.TOTAL_6550}</span>
        <CurrencyCell amount={total_amount} className="text-lg font-semibold text-morandi-gold" />
      </div>
    </div>
  )
}
