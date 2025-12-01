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
import { Plus } from 'lucide-react'
import { NewItemFormData, categoryOptions } from '../types'
import { SupplierSearchSelect } from './SupplierSearchSelect'

interface SupplierOption {
  id: string
  name: string
  type: 'supplier' | 'employee'
  group: string
}

interface RequestItemFormProps {
  newItem: NewItemFormData
  setNewItem: (item: NewItemFormData | ((prev: NewItemFormData) => NewItemFormData)) => void
  onAddItem: () => void
  suppliers: SupplierOption[]
  supplierSearchValue: string
  setSupplierSearchValue: (value: string) => void
  showSupplierDropdown: boolean
  setShowSupplierDropdown: (show: boolean) => void
}

export function RequestItemForm({
  newItem,
  setNewItem,
  onAddItem,
  suppliers,
  supplierSearchValue,
  setSupplierSearchValue,
  showSupplierDropdown,
  setShowSupplierDropdown,
}: RequestItemFormProps) {
  const subtotal = newItem.unit_price * newItem.quantity

  return (
    <div className="border border-border rounded-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-morandi-primary">新增請款項目</h3>
        <Button
          type="button"
          onClick={onAddItem}
          disabled={!newItem.supplier_id || !newItem.description}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-6 rounded-md"
          size="lg"
        >
          <Plus size={18} className="mr-2" />
          新增項目
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-secondary">類別</label>
          <Select
            value={newItem.category}
            onValueChange={value => setNewItem(prev => ({ ...prev, category: value as NewItemFormData['category'] }))}
          >
            <SelectTrigger className="mt-2 bg-background">
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

        <div className="col-span-3">
          <SupplierSearchSelect
            value={supplierSearchValue}
            onChange={setSupplierSearchValue}
            onSelect={supplier => {
              setNewItem(prev => ({ ...prev, supplier_id: supplier.id }))
              setSupplierSearchValue(supplier.name)
            }}
            suppliers={suppliers}
            showDropdown={showSupplierDropdown}
            onShowDropdown={setShowSupplierDropdown}
            label="供應商"
            placeholder="搜尋供應商或員工..."
          />
        </div>

        <div className="col-span-4">
          <label className="text-sm font-medium text-morandi-secondary">項目描述</label>
          <Input
            value={newItem.description}
            onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                // 只有在不是輸入法組合中時才新增
                if (!e.nativeEvent.isComposing) {
                  onAddItem()
                }
              }
            }}
            placeholder="輸入項目描述"
            className="mt-2"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-secondary">單價</label>
          <Input
            type="text"
            inputMode="numeric"
            value={newItem.unit_price || ''}
            onChange={e => {
              // 全形轉半形並只保留數字
              let value = e.target.value
                .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                .replace(/[^\d]/g, '')
              setNewItem(prev => ({ ...prev, unit_price: value ? Number(value) : 0 }))
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
              }
            }}
            placeholder="0"
            className="mt-2"
          />
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium text-morandi-secondary">數量</label>
          <Input
            type="text"
            inputMode="numeric"
            value={newItem.quantity || ''}
            onChange={e => {
              // 全形轉半形並只保留數字
              let value = e.target.value
                .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                .replace(/[^\d]/g, '')
              setNewItem(prev => ({ ...prev, quantity: value ? Number(value) : 1 }))
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
              }
            }}
            placeholder="1"
            className="mt-2"
          />
        </div>
      </div>

      {/* Subtotal display */}
      <div className="mt-4 flex justify-end">
        <div className="bg-morandi-container/20 rounded-md px-4 py-2">
          <span className="text-sm font-medium text-morandi-secondary mr-2">小計:</span>
          <span className="text-lg font-semibold text-morandi-gold">
            NT$ {subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
