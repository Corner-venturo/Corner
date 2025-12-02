'use client'

import React, { useCallback, useMemo } from 'react'
import ReactDataSheet from 'react-datasheet'
import { calculateFormula, getMemberContext } from '@/lib/formula-calculator'
import { cn } from '@/lib/utils'
import 'react-datasheet/lib/react-datasheet.css'

import { DataSheetProps, CellData } from './types'
import { useDatasheetState } from './useDatasheetState'
import { useDatasheetHandlers } from './useDatasheetHandlers'
import { DatasheetCell } from './DatasheetCell'
import { DatasheetStyles } from './DatasheetStyles'

export function ReactDatasheetWrapper({
  columns,
  data,
  tour_add_ons = [],
  tourPrice = 0,
  onCellsChanged,
  onDataUpdate,
  onColumnDelete,
  onColumnHide,
  hiddenColumns = [],
  className,
  orderFilter,
  roomOptions = [],
  onRoomAssign,
  getRoomUsage,
  isRoomFull,
  enableColumnResize = true,
  enableRowDrag = true,
  tour_id,
  tourId,
}: DataSheetProps) {
  // State management
  const {
    hoveredColumn,
    setHoveredColumn,
    columnWidths,
    setColumnWidths,
    draggedRow,
    setDraggedRow,
    visibleColumns,
    saveColumnWidth,
    getColumnWidth,
    sheetData: initialSheetData,
  } = useDatasheetState({
    columns,
    data,
    hiddenColumns,
    tour_id,
    tourId,
  })

  // Event handlers
  const {
    handleColumnResize,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleCellsChanged,
    handleKeyDown,
    handleSelect,
    parsePaste,
  } = useDatasheetHandlers({
    data,
    visibleColumns,
    columnWidths,
    draggedRow,
    enableColumnResize,
    enableRowDrag,
    onDataUpdate,
    onCellsChanged,
    saveColumnWidth,
  })

  // Apply formula calculations and formula styling to sheet data
  const sheetData = useMemo(() => {
    return initialSheetData.map((row, rowIndex) => {
      if (rowIndex === 0) return row // Keep header as is

      return row.map(cell => {
        const value = cell.value
        let displayValue = value
        let className = cell.className

        // Calculate formulas
        if (typeof value === 'string' && value.startsWith('=')) {
          const rowData = 'rowData' in cell ? cell.rowData : {}
          const context = getMemberContext(
            rowData || {},
            tour_add_ons as { id: string; price: number }[],
            tourPrice
          )
          displayValue = calculateFormula(value, context) ?? ''
          className = cn(className, 'datasheet-formula')
        }

        // Add readonly styling
        if (cell.readOnly) {
          className = cn(className, 'datasheet-readonly')
        }

        return {
          ...cell,
          displayValue,
          className: cn('datasheet-cell', className),
        }
      })
    })
  }, [initialSheetData, tour_add_ons, tourPrice])

  // Custom value renderer
  const valueRenderer = useCallback(
    (cell: CellData, row: number, col: number) => {
      return (
        <DatasheetCell
          cell={cell}
          row={row}
          col={col}
          visibleColumns={visibleColumns}
          hoveredColumn={hoveredColumn}
          enableColumnResize={enableColumnResize}
          orderFilter={orderFilter}
          roomOptions={roomOptions}
          getRoomUsage={getRoomUsage}
          isRoomFull={isRoomFull}
          onColumnHide={onColumnHide}
          onColumnDelete={onColumnDelete}
          onColumnResize={handleColumnResize}
        />
      )
    },
    [
      visibleColumns,
      hoveredColumn,
      enableColumnResize,
      orderFilter,
      roomOptions,
      getRoomUsage,
      isRoomFull,
      onColumnHide,
      onColumnDelete,
      handleColumnResize,
    ]
  )

  // Row renderer with drag support
  const rowRenderer = useCallback(
    (props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row': number }) => {
      const rowIndex = props['data-row']
      const isDraggable = enableRowDrag && rowIndex > 0
      const isDragging = draggedRow === rowIndex - 1

      return (
        <tr
          {...props}
          draggable={isDraggable}
          onDragStart={e => {
            handleRowDragStart(e, rowIndex)
            setDraggedRow(rowIndex - 1)
          }}
          onDragOver={handleRowDragOver}
          onDrop={e => {
            handleRowDrop(e, draggedRow, rowIndex)
            setDraggedRow(null)
          }}
          className={cn(
            props.className,
            isDragging && 'opacity-50 bg-morandi-gold/10',
            isDraggable && 'hover:bg-morandi-gold/5 cursor-move'
          )}
          style={{
            ...props.style,
            borderLeft: isDragging ? '3px solid #d97706' : undefined,
          }}
        />
      )
    },
    [enableRowDrag, draggedRow, handleRowDragStart, handleRowDragOver, handleRowDrop, setDraggedRow]
  )

  // Cell renderer with width support
  const cellRenderer = useCallback((props: React.TdHTMLAttributes<HTMLTableCellElement> & {
    editing?: boolean
    selected?: boolean
    updated?: boolean
    width?: number
    columnKey?: string
    rowIndex?: number
    attributesRenderer?: unknown
    valueRenderer?: unknown
    dataRenderer?: unknown
  }) => {
    const {
      editing: _editing,
      selected: _selected,
      updated: _updated,
      width,
      columnKey: _columnKey,
      rowIndex: _rowIndex,
      attributesRenderer: _attributesRenderer,
      valueRenderer: _valueRenderer,
      dataRenderer: _dataRenderer,
      ...tdProps
    } = props
    const cellWidth = width || 100

    return (
      <td
        {...tdProps}
        style={{
          ...props.style,
          padding: 0,
          width: `${cellWidth}px`,
          minWidth: `${cellWidth}px`,
          maxWidth: `${cellWidth}px`,
        }}
      />
    )
  }, [])

  return (
    <div className={cn('excel-datasheet-wrapper', className)}>
      <DatasheetStyles />

      <div
        onKeyDown={e => {
          handleKeyDown(e)
          if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        tabIndex={0}
      >
        {/* @ts-expect-error - ReactDataSheet type definitions are incomplete */}
        <ReactDataSheet
          data={sheetData}
          onCellsChanged={handleCellsChanged}
          valueRenderer={valueRenderer}
          dataRenderer={cell => cell.value}
          onContextMenu={(e: React.MouseEvent, _cell: CellData, _i: number, _j: number) => e.preventDefault()}
          onSelect={handleSelect}
          parsePaste={parsePaste}
          tabBehaviour="default"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          rowRenderer={rowRenderer}
          cellRenderer={cellRenderer}
        />
      </div>
    </div>
  )
}
