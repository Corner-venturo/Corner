import React from 'react'

export interface TableColumn<T = any> {
  key: keyof T | string
  label: string | React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'number' | 'date' | 'select'
  filterOptions?: Array<{ value: string; label: string }>
  render?: (value: T[keyof T] | unknown, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface SelectionConfig {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: (row: any) => boolean
  getRowId?: (row: any, index: number) => string
}

export interface ExpandableConfig {
  expanded: string[]
  onExpand: (id: string) => void
  renderExpanded: (row: any) => React.ReactNode
  expandIcon?: (expanded: boolean) => React.ReactNode
  getRowId?: (row: any, index: number) => string
}

export interface EnhancedTableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  error?: string | null
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, string>) => void
  onRowClick?: (row: any, rowIndex?: number) => void
  onRowDoubleClick?: (row: any, rowIndex: number) => void
  className?: string
  showFilters?: boolean
  searchableFields?: readonly string[]
  initialPageSize?: number
  searchTerm?: string
  emptyState?: React.ReactNode
  emptyMessage?: string
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  searchable?: boolean
  searchPlaceholder?: string
  selection?: SelectionConfig
  expandable?: ExpandableConfig
  actions?: (row: any) => React.ReactNode
  rowClassName?: (row: any) => string
  _bordered?: boolean
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
  isLoading?: boolean
}
