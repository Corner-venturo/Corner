'use client'

import React from 'react'
import { Trash2, Plus, PlusCircle, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransportationRate } from '@/types/transportation-rates.types'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItemRowProps {
  rate: TransportationRate
  index: number
  groupSize: number
  isEditMode: boolean
  hideKKDAYColumns: boolean
  editingCell: { rowId: string; field: keyof TransportationRate } | null
  editValue: string
  setEditValue: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  startEdit: (rowId: string, field: keyof TransportationRate, currentValue: string | number | boolean | null | undefined) => void
  saveEdit: () => Promise<void>
  handleKeyDown: (e: React.KeyboardEvent, rowId: string, field: keyof TransportationRate) => Promise<void>
  renderEditableCell: (rate: TransportationRate, field: keyof TransportationRate, value: string | number | boolean | null | undefined, type?: 'text' | 'number') => React.ReactNode
  onUpdate: (id: string, updates: Partial<TransportationRate>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onInsert?: (rate: TransportationRate) => void
  setAddingAfterCategory: (category: string) => void
  setIsAdding: (isAdding: boolean) => void
  setNewRow: (row: Partial<TransportationRate>) => void
  category: string
  supplier: string
  isBackup: boolean
  categoryDragRef?: (node: HTMLElement | null) => void
  categoryDragStyle?: React.CSSProperties
  categoryDragAttributes?: Record<string, unknown>
  categoryDragListeners?: Record<string, unknown>
}

export function ItemRow({
  rate,
  index,
  groupSize,
  isEditMode,
  hideKKDAYColumns,
  editingCell,
  editValue,
  setEditValue,
  inputRef,
  startEdit,
  saveEdit,
  handleKeyDown,
  renderEditableCell,
  onUpdate,
  onDelete,
  onInsert,
  setAddingAfterCategory,
  setIsAdding,
  setNewRow,
  category,
  supplier,
  isBackup,
  categoryDragRef,
  categoryDragStyle,
  categoryDragAttributes,
  categoryDragListeners,
}: ItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rate.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isFirstInGroup = index === 0

  return (
    <tr
      ref={isFirstInGroup && categoryDragRef ? categoryDragRef : setNodeRef}
      style={isFirstInGroup && categoryDragStyle ? categoryDragStyle : style}
      className={cn(
        'border-b border-border/50 hover:bg-morandi-container/20 transition-colors',
        isBackup && 'bg-status-warning-bg'
      )}
    >
      {/* 拖曳手把 */}
      {isEditMode && (
        <td className="px-2 py-2.5 text-center border-r border-border/40">
          <div className="flex flex-col gap-0.5">
            {/* 品項拖曳手把（只在第一列顯示） */}
            {isFirstInGroup && (
              <button
                {...(categoryDragAttributes || {})}
                {...(categoryDragListeners || {})}
                className="cursor-move text-morandi-gold/60 hover:text-morandi-gold"
                title="拖曳整個品項"
              >
                <GripVertical size={14} />
              </button>
            )}
            {/* 細項拖曳手把（每一列都有） */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-move text-morandi-secondary/60 hover:text-morandi-secondary"
              title="拖曳此細項"
            >
              <GripVertical size={12} />
            </button>
          </div>
        </td>
      )}

      {/* 品項（合併儲存格） */}
      {isFirstInGroup && (
        <td
          rowSpan={groupSize}
          className="px-4 py-2.5 align-top bg-morandi-container/20 border-r border-border/40 group relative"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1" onDoubleClick={() => startEdit(rate.id, 'category', category)}>
              {editingCell?.rowId === rate.id && editingCell?.field === 'category' ? (
                <Input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={e => handleKeyDown(e, rate.id, 'category')}
                  className="h-7 text-sm"
                />
              ) : (
                <span className="text-sm font-medium text-morandi-primary cursor-pointer hover:text-morandi-gold">
                  {category || '-'}
                </span>
              )}
            </div>
            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddingAfterCategory(category ?? '')
                  setIsAdding(true)
                  setNewRow({
                    category,
                    supplier,
                    route: '',
                    trip_type: '',
                    cost_vnd: 0,
                    price_twd: 0,
                    is_backup: isBackup,
                  })
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-morandi-gold hover:bg-morandi-gold/10 flex-shrink-0"
                title={`新增 ${category} 路線`}
              >
                <Plus size={14} />
              </Button>
            )}
          </div>
        </td>
      )}

      {/* 廠商（合併儲存格） */}
      {isFirstInGroup && (
        <td
          rowSpan={groupSize}
          className="px-4 py-2.5 align-top bg-morandi-container/20 border-r border-border/40"
        >
          {renderEditableCell(rate, 'supplier', supplier)}
        </td>
      )}

      {/* 行程路線 */}
      <td className="px-4 py-2.5 border-r border-border/40">
        {renderEditableCell(rate, 'route', rate.route)}
      </td>

      {/* 類型 */}
      <td className="px-4 py-2.5 text-center border-r border-border/40">
        {renderEditableCell(rate, 'trip_type', rate.trip_type)}
      </td>

      {/* 越南盾 */}
      <td className="px-4 py-2.5 text-right border-r border-border/40">
        {renderEditableCell(rate, 'cost_vnd', rate.cost_vnd?.toLocaleString() || '0', 'number')}
      </td>

      {/* 台幣 */}
      <td className="px-4 py-2.5 text-right border-r border-morandi-gold/30">
        {renderEditableCell(rate, 'price_twd', rate.price_twd?.toLocaleString() || '0', 'number')}
      </td>

      {!hideKKDAYColumns && (
        <>
          {/* KKDAY售價 */}
          <td className="px-4 py-2.5 text-right bg-status-warning-bg border-r border-morandi-gold/30">
            {renderEditableCell(rate, 'kkday_selling_price', rate.kkday_selling_price?.toLocaleString() || '0', 'number')}
          </td>

          {/* KKDAY成本 */}
          <td className="px-4 py-2.5 text-right bg-status-warning-bg border-r border-morandi-gold/30">
            {renderEditableCell(rate, 'kkday_cost', rate.kkday_cost?.toLocaleString() || '0', 'number')}
          </td>

          {/* 利潤（自動計算，不可編輯） */}
          <td className="px-4 py-2.5 text-right bg-status-warning-bg border-r border-border/40">
            <span className="font-mono text-sm text-morandi-gold font-medium" title="自動計算（售價 - 成本）">
              {rate.kkday_profit?.toLocaleString() || '0'}
            </span>
          </td>
        </>
      )}

      {/* 操作 */}
      <td className="px-4 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          {onInsert && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onInsert(rate)}
              className="h-7 w-7 p-0 text-morandi-gold hover:bg-morandi-gold/10"
              title="插入到報價單"
            >
              <PlusCircle size={14} />
            </Button>
          )}
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rate.id)}
              className="h-7 w-7 p-0 text-morandi-red hover:bg-morandi-red/10"
              title="刪除此筆車資"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
