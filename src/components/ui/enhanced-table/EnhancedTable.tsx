'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnhancedTableProps } from './types'
import { useTableState } from './useTableState'
import { TableHeader } from './TableHeader'
import { TableBody } from './TableBody'
import { TablePagination } from './TablePagination'

export function EnhancedTable({
  columns,
  data,
  loading = false,
  error = null,
  onSort,
  onFilter,
  onRowClick,
  onRowDoubleClick,
  className,
  showFilters: defaultShowFilters = false,
  searchableFields = [] as readonly string[],
  initialPageSize = 10,
  searchTerm: externalSearchTerm = '',
  emptyState,
  emptyMessage,
  selection,
  expandable,
  actions,
  rowClassName,
  striped = false,
  hoverable = true,
  isLoading,
}: EnhancedTableProps) {
  // Handle loading aliases
  const actualLoading = loading || isLoading || false
  const {
    sortColumn,
    sortDirection,
    filters,
    showFilters,
    setShowFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    processedData,
    paginatedData,
    totalPages,
    startIndex,
    handleSort,
    updateFilter,
  } = useTableState({
    data,
    searchTerm: externalSearchTerm,
    searchableFields: searchableFields as any,
    initialPageSize,
  })

  // Helper functions for selection and expandable
  const getRowId = (row: any, index: number): string => {
    if (selection?.getRowId) return selection.getRowId(row, index)
    if (expandable?.getRowId) return expandable.getRowId(row, index)
    return row.id || row._id || index.toString()
  }

  const isRowSelected = (row: any, index: number): boolean => {
    if (!selection) return false
    const rowId = getRowId(row, index)
    return selection.selected.includes(rowId)
  }

  const isRowExpanded = (row: any, index: number): boolean => {
    if (!expandable) return false
    const rowId = getRowId(row, index)
    return expandable.expanded.includes(rowId)
  }

  const toggleSelection = (row: any, index: number) => {
    if (!selection) return
    const rowId = getRowId(row, index)
    const isSelected = selection.selected.includes(rowId)

    if (isSelected) {
      selection.onChange(selection.selected.filter(id => id !== rowId))
    } else {
      selection.onChange([...selection.selected, rowId])
    }
  }

  const toggleSelectAll = () => {
    if (!selection) return
    const allRowIds = paginatedData.map((row, index) => getRowId(row, startIndex + index))
    const allSelected = allRowIds.every(id => selection.selected.includes(id))

    if (allSelected) {
      // Deselect all visible rows
      selection.onChange(selection.selected.filter(id => !allRowIds.includes(id)))
    } else {
      // Select all visible rows
      const newSelected = [...selection.selected]
      allRowIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id)
        }
      })
      selection.onChange(newSelected)
    }
  }

  // Calculate if all visible rows are selected
  const allVisibleSelected = selection
    ? paginatedData.length > 0 &&
      paginatedData.every((row, index) => isRowSelected(row, startIndex + index))
    : false
  const someVisibleSelected = selection
    ? paginatedData.some((row, index) => isRowSelected(row, startIndex + index))
    : false

  const handleSortWrapper = (columnKey: string) => {
    handleSort(columnKey)
    onSort?.(columnKey, sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc')
  }

  const handleFilterChange = (key: string, value: string) => {
    updateFilter(key, value)
    const newFilters = { ...filters, [key]: value === '__all__' ? '' : value }
    onFilter?.(newFilters)
  }

  // Loading and error states
  if (actualLoading) {
    return (
      <div
        className={cn(
          'border border-border rounded-xl overflow-hidden bg-card shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-morandi-primary" />
          <span className="ml-2 text-morandi-secondary">載入中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'border border-border rounded-xl overflow-hidden bg-card shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center py-8 text-red-500">
          <span>錯誤: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col h-full',
        className
      )}
    >
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <TableHeader
            columns={columns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            filters={filters}
            showFilters={showFilters}
            selection={selection}
            actions={actions}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onSort={handleSortWrapper}
            onFilterChange={handleFilterChange}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onToggleSelectAll={toggleSelectAll}
          />
          <TableBody
            columns={columns}
            paginatedData={paginatedData}
            startIndex={startIndex}
            emptyState={emptyState}
            selection={selection}
            expandable={expandable}
            actions={actions}
            rowClassName={rowClassName}
            striped={striped}
            hoverable={hoverable}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            getRowId={getRowId}
            isRowSelected={isRowSelected}
            isRowExpanded={isRowExpanded}
            toggleSelection={toggleSelection}
          />
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        startIndex={startIndex}
        totalItems={processedData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
