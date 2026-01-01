/**
 * 收款單進階搜尋對話框
 *
 * 功能：
 * 1. 收款單號搜尋
 * 2. 訂單編號搜尋
 * 3. 收款日期範圍
 * 4. 收款方式多選
 * 5. 收款狀態多選
 * 6. 搜尋結果限制數量
 */

'use client'

import { useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { formatDateForInput } from '@/lib/utils'
import { ReceiptType, ReceiptStatus, getReceiptTypeName, getReceiptStatusName } from '@/types/receipt.types'

export interface ReceiptSearchFilters {
  receiptNumber?: string
  orderNumber?: string
  dateFrom?: string
  dateTo?: string
  receiptTypes?: ReceiptType[]
  statuses?: string[]  // '0'=待確認, '1'=已確認
  limit?: number
}

interface ReceiptSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (filters: ReceiptSearchFilters) => void
  currentFilters?: ReceiptSearchFilters
}

export function ReceiptSearchDialog({
  isOpen,
  onClose,
  onSearch,
  currentFilters,
}: ReceiptSearchDialogProps) {
  const [filters, setFilters] = useState<ReceiptSearchFilters>(
    currentFilters || {
      receiptNumber: '',
      orderNumber: '',
      dateFrom: '',
      dateTo: '',
      receiptTypes: [],
      statuses: [],
      limit: 200,
    }
  )

  // 收款方式選項
  const receiptTypeOptions: { value: ReceiptType; label: string }[] = [
    { value: 0, label: getReceiptTypeName(0) },
    { value: 1, label: getReceiptTypeName(1) },
    { value: 2, label: getReceiptTypeName(2) },
    { value: 3, label: getReceiptTypeName(3) },
    { value: 4, label: getReceiptTypeName(4) },
  ]

  // 狀態選項（使用字串值）
  const statusOptions: { value: string; label: string }[] = [
    { value: '0', label: getReceiptStatusName('0') },
    { value: '1', label: getReceiptStatusName('1') },
  ]

  // 切換收款方式
  const toggleReceiptType = (type: ReceiptType) => {
    const types = filters.receiptTypes || []
    const newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type]
    setFilters({ ...filters, receiptTypes: newTypes })
  }

  // 切換狀態
  const toggleStatus = (status: string) => {
    const statuses = filters.statuses || []
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status]
    setFilters({ ...filters, statuses: newStatuses })
  }

  // 重置篩選
  const handleReset = () => {
    const resetFilters: ReceiptSearchFilters = {
      receiptNumber: '',
      orderNumber: '',
      dateFrom: '',
      dateTo: '',
      receiptTypes: [],
      statuses: [],
      limit: 200,
    }
    setFilters(resetFilters)
    onSearch(resetFilters)
  }

  // 執行搜尋
  const handleSearch = () => {
    onSearch(filters)
    onClose()
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="進階搜尋"
      subtitle="設定收款單搜尋條件"
      onSubmit={handleSearch}
      submitLabel="搜尋"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 收款單號 & 訂單編號 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-morandi-primary">收款單號</Label>
            <Input
              value={filters.receiptNumber}
              onChange={e => setFilters({ ...filters, receiptNumber: e.target.value })}
              placeholder="輸入收款單號模糊搜尋"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-morandi-primary">訂單編號</Label>
            <Input
              value={filters.orderNumber}
              onChange={e => setFilters({ ...filters, orderNumber: e.target.value })}
              placeholder="輸入訂單編號"
              className="mt-1"
            />
          </div>
        </div>

        {/* 日期範圍 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary mb-2 block">收款日期</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-morandi-muted">起始日期</Label>
              <DatePicker
                value={filters.dateFrom}
                onChange={(date) => setFilters({ ...filters, dateFrom: date })}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <Label className="text-xs text-morandi-muted">結束日期</Label>
              <DatePicker
                value={filters.dateTo}
                onChange={(date) => setFilters({ ...filters, dateTo: date })}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
          </div>
        </div>

        {/* 收款方式 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary mb-3 block">收款方式</Label>
          <div className="space-y-2">
            {receiptTypeOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${option.value}`}
                  checked={filters.receiptTypes?.includes(option.value)}
                  onCheckedChange={() => toggleReceiptType(option.value)}
                />
                <label
                  htmlFor={`type-${option.value}`}
                  className="text-sm text-morandi-primary cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 收款狀態 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary mb-3 block">收款狀態</Label>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={filters.statuses?.includes(option.value)}
                  onCheckedChange={() => toggleStatus(option.value)}
                />
                <label
                  htmlFor={`status-${option.value}`}
                  className="text-sm text-morandi-primary cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 結果數量限制 */}
        <div>
          <Label className="text-sm font-medium text-morandi-primary">結果數量上限</Label>
          <Input
            type="number"
            value={filters.limit}
            onChange={e => setFilters({ ...filters, limit: parseInt(e.target.value) || 200 })}
            placeholder="200"
            min="1"
            max="1000"
            className="mt-1"
          />
          <p className="text-xs text-morandi-muted mt-1">建議不超過 500 筆以確保效能</p>
        </div>

        {/* 按鈕區 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-morandi-container/20">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm text-morandi-secondary hover:text-morandi-primary"
          >
            重置篩選
          </button>
        </div>
      </div>
    </FormDialog>
  )
}
