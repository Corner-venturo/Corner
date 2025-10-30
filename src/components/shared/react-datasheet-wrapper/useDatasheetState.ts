'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { DataSheetColumn, SelectionRange, CellData } from './types'
import { DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, COLUMN_WIDTHS_STORAGE_KEY } from './constants'

interface UseDatasheetStateProps {
  columns: DataSheetColumn[]
  data: Record<string, unknown>[]
  hiddenColumns: string[]
  tour_id?: string
  tourId?: string
}

export function useDatasheetState({
  columns,
  data,
  hiddenColumns,
  tour_id,
  tourId,
}: UseDatasheetStateProps) {
  // Normalize tour ID (prefer tour_id over tourId)
  const finalTourId = tour_id || tourId

  // State management
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [draggedRow, setDraggedRow] = useState<number | null>(null)

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(col => !hiddenColumns.includes(col.key))
  }, [columns, hiddenColumns])

  // Load column widths from localStorage
  useEffect(() => {
    if (finalTourId) {
      const savedWidths = localStorage.getItem(`${COLUMN_WIDTHS_STORAGE_KEY}${finalTourId}`)
      if (savedWidths) {
        try {
          setColumnWidths(JSON.parse(savedWidths))
        } catch (e) {
          // Silently fail if localStorage data is corrupted
        }
      }
    }
  }, [finalTourId])

  // Save column width to localStorage
  const saveColumnWidth = useCallback(
    (columnKey: string, width: number) => {
      const newWidths = { ...columnWidths, [columnKey]: width }
      setColumnWidths(newWidths)
      if (finalTourId) {
        localStorage.setItem(
          `${COLUMN_WIDTHS_STORAGE_KEY}${finalTourId}`,
          JSON.stringify(newWidths)
        )
      }
    },
    [columnWidths, finalTourId]
  )

  // Get column width (from state or default)
  const getColumnWidth = useCallback(
    (columnKey: string): number => {
      const column = visibleColumns.find(col => col.key === columnKey)
      return columnWidths[columnKey] || column?.width || DEFAULT_COLUMN_WIDTH
    },
    [columnWidths, visibleColumns]
  )

  // Build sheet data from row data
  const sheetData = useMemo(() => {
    // Create header row
    const headerRow = visibleColumns.map((col, colIndex) => {
      const width = getColumnWidth(col.key)
      return {
        value: col.label,
        readOnly: true,
        className: 'datasheet-header',
        width: width,
        columnKey: col.key,
        colIndex: colIndex,
      }
    })

    // Create data rows
    const dataRows = data.map((row, rowIndex) => {
      return visibleColumns.map((col, colIndex) => {
        const value = row[col.key] || ''
        const isReadOnly = col.readOnly
        const width = getColumnWidth(col.key)

        // Note: Formula calculation is done in the component that uses this
        let displayValue = value

        return {
          value: value,
          displayValue: displayValue,
          readOnly: isReadOnly,
          key: `${rowIndex}-${colIndex}`,
          rowData: row,
          colKey: col.key,
          width: width,
          columnKey: col.key,
          rowIndex: rowIndex,
          className: draggedRow === rowIndex ? 'dragging' : '',
        }
      })
    })

    return [headerRow, ...dataRows]
  }, [visibleColumns, data, columnWidths, draggedRow, getColumnWidth])

  return {
    hoveredColumn,
    setHoveredColumn,
    selectedRange,
    setSelectedRange,
    columnWidths,
    setColumnWidths,
    draggedRow,
    setDraggedRow,
    visibleColumns,
    saveColumnWidth,
    getColumnWidth,
    sheetData,
  }
}
