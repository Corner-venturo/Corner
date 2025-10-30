'use client'

import { useCallback } from 'react'
import { CellData, CellChange, DataSheetColumn } from './types'
import { MIN_COLUMN_WIDTH, KEYCODES, ARROW_KEYS } from './constants'

interface UseDatasheetHandlersProps {
  data: Record<string, unknown>[]
  visibleColumns: DataSheetColumn[]
  columnWidths: Record<string, number>
  draggedRow: number | null
  enableColumnResize: boolean
  enableRowDrag: boolean
  onDataUpdate?: (newData: Record<string, unknown>[]) => void
  onCellsChanged?: (changes: CellChange[]) => void
  saveColumnWidth: (columnKey: string, width: number) => void
}

export function useDatasheetHandlers({
  data,
  visibleColumns,
  columnWidths,
  draggedRow,
  enableColumnResize,
  enableRowDrag,
  onDataUpdate,
  onCellsChanged,
  saveColumnWidth,
}: UseDatasheetHandlersProps) {
  // Handle column resize
  const handleColumnResize = useCallback(
    (e: React.MouseEvent, columnKey: string) => {
      if (!enableColumnResize) return

      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const column = visibleColumns.find(col => col.key === columnKey)
      const currentWidth = columnWidths[columnKey] || column?.width || 100

      const handleMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startX
        const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + diff)
        // This updates local state in the component
      }

      const handleMouseUp = () => {
        // Save the final width
        const finalWidth = columnWidths[columnKey]
        if (finalWidth) {
          saveColumnWidth(columnKey, finalWidth)
        }
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [enableColumnResize, visibleColumns, columnWidths, saveColumnWidth]
  )

  // Handle row drag start
  const handleRowDragStart = useCallback(
    (e: React.DragEvent, rowIndex: number) => {
      if (!enableRowDrag || rowIndex === 0) return // Don't allow header row drag
      e.dataTransfer.effectAllowed = 'move'
    },
    [enableRowDrag]
  )

  // Handle row drag over
  const handleRowDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enableRowDrag) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    [enableRowDrag]
  )

  // Handle row drop
  const handleRowDrop = useCallback(
    (e: React.DragEvent, draggedRowIndex: number | null, dropRowIndex: number) => {
      if (!enableRowDrag || draggedRowIndex === null || dropRowIndex === 0) return

      e.preventDefault()
      const dropIndex = dropRowIndex - 1 // Subtract 1 for header row
      const dragIndex = draggedRowIndex

      if (dragIndex === dropIndex) {
        return
      }

      const newData = [...data]
      const draggedItem = newData[dragIndex]
      newData.splice(dragIndex, 1)
      newData.splice(dropIndex, 0, draggedItem)

      if (onDataUpdate) {
        onDataUpdate(newData)
      }
    },
    [enableRowDrag, data, onDataUpdate]
  )

  // Handle cells changed
  const handleCellsChanged = useCallback(
    (changes: CellChange[]) => {
      if (!onDataUpdate) return

      const newData = [...data]

      changes.forEach(({ row, col, value }) => {
        if (row === 0) return // Skip header row

        const dataRowIndex = row - 1
        const column = visibleColumns[col]

        if (column && newData[dataRowIndex]) {
          newData[dataRowIndex] = {
            ...newData[dataRowIndex],
            [column.key]: value,
          }
        }
      })

      onDataUpdate(newData)

      if (onCellsChanged) {
        onCellsChanged(changes)
      }
    },
    [data, visibleColumns, onDataUpdate, onCellsChanged]
  )

  // Handle keyboard down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Copy: Ctrl+C (handled by react-datasheet)
    if (e.ctrlKey && e.key === KEYCODES.COPY) {
      // react-datasheet handles this natively
    }
    // Paste: Ctrl+V (handled by react-datasheet)
    else if (e.ctrlKey && e.key === KEYCODES.PASTE) {
      // react-datasheet handles this natively
    }
    // Delete: Clear cell content (can be extended)
    else if (e.key === KEYCODES.DELETE) {
      // Custom clear logic can be added here
    }

    // Prevent arrow keys from scrolling page
    if (ARROW_KEYS.includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  // Handle cell selection
  const handleSelect = useCallback(
    (start: { _i: number; j: number }, end?: { _i: number; j: number }) => {
      if (!start) return

      const endCell = end || start

      // Can be used to track selection state
      if (start._i !== endCell._i || start.j !== endCell.j) {
        // Range selected
      }
    },
    []
  )

  // Parse pasted content from clipboard
  const parsePaste = useCallback((str: string): string[][] => {
    return str.split(/\r\n|\n|\r/).map(row => row.split('\t'))
  }, [])

  return {
    handleColumnResize,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleCellsChanged,
    handleKeyDown,
    handleSelect,
    parsePaste,
  }
}
