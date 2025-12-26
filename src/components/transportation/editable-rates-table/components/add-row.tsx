'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransportationRate } from '@/types/transportation-rates.types'

interface AddRowProps {
  newRow: Partial<TransportationRate>
  setNewRow: (row: Partial<TransportationRate>) => void
  addingAfterCategory: string | null
  isEditMode: boolean
  hideKKDAYColumns: boolean
  onSave: () => Promise<void>
  onCancel: () => void
}

export function AddRow({
  newRow,
  setNewRow,
  addingAfterCategory,
  isEditMode,
  hideKKDAYColumns,
  onSave,
  onCancel,
}: AddRowProps) {
  // 是否從品項旁點 +（需鎖定品項和廠商）
  const isAddingToCategory = addingAfterCategory !== null

  return (
    <tr className="bg-status-info-bg">
      {/* 排序欄位（編輯模式才顯示） */}
      {isEditMode && (
        <td className="px-2 py-2.5 text-center border-r border-border/40">
          {/* 空白，新增時不需要拖曳手把 */}
        </td>
      )}

      {/* 品項欄位 */}
      <td className="px-3 py-2 border-r border-border/40 bg-morandi-container/20">
        {isAddingToCategory ? (
          <span className="text-sm font-medium text-morandi-primary">
            {newRow.category || '-'}
          </span>
        ) : (
          <Input
            placeholder="品項（如：7座車）"
            value={newRow.category || ''}
            onChange={e => setNewRow({ ...newRow, category: e.target.value })}
            className="h-8 text-sm"
          />
        )}
      </td>

      {/* 廠商欄位 */}
      <td className="px-3 py-2 border-r border-border/40 bg-morandi-container/20">
        {isAddingToCategory ? (
          <span className="text-sm text-muted-foreground">
            {newRow.supplier || '-'}
          </span>
        ) : (
          <Input
            placeholder="廠商名稱"
            value={newRow.supplier || ''}
            onChange={e => setNewRow({ ...newRow, supplier: e.target.value })}
            className="h-8 text-sm"
          />
        )}
      </td>

      <td className="px-3 py-2 border-r border-border/40">
        <Input
          placeholder="行程路線"
          value={newRow.route || ''}
          onChange={e => setNewRow({ ...newRow, route: e.target.value })}
          className="h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2 border-r border-border/40">
        <Input
          placeholder="單程/往返"
          value={newRow.trip_type || ''}
          onChange={e => setNewRow({ ...newRow, trip_type: e.target.value })}
          className="h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2 border-r border-border/40">
        <Input
          type="number"
          placeholder="0"
          value={newRow.cost_vnd || ''}
          onChange={e => setNewRow({ ...newRow, cost_vnd: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2 border-r border-morandi-gold/30">
        <Input
          type="number"
          placeholder="0"
          value={newRow.price_twd || ''}
          onChange={e => setNewRow({ ...newRow, price_twd: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </td>
      {!hideKKDAYColumns && (
        <>
          <td className="px-3 py-2 bg-status-warning-bg border-r border-morandi-gold/30">
            <Input
              type="number"
              placeholder="0"
              value={newRow.kkday_selling_price || ''}
              onChange={e => setNewRow({ ...newRow, kkday_selling_price: parseFloat(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </td>
          <td className="px-3 py-2 bg-status-warning-bg border-r border-morandi-gold/30">
            <Input
              type="number"
              placeholder="0"
              value={newRow.kkday_cost || ''}
              onChange={e => setNewRow({ ...newRow, kkday_cost: parseFloat(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </td>
          <td className="px-3 py-2 bg-status-warning-bg border-r border-border/40">
            <Input
              type="number"
              placeholder="0"
              value={newRow.kkday_profit || ''}
              onChange={e => setNewRow({ ...newRow, kkday_profit: parseFloat(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </td>
        </>
      )}
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <Button
            onClick={onSave}
            size="sm"
            className="h-7 px-2 gap-1 bg-morandi-gold/20 hover:bg-morandi-gold/30 text-morandi-gold border border-morandi-gold/30"
          >
            <Check size={14} />
            儲存
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
          >
            <X size={14} />
            取消
          </Button>
        </div>
      </td>
    </tr>
  )
}
