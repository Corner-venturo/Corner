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
import { Trash2, Plus } from 'lucide-react'
import { RequestItem, categoryOptions } from '../types'
import { SupplierSearchSelect } from './SupplierSearchSelect'
import { useState } from 'react'

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

  // Manage local state for search inputs within each row
  const [localSearch, setLocalSearch] = useState<Record<string, { search: string; show: boolean }>>(
    {}
  )

  const handleLocalSearchChange = (id: string, search: string) => {
    setLocalSearch(prev => ({ ...prev, [id]: { ...prev[id], search } }))
  }

  const handleShowDropdownChange = (id: string, show: boolean) => {
    setLocalSearch(prev => ({ ...prev, [id]: { ...prev[id], show } }))
  }

  const getFilteredSuppliers = (searchValue: string) => {
    if (!searchValue) return suppliers
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(searchValue.toLowerCase()))
  }

  return (
    <div className="border border-border rounded-md p-4">
      <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目</h3>

      {/* Header - 固定不動 */}
      <div className="grid grid-cols-12 gap-4 px-3 text-xs font-medium text-morandi-secondary mb-3">
        <div className="col-span-2">類別</div>
        <div className="col-span-3">供應商</div>
        <div className="col-span-3">項目描述</div>
        <div className="col-span-1 text-right">單價</div>
        <div className="col-span-1 text-center">數量</div>
        <div className="col-span-1 text-right">小計</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items - 固定高度可捲動 */}
      <div className="space-y-3 h-[200px] overflow-y-auto">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
            {/* Category */}
            <div className="col-span-2">
              <Select
                value={item.category}
                onValueChange={value =>
                  updateItem(item.id, { category: value as RequestItem['category'] })
                }
              >
                <SelectTrigger className="bg-background h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
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
              <SupplierSearchSelect
                value={localSearch[item.id]?.search ?? item.supplierName}
                onChange={value => handleLocalSearchChange(item.id, value)}
                onSelect={supplier => {
                  updateItem(item.id, {
                    supplier_id: supplier.id,
                    supplierName: supplier.name,
                  })
                  handleLocalSearchChange(item.id, supplier.name || '')
                  handleShowDropdownChange(item.id, false)
                }}
                suppliers={getFilteredSuppliers(localSearch[item.id]?.search ?? '')}
                showDropdown={localSearch[item.id]?.show ?? false}
                onShowDropdown={show => handleShowDropdownChange(item.id, show)}
                placeholder="搜尋供應商..."
                label=""
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
            <div className="col-span-1 flex items-center h-10 justify-end">
              <span className="text-sm font-semibold text-morandi-gold">
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
        <div className="flex justify-end items-center">
          <span className="text-lg font-semibold text-morandi-primary mr-4">總金額:</span>
          <span className="text-xl font-bold text-morandi-gold">
            NT$ {total_amount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
