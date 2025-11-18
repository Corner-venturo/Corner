'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransportationRate } from '@/types/transportation-rates.types'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AddRow } from './components/add-row'
import { CategoryGroupRow } from './components/category-group-row'

interface EditableRatesTableProps {
  rates: TransportationRate[]
  onUpdate: (id: string, updates: Partial<TransportationRate>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: Partial<TransportationRate>) => Promise<void>
  onInsert?: (rate: TransportationRate) => void
  isLoading?: boolean
  isEditMode?: boolean
  hideKKDAYColumns?: boolean
}

interface EditingCell {
  rowId: string
  field: keyof TransportationRate
}

// 分組資料結構（用於品項層級拖曳）
interface CategoryGroup {
  category: string
  supplier: string
  rates: TransportationRate[]
  displayOrder: number
}

export function EditableRatesTable({
  rates,
  onUpdate,
  onDelete,
  onCreate,
  onInsert,
  isLoading = false,
  isEditMode = true,
  hideKKDAYColumns = false,
}: EditableRatesTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)
  const [newRow, setNewRow] = useState<Partial<TransportationRate>>({})
  const [addingAfterCategory, setAddingAfterCategory] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 分組資料
  const categoryGroups = groupRatesByCategory(rates)
  const [orderedGroups, setOrderedGroups] = useState<CategoryGroup[]>(categoryGroups)

  // 更新分組資料當 rates 變更時
  useEffect(() => {
    setOrderedGroups(groupRatesByCategory(rates))
  }, [rates])

  // 拖曳感應器設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移動 8px 才觸發拖曳（避免誤觸）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 自動 focus 輸入框
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // 開始編輯
  const startEdit = (rowId: string, field: keyof TransportationRate, currentValue: any) => {
    if (!isEditMode) return
    if (field === 'kkday_profit') return // 利潤欄位不可編輯
    setEditingCell({ rowId, field })
    setEditValue(currentValue?.toString() || '')
  }

  // 儲存編輯
  const saveEdit = async () => {
    if (!editingCell) return

    const { rowId, field } = editingCell
    let value: any = editValue

    // 型別轉換
    if (['cost_vnd', 'price_twd', 'kkday_selling_price', 'kkday_cost', 'kkday_profit', 'price'].includes(field)) {
      value = parseFloat(editValue) || 0
    } else if (field === 'is_backup') {
      value = editValue === 'true'
    }

    const updates: Partial<TransportationRate> = { [field]: value }

    // 如果修改了 KKDAY 售價或成本，自動重算利潤
    if (field === 'kkday_selling_price' || field === 'kkday_cost') {
      const rate = rates.find(r => r.id === rowId)
      if (rate) {
        const selling = field === 'kkday_selling_price' ? value : (rate.kkday_selling_price || 0)
        const cost = field === 'kkday_cost' ? value : (rate.kkday_cost || 0)
        updates.kkday_profit = selling - cost
      }
    }

    await onUpdate(rowId, updates)
    setEditingCell(null)
  }

  // 取消編輯
  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // 處理鍵盤事件
  const handleKeyDown = async (e: React.KeyboardEvent, rowId: string, field: keyof TransportationRate) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      await saveEdit()
    }
  }

  // 儲存新增列
  const saveNewRow = async () => {
    if (!newRow.category || !newRow.route) {
      alert('請至少填寫品項和路線')
      return
    }

    await onCreate(newRow)
    setIsAdding(false)
    setNewRow({})
    setAddingAfterCategory(null)
  }

  // 取消新增
  const cancelNewRow = () => {
    setIsAdding(false)
    setNewRow({})
    setAddingAfterCategory(null)
  }

  // 渲染可編輯單元格
  const renderEditableCell = (
    rate: TransportationRate,
    field: keyof TransportationRate,
    value: any,
    type: 'text' | 'number' = 'text'
  ) => {
    const isEditing = editingCell?.rowId === rate.id && editingCell?.field === field

    if (isEditing) {
      return (
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => handleKeyDown(e, rate.id, field)}
          className="h-8 text-sm"
        />
      )
    }

    return (
      <div
        className="h-8 px-2 flex items-center cursor-pointer hover:bg-morandi-cream/30 rounded"
        onDoubleClick={() => startEdit(rate.id, field, value)}
      >
        {value || '-'}
      </div>
    )
  }

  // 處理品項拖曳結束
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = orderedGroups.findIndex(g => `${g.category}_${g.supplier}` === active.id)
    const newIndex = orderedGroups.findIndex(g => `${g.category}_${g.supplier}` === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 更新本地排序
    const reordered = arrayMove(orderedGroups, oldIndex, newIndex)
    setOrderedGroups(reordered)

    // 批次更新所有受影響的資料 display_order
    const updatePromises: Promise<void>[] = []
    reordered.forEach((group, groupIndex) => {
      group.rates.forEach((rate, rateIndex) => {
        const newOrder = groupIndex * 1000 + rateIndex
        if (rate.display_order !== newOrder) {
          updatePromises.push(onUpdate(rate.id, { display_order: newOrder }))
        }
      })
    })

    await Promise.all(updatePromises)
  }

  // 處理細項拖曳結束（同品項內）
  const handleItemDragEnd = async (categoryKey: string, event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const group = orderedGroups.find(g => `${g.category}_${g.supplier}` === categoryKey)
    if (!group) return

    const oldIndex = group.rates.findIndex(r => r.id === active.id)
    const newIndex = group.rates.findIndex(r => r.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 重新排序該組內的資料
    const reorderedRates = arrayMove(group.rates, oldIndex, newIndex)

    // 更新 display_order
    const updatePromises = reorderedRates.map((rate, index) => {
      const groupIndex = orderedGroups.findIndex(g => `${g.category}_${g.supplier}` === categoryKey)
      const newOrder = groupIndex * 1000 + index
      return onUpdate(rate.id, { display_order: newOrder })
    })

    await Promise.all(updatePromises)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-morandi-secondary">載入中...</div>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
      <div className="rounded-lg overflow-hidden bg-white shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
            <thead className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/30 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {isEditMode && (
                  <th className="px-2 py-2.5 text-center text-xs font-medium text-morandi-secondary border-r border-border/40" style={{ width: '40px' }}>
                    排序
                  </th>
                )}
                <th className="px-4 py-2.5 text-left text-xs font-medium text-morandi-secondary border-r border-border/40 group" style={{ width: '140px' }}>
                  <div className="flex items-center justify-between gap-2">
                    <span>品項</span>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingAfterCategory(null)
                          setIsAdding(true)
                          setNewRow({
                            category: '',
                            supplier: '',
                            route: '',
                            trip_type: '',
                            cost_vnd: 0,
                            price_twd: 0,
                            is_backup: false,
                          })
                        }}
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-morandi-gold hover:bg-morandi-gold/10"
                        title="新增品項"
                      >
                        <Plus size={12} />
                      </Button>
                    )}
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-morandi-secondary border-r border-border/40" style={{ width: '140px' }}>
                  廠商
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-morandi-secondary border-r border-border/40" style={{ width: '220px' }}>
                  行程路線
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-morandi-secondary border-r border-border/40" style={{ width: '100px' }}>
                  類型
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-morandi-secondary border-r border-border/40" style={{ width: '120px' }}>
                  越南盾
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-morandi-secondary border-r border-amber-200/60" style={{ width: '100px' }}>
                  台幣
                </th>
                {!hideKKDAYColumns && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-amber-700/70 bg-amber-50/40 border-r border-amber-200/60" style={{ width: '100px' }}>
                      KKDAY售價
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-amber-700/70 bg-amber-50/40 border-r border-amber-200/60" style={{ width: '100px' }}>
                      KKDAY成本
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-amber-700/70 bg-amber-50/40 border-r border-border/40" style={{ width: '100px' }}>
                      利潤
                    </th>
                  </>
                )}
                <th className="px-4 py-2.5 text-center text-xs font-medium text-morandi-secondary" style={{ width: '80px' }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {orderedGroups.length === 0 && !isAdding && !isEditMode ? (
                <tr>
                  <td colSpan={hideKKDAYColumns ? 8 : 11} className="text-center py-12 text-morandi-secondary">
                    目前沒有車資資料
                  </td>
                </tr>
              ) : orderedGroups.length === 0 && isEditMode && !isAdding ? (
                <tr>
                  <td colSpan={hideKKDAYColumns ? 9 : 12} className="text-center py-12">
                    <div className="text-morandi-secondary mb-2">目前沒有車資資料</div>
                    <Button
                      onClick={() => {
                        setIsAdding(true)
                        setAddingAfterCategory(null)
                        setNewRow({})
                      }}
                      className="gap-2"
                      size="sm"
                    >
                      <Plus size={16} />
                      新增第一筆車資
                    </Button>
                  </td>
                </tr>
              ) : (
                <SortableContext items={orderedGroups.map(g => `${g.category}_${g.supplier}`)} strategy={verticalListSortingStrategy}>
                  {orderedGroups.map((group) => (
                    <React.Fragment key={`${group.category}_${group.supplier}`}>
                      <CategoryGroupRow
                        group={group}
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
                        handleItemDragEnd={handleItemDragEnd}
                        sensors={sensors}
                      />
                      {/* 在該品項後插入新增列 */}
                      {isAdding && addingAfterCategory === group.category && (
                        <AddRow
                          newRow={newRow}
                          setNewRow={setNewRow}
                          addingAfterCategory={addingAfterCategory}
                          isEditMode={isEditMode}
                          hideKKDAYColumns={hideKKDAYColumns}
                          onSave={saveNewRow}
                          onCancel={cancelNewRow}
                        />
                      )}
                    </React.Fragment>
                  ))}

                  {/* 新品項（插在最後） */}
                  {isAdding && addingAfterCategory === null && (
                    <AddRow
                      newRow={newRow}
                      setNewRow={setNewRow}
                      addingAfterCategory={addingAfterCategory}
                      isEditMode={isEditMode}
                      hideKKDAYColumns={hideKKDAYColumns}
                      onSave={saveNewRow}
                      onCancel={cancelNewRow}
                    />
                  )}
                </SortableContext>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DndContext>
  )
}

// 分組邏輯：按 category + supplier 分組，並依 display_order 排序
function groupRatesByCategory(rates: TransportationRate[]): CategoryGroup[] {
  if (!rates.length) return []

  // 先依 display_order 排序
  const sortedRates = [...rates].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

  const groups = new Map<string, TransportationRate[]>()

  // 按 category + supplier 分組
  sortedRates.forEach(rate => {
    const key = `${rate.category || 'uncategorized'}_${rate.supplier || 'no-supplier'}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(rate)
  })

  // 轉換為 CategoryGroup 陣列
  return Array.from(groups.entries()).map(([key, groupRates]) => {
    // 安全分割：只在最後一個 _ 處分割
    const lastUnderscoreIndex = key.lastIndexOf('_')
    const category = key.substring(0, lastUnderscoreIndex)
    const supplier = key.substring(lastUnderscoreIndex + 1)

    return {
      category: category === 'uncategorized' ? '' : category,
      supplier: supplier === 'no-supplier' ? '' : supplier,
      rates: groupRates,
      displayOrder: Math.min(...groupRates.map(r => r.display_order || 0)),
    }
  }).sort((a, b) => a.displayOrder - b.displayOrder)
}
