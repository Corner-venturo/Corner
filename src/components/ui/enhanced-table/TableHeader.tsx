'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableColumn, SelectionConfig } from './types'

interface TableHeaderProps {
  columns: TableColumn[]
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  filters: Record<string, string>
  showFilters: boolean
  selection?: SelectionConfig
  actions?: (row: any) => React.ReactNode
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  onSort: (columnKey: string) => void
  onFilterChange: (key: string, value: string) => void
  onToggleFilters: () => void
  onToggleSelectAll: () => void
}

export function TableHeader({
  columns,
  sortColumn,
  sortDirection,
  filters,
  showFilters,
  selection,
  actions,
  allVisibleSelected,
  someVisibleSelected,
  onSort,
  onFilterChange,
  onToggleFilters,
  onToggleSelectAll,
}: TableHeaderProps) {
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown size={12} className="text-morandi-secondary opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={12} className="text-morandi-gold transition-colors" />
    ) : (
      <ChevronDown size={12} className="text-morandi-gold transition-colors" />
    )
  }

  return (
    <thead className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
      {/* 主標題行 */}
      <tr className="relative" data-enhanced-table-header-row>
        {/* Selection checkbox column */}
        {selection && (
          <th className="w-12 py-2.5 px-4 text-xs relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onCheckedChange={onToggleSelectAll}
            />
          </th>
        )}

        {columns.map((column, index) => (
          <th
            key={column.key}
            className={cn(
              'text-left py-2.5 px-4 text-xs relative align-middle',
              index === columns.length - 1 && 'border-r-0'
            )}
          >
            {index < columns.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
            )}
            <div className="flex items-center gap-2">
              {column.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent text-xs font-medium text-morandi-secondary transition-colors [&_svg]:!size-[12px]"
                  onClick={() => onSort(column.key)}
                >
                  {column.label}
                  {getSortIcon(column.key)}
                </Button>
              ) : (
                <span className="text-xs font-medium text-morandi-secondary">{column.label}</span>
              )}
              {index === columns.length - 1 && columns.some(col => col.filterable) && (
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="text-morandi-primary hover:text-morandi-primary"
                  onClick={onToggleFilters}
                >
                  <Filter
                    size={12}
                    className={cn(
                      'transition-colors',
                      showFilters ? 'text-morandi-primary' : 'text-morandi-muted'
                    )}
                  />
                </Button>
              )}
            </div>
          </th>
        ))}

        {/* Actions column */}
        {actions && (
          <th className="text-left py-2.5 px-4 text-xs relative">
            <span className="font-medium text-morandi-secondary">操作</span>
          </th>
        )}
      </tr>

      {/* 篩選行 */}
      {showFilters && (
        <tr className="bg-card border-t border-border/60">
          {/* Selection checkbox column - empty */}
          {selection && <td className="py-3 px-4"></td>}

          {columns.map(column => (
            <td key={column.key} className="py-3 px-4">
              {column.filterable ? (
                column.filterType === 'select' ? (
                  <Select
                    value={filters[column.key] || '__all__'}
                    onValueChange={value => onFilterChange(column.key, value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={`選擇${column.label}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">全部{column.label}</SelectItem>
                      {column.filterOptions?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={column.filterType || 'text'}
                    placeholder={`搜尋${column.label}...`}
                    value={filters[column.key] || ''}
                    onChange={e => onFilterChange(column.key, e.target.value)}
                    className="h-9 text-sm"
                  />
                )
              ) : null}
            </td>
          ))}

          {/* Actions column - empty */}
          {actions && <td className="py-3 px-4"></td>}
        </tr>
      )}
    </thead>
  )
}
