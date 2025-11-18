'use client'

import React from 'react'
import { TransportationRate } from '@/types/transportation-rates.types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ItemRow } from './item-row'

interface CategoryGroup {
  category: string
  supplier: string
  rates: TransportationRate[]
  displayOrder: number
}

interface CategoryGroupRowProps {
  group: CategoryGroup
  isEditMode: boolean
  hideKKDAYColumns: boolean
  editingCell: { rowId: string; field: keyof TransportationRate } | null
  editValue: string
  setEditValue: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  startEdit: (rowId: string, field: keyof TransportationRate, currentValue: any) => void
  saveEdit: () => Promise<void>
  handleKeyDown: (e: React.KeyboardEvent, rowId: string, field: keyof TransportationRate) => Promise<void>
  renderEditableCell: (rate: TransportationRate, field: keyof TransportationRate, value: any, type?: 'text' | 'number') => React.ReactNode
  onUpdate: (id: string, updates: Partial<TransportationRate>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onInsert?: (rate: TransportationRate) => void
  setAddingAfterCategory: (category: string) => void
  setIsAdding: (isAdding: boolean) => void
  setNewRow: (row: Partial<TransportationRate>) => void
  handleItemDragEnd: (categoryKey: string, event: DragEndEvent) => Promise<void>
  sensors: any
}

export function CategoryGroupRow({
  group,
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
  handleItemDragEnd,
  sensors,
}: CategoryGroupRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${group.category}_${group.supplier}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const categoryKey = `${group.category}_${group.supplier}`

  // 品項的資料列
  const rows = group.rates.map((rate: TransportationRate, index: number) => (
    <ItemRow
      key={rate.id}
      rate={rate}
      index={index}
      groupSize={group.rates.length}
      isEditMode={isEditMode}
      hideKKDAYColumns={hideKKDAYColumns}
      editingCell={editingCell}
      editValue={editValue}
      setEditValue={setEditValue}
      inputRef={inputRef}
      startEdit={startEdit}
      saveEdit={saveEdit}
      handleKeyDown={handleKeyDown}
      renderEditableCell={renderEditableCell}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onInsert={onInsert}
      setAddingAfterCategory={setAddingAfterCategory}
      setIsAdding={setIsAdding}
      setNewRow={setNewRow}
      category={group.category}
      supplier={group.supplier}
      isBackup={rate.is_backup}
      categoryDragRef={index === 0 ? setNodeRef : undefined}
      categoryDragStyle={index === 0 ? style : undefined}
      categoryDragAttributes={index === 0 ? attributes : undefined}
      categoryDragListeners={index === 0 ? listeners : undefined}
    />
  ))

  // 包裹 DndContext 和 SortableContext（細項拖曳）
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => handleItemDragEnd(categoryKey, event)}
    >
      <SortableContext items={group.rates.map((r: TransportationRate) => r.id)} strategy={verticalListSortingStrategy}>
        {rows}
      </SortableContext>
    </DndContext>
  )
}
