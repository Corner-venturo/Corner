'use client'

import { useState, useCallback } from 'react'

/**
 * 拖曳排序 Hook
 *
 * 提供統一的拖曳排序邏輯，可用於：
 * - 頁面列表排序 (PageListSidebar)
 * - 時間軸排序 (TemplateDataPanel)
 * - 行程項目排序 (Itinerary)
 * - 其他需要拖曳排序的場景
 *
 * @example
 * ```tsx
 * const { dragState, dragHandlers, reorder } = useDragSort({
 *   onReorder: (fromIndex, toIndex) => {
 *     const newItems = [...items]
 *     const [removed] = newItems.splice(fromIndex, 1)
 *     newItems.splice(toIndex, 0, removed)
 *     setItems(newItems)
 *   },
 *   // 可選：限制某些項目不能被拖曳
 *   canDrag: (index) => index > 0, // 例如第一項不能拖
 *   // 可選：限制某些位置不能放置
 *   canDrop: (index) => index > 0, // 例如不能放到第一位
 * })
 *
 * return (
 *   <div>
 *     {items.map((item, index) => (
 *       <div
 *         key={item.id}
 *         draggable={dragState.canDrag(index)}
 *         onDragStart={(e) => dragHandlers.onDragStart(e, index)}
 *         onDragOver={(e) => dragHandlers.onDragOver(e, index)}
 *         onDragLeave={dragHandlers.onDragLeave}
 *         onDrop={(e) => dragHandlers.onDrop(e, index)}
 *         onDragEnd={dragHandlers.onDragEnd}
 *         className={cn(
 *           dragState.isDragging(index) && 'opacity-50',
 *           dragState.isDragOver(index) && 'border-dashed border-morandi-gold'
 *         )}
 *       >
 *         <GripVertical className="cursor-grab" />
 *         {item.name}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */

interface UseDragSortOptions {
  /** 排序完成時的回調 */
  onReorder: (fromIndex: number, toIndex: number) => void
  /** 判斷某個項目是否可以被拖曳（預設全部可拖曳） */
  canDrag?: (index: number) => boolean
  /** 判斷某個位置是否可以放置（預設全部可放置） */
  canDrop?: (index: number) => boolean
}

interface DragState {
  /** 當前被拖曳的項目索引 */
  draggedIndex: number | null
  /** 當前拖曳經過的項目索引 */
  dragOverIndex: number | null
  /** 檢查某項目是否正在被拖曳 */
  isDragging: (index: number) => boolean
  /** 檢查某項目是否被拖曳經過 */
  isDragOver: (index: number) => boolean
  /** 檢查某項目是否可以被拖曳 */
  canDrag: (index: number) => boolean
  /** 檢查某位置是否可以放置 */
  canDrop: (index: number) => boolean
}

interface DragHandlers {
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

interface UseDragSortReturn {
  dragState: DragState
  dragHandlers: DragHandlers
}

export function useDragSort({
  onReorder,
  canDrag: canDragFn,
  canDrop: canDropFn,
}: UseDragSortOptions): UseDragSortReturn {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // 預設所有項目都可拖曳
  const canDrag = useCallback(
    (index: number) => (canDragFn ? canDragFn(index) : true),
    [canDragFn]
  )

  // 預設所有位置都可放置
  const canDrop = useCallback(
    (index: number) => (canDropFn ? canDropFn(index) : true),
    [canDropFn]
  )

  // 拖曳開始
  const onDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!canDrag(index)) {
        e.preventDefault()
        return
      }
      setDraggedIndex(index)
      e.dataTransfer.effectAllowed = 'move'
    },
    [canDrag]
  )

  // 拖曳經過
  const onDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (!canDrop(index)) return
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index)
      }
    },
    [draggedIndex, canDrop]
  )

  // 拖曳離開
  const onDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  // 放下
  const onDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      if (!canDrop(toIndex)) return
      if (draggedIndex !== null && draggedIndex !== toIndex) {
        onReorder(draggedIndex, toIndex)
      }
      setDraggedIndex(null)
      setDragOverIndex(null)
    },
    [draggedIndex, canDrop, onReorder]
  )

  // 拖曳結束
  const onDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  // 狀態檢查函式
  const isDragging = useCallback(
    (index: number) => draggedIndex === index,
    [draggedIndex]
  )

  const isDragOver = useCallback(
    (index: number) => dragOverIndex === index,
    [dragOverIndex]
  )

  return {
    dragState: {
      draggedIndex,
      dragOverIndex,
      isDragging,
      isDragOver,
      canDrag,
      canDrop,
    },
    dragHandlers: {
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop,
      onDragEnd,
    },
  }
}
