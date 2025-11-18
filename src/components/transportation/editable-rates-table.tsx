'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Trash2, Plus, Copy, GripVertical, Check, X, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { TransportationRate, GroupedRate } from '@/types/transportation-rates.types'
import { cn } from '@/lib/utils'
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

  // 新增空白列
  const addNewRow = () => {
    setIsAdding(true)
    setNewRow({
      category: '',
      supplier: '',
      route: '',
      trip_type: '',
      cost_vnd: 0,
      price_twd: 0,
      kkday_selling_price: 0,
      kkday_cost: 0,
      kkday_profit: 0,
      is_backup: false,
    })
  }

  // 複製最後一列
  const copyLastRow = () => {
    if (rates.length === 0) return
    const lastRate = rates[rates.length - 1]
    setIsAdding(true)
    setNewRow({
      category: lastRate.category,
      supplier: lastRate.supplier,
      route: '',
      trip_type: '',
      cost_vnd: 0,
      price_twd: 0,
      is_backup: lastRate.is_backup,
    })
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

  // 渲染新增列
  const renderAddRow = () => {
    // 是否從品項旁點 +（需鎖定品項和廠商）
    const isAddingToCategory = addingAfterCategory !== null

    return (
      <tr className="bg-blue-50/30">
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
      <td className="px-3 py-2 border-r border-amber-200/60">
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
          <td className="px-3 py-2 bg-amber-50/30 border-r border-amber-200/60">
            <Input
              type="number"
              placeholder="0"
              value={newRow.kkday_selling_price || ''}
              onChange={e => setNewRow({ ...newRow, kkday_selling_price: parseFloat(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </td>
          <td className="px-3 py-2 bg-amber-50/30 border-r border-amber-200/60">
            <Input
              type="number"
              placeholder="0"
              value={newRow.kkday_cost || ''}
              onChange={e => setNewRow({ ...newRow, kkday_cost: parseFloat(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </td>
          <td className="px-3 py-2 bg-amber-50/30 border-r border-border/40">
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
            onClick={saveNewRow}
            size="sm"
            className="h-7 px-2 gap-1 bg-morandi-gold/20 hover:bg-morandi-gold/30 text-morandi-gold border border-morandi-gold/30"
          >
            <Check size={14} />
            儲存
          </Button>
          <Button
            onClick={cancelNewRow}
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
                        isAdding={isAdding}
                        addingAfterCategory={addingAfterCategory}
                        renderAddRow={renderAddRow}
                        hasAddingRow={isAdding && addingAfterCategory === group.category}
                      />
                      {/* 在該品項後插入新增列 */}
                      {isAdding && addingAfterCategory === group.category && renderAddRow()}
                    </React.Fragment>
                  ))}

                  {/* 新品項（插在最後） */}
                  {isAdding && addingAfterCategory === null && renderAddRow()}
                </SortableContext>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DndContext>
  )
}

// 品項組件（支援拖曳整組）
function CategoryGroupRow({
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
  isAdding: _isAdding,
  addingAfterCategory: _addingAfterCategory,
  renderAddRow: _renderAddRow,
  hasAddingRow: _hasAddingRow,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${group.category}_${group.supplier}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const categoryKey = `${group.category}_${group.supplier}`

  // 收集所有要渲染的列
  const rows: any[] = []
  // @ts-ignore - Unused variables from destructuring

  // 品項的資料列
  group.rates.forEach((rate: TransportationRate, index: number) => {
    rows.push(
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
    )
  })

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

// 細項組件（支援拖曳單一細項）
function ItemRow({
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
}: any) {
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
        isBackup && 'bg-amber-50/20'
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
      <td className="px-4 py-2.5 text-right border-r border-amber-200/60">
        {renderEditableCell(rate, 'price_twd', rate.price_twd?.toLocaleString() || '0', 'number')}
      </td>

      {!hideKKDAYColumns && (
        <>
          {/* KKDAY售價 */}
          <td className="px-4 py-2.5 text-right bg-amber-50/30 border-r border-amber-200/60">
            {renderEditableCell(rate, 'kkday_selling_price', rate.kkday_selling_price?.toLocaleString() || '0', 'number')}
          </td>

          {/* KKDAY成本 */}
          <td className="px-4 py-2.5 text-right bg-amber-50/30 border-r border-amber-200/60">
            {renderEditableCell(rate, 'kkday_cost', rate.kkday_cost?.toLocaleString() || '0', 'number')}
          </td>

          {/* 利潤（自動計算，不可編輯） */}
          <td className="px-4 py-2.5 text-right bg-amber-50/30 border-r border-border/40">
            <span className="font-mono text-sm text-amber-800 font-medium" title="自動計算（售價 - 成本）">
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
