'use client'

import React, { useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { QuickQuoteItem } from '@/stores/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface QuickQuoteItemsTableProps {
  items: QuickQuoteItem[]
  isEditing: boolean
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onUpdateItem: <K extends keyof QuickQuoteItem>(id: string, field: K, value: QuickQuoteItem[K]) => void
  onReorderItems?: (oldIndex: number, newIndex: number) => void
}

// 可排序的表格列
interface SortableRowProps {
  item: QuickQuoteItem
  isEditing: boolean
  cellClass: string
  inputClass: string
  onUpdateItem: <K extends keyof QuickQuoteItem>(id: string, field: K, value: QuickQuoteItem[K]) => void
  onRemoveItem: (id: string) => void
  handleTextChange: (id: string, field: 'description' | 'notes', e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: (id: string, field: 'description' | 'notes', e: React.CompositionEvent<HTMLInputElement>) => void
  normalizeNumber: (val: string) => string
}

const SortableRow: React.FC<SortableRowProps> = ({
  item,
  isEditing,
  cellClass,
  inputClass,
  onUpdateItem,
  onRemoveItem,
  handleTextChange,
  handleKeyDown,
  handleCompositionStart,
  handleCompositionEnd,
  normalizeNumber,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'hover:bg-morandi-container/10',
        isDragging && 'opacity-50 bg-morandi-gold/10'
      )}
    >
      {/* 拖曳把手 */}
      {isEditing && (
        <td className={`${cellClass} w-8 text-center`}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-morandi-secondary hover:text-morandi-primary p-1"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>
      )}
      <td className={cellClass}>
        <input
          value={item.description}
          onChange={e => handleTextChange(item.id, 'description', e)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={e => handleCompositionEnd(item.id, 'description', e)}
          placeholder="項目說明"
          disabled={!isEditing}
          className={inputClass}
        />
      </td>
      <td className={cellClass}>
        <input
          type="text"
          value={item.quantity === 0 ? '' : item.quantity}
          onChange={e => {
            const val = normalizeNumber(e.target.value)
            if (val === '' || val === '-') {
              onUpdateItem(item.id, 'quantity', 0)
            } else {
              const num = parseFloat(val)
              if (!isNaN(num)) {
                onUpdateItem(item.id, 'quantity', num)
              }
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={!isEditing}
          className={`${inputClass} text-center`}
        />
      </td>
      {isEditing && (
        <td className={cellClass}>
          <input
            type="text"
            value={item.cost === 0 || item.cost === undefined ? '' : item.cost}
            onChange={e => {
              const val = normalizeNumber(e.target.value)
              if (val === '' || val === '-') {
                onUpdateItem(item.id, 'cost', 0)
              } else {
                const num = parseFloat(val)
                if (!isNaN(num)) {
                  onUpdateItem(item.id, 'cost', num)
                }
              }
            }}
            onKeyDown={handleKeyDown}
            className={`${inputClass} text-right`}
          />
        </td>
      )}
      <td className={cellClass}>
        <input
          type="text"
          value={item.unit_price === 0 ? '' : item.unit_price}
          onChange={e => {
            const val = normalizeNumber(e.target.value)
            if (val === '' || val === '-') {
              onUpdateItem(item.id, 'unit_price', 0)
            } else {
              const num = parseFloat(val)
              if (!isNaN(num)) {
                onUpdateItem(item.id, 'unit_price', num)
              }
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={!isEditing}
          className={`${inputClass} text-right`}
        />
      </td>
      <td className={`${cellClass} text-right font-medium`}>
        {item.amount.toLocaleString()}
      </td>
      {isEditing && (
        <td className={`${cellClass} text-right font-medium`}>
          <span className={((item.unit_price - (item.cost || 0)) * item.quantity) >= 0 ? 'text-morandi-green' : 'text-morandi-red'}>
            {((item.unit_price - (item.cost || 0)) * item.quantity).toLocaleString()}
          </span>
        </td>
      )}
      <td className={cellClass}>
        <input
          value={item.notes}
          onChange={e => handleTextChange(item.id, 'notes', e)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={e => handleCompositionEnd(item.id, 'notes', e)}
          placeholder="備註"
          disabled={!isEditing}
          className={inputClass}
        />
      </td>
      {isEditing && (
        <td className={`${cellClass} text-center`}>
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="text-morandi-red hover:text-status-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  )
}

export const QuickQuoteItemsTable: React.FC<QuickQuoteItemsTableProps> = ({
  items,
  isEditing,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onReorderItems,
}) => {
  // IME 組合輸入狀態追蹤
  const isComposingRef = useRef(false)

  // 拖曳感測器設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id && onReorderItems) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      onReorderItems(oldIndex, newIndex)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 組合輸入中按 Enter 不處理
    if (e.key === 'Enter' && isComposingRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const normalizeNumber = (val: string): string => {
    // 全形轉半形
    val = val.replace(/[０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    val = val.replace(/[．]/g, '.')
    val = val.replace(/[－]/g, '-')
    return val
  }

  // 處理文字欄位變更
  const handleTextChange = useCallback((
    id: string,
    field: 'description' | 'notes',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // 直接更新，不阻擋 IME 輸入
    onUpdateItem(id, field, e.target.value)
  }, [onUpdateItem])

  // 組合輸入結束時更新
  const handleCompositionEnd = useCallback((
    id: string,
    field: 'description' | 'notes',
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    isComposingRef.current = false
    onUpdateItem(id, field, e.currentTarget.value)
  }, [onUpdateItem])

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  // 儲存格樣式（簡潔版，參考請款單）
  const cellClass = "px-2 py-1.5"
  const headerCellClass = "px-2 py-2 text-left font-medium text-morandi-secondary text-xs"
  const inputClass = "input-no-focus w-full h-7 px-1 bg-transparent text-sm"

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-morandi-primary">收費明細表</h2>
        {isEditing && (
          <Button onClick={onAddItem} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            新增項目
          </Button>
        )}
      </div>
      <div className="bg-card rounded-lg border border-morandi-gold/20 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-morandi-container/60">
                {isEditing && <th className={`${headerCellClass} w-8`}></th>}
                <th className={headerCellClass}>摘要</th>
                <th className={`${headerCellClass} text-center w-20`}>數量</th>
                {isEditing && <th className={`${headerCellClass} text-center w-24`}>成本</th>}
                <th className={`${headerCellClass} text-center w-28`}>單價</th>
                <th className={`${headerCellClass} text-center w-28`}>金額</th>
                {isEditing && <th className={`${headerCellClass} text-center w-24`}>利潤</th>}
                <th className={`${headerCellClass} w-32`}>備註</th>
                {isEditing && <th className={`${headerCellClass} text-center w-12`}></th>}
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    cellClass={cellClass}
                    inputClass={inputClass}
                    onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem}
                    handleTextChange={handleTextChange}
                    handleKeyDown={handleKeyDown}
                    handleCompositionStart={handleCompositionStart}
                    handleCompositionEnd={handleCompositionEnd}
                    normalizeNumber={normalizeNumber}
                  />
                ))}
              </SortableContext>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={isEditing ? 9 : 5}
                    className="px-3 py-8 text-center text-morandi-secondary border border-morandi-gold/20"
                  >
                    尚無項目
                    {isEditing && '，點擊「新增項目」開始'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}
