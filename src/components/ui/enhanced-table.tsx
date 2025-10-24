'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  ChevronRight,
  ChevronDown as ExpandDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableColumn {
  key: string;
  label: string | React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'number' | 'date' | 'select';
  filterOptions?: Array<{ value: string; label: string }>;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface SelectionConfig {
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: (row) => boolean;
  getRowId?: (row: any, index: number) => string;
}

export interface ExpandableConfig {
  expanded: string[];
  onExpand: (id: string) => void;
  renderExpanded: (row) => React.ReactNode;
  expandIcon?: (expanded: boolean) => React.ReactNode;
  getRowId?: (row: any, index: number) => string;
}

export interface EnhancedTableProps {
  columns: TableColumn[];
  data: unknown[];
  loading?: boolean;
  error?: string | null;

  // 原有功能
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  onRowClick?: (row: any, rowIndex: number) => void;
  onRowDoubleClick?: (row: any, rowIndex: number) => void;
  className?: string;
  showFilters?: boolean;
  searchableFields?: string[];
  initialPageSize?: number;
  searchTerm?: string;
  emptyState?: React.ReactNode;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  searchable?: boolean;
  searchPlaceholder?: string;

  // DataTable 功能
  selection?: SelectionConfig;
  expandable?: ExpandableConfig;
  actions?: (row) => React.ReactNode;
  rowClassName?: (row) => string;
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

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
  searchableFields = [],
  initialPageSize = 10,
  searchTerm: externalSearchTerm = '',
  emptyState,
  selection,
  expandable,
  actions,
  rowClassName,
  bordered = true,
  striped = false,
  hoverable = true
}: EnhancedTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(defaultShowFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 搜尋和過濾邏輯
  const processedData = React.useMemo(() => {
    let filtered = [...data];

    // 全文搜尋
    if (externalSearchTerm && searchableFields.length > 0) {
      filtered = filtered.filter(row =>
        searchableFields.some(field => {
          const value = row[field];
          return value && value.toString().toLowerCase().includes(externalSearchTerm.toLowerCase());
        })
      );
    }

    // 篩選器
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(row => {
          const value = row[key];
          return value && value.toString().toLowerCase().includes(filters[key].toLowerCase());
        });
      }
    });

    // 排序
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === bValue) return 0;

        const result = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  }, [data, externalSearchTerm, searchableFields, filters, sortColumn, sortDirection]);

  // 分頁邏輯
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  // 重置頁面當資料變化時
  React.useEffect(() => {
    setCurrentPage(1);
  }, [processedData.length]);

  const handleSort = (columnKey: string) => {
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort?.(columnKey, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown size={14} className="text-morandi-secondary opacity-50" />;
    }
    return sortDirection === 'asc' ?
      <ChevronUp size={14} className="text-morandi-gold transition-colors" /> :
      <ChevronDown size={14} className="text-morandi-gold transition-colors" />;
  };

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value === '__all__' ? '' : value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // Helper functions for selection and expandable
  const getRowId = (row: any, index: number): string => {
    if (selection?.getRowId) return selection.getRowId(row, index);
    if (expandable?.getRowId) return expandable.getRowId(row, index);
    return row.id || row._id || index.toString();
  };

  const isRowSelected = (row: any, index: number): boolean => {
    if (!selection) return false;
    const rowId = getRowId(row, index);
    return selection.selected.includes(rowId);
  };

  const isRowExpanded = (row: any, index: number): boolean => {
    if (!expandable) return false;
    const rowId = getRowId(row, index);
    return expandable.expanded.includes(rowId);
  };

  const toggleSelection = (row: any, index: number) => {
    if (!selection) return;
    const rowId = getRowId(row, index);
    const isSelected = selection.selected.includes(rowId);

    if (isSelected) {
      selection.onChange(selection.selected.filter(id => id !== rowId));
    } else {
      selection.onChange([...selection.selected, rowId]);
    }
  };

  const toggleSelectAll = () => {
    if (!selection) return;
    const allRowIds = paginatedData.map((row, index) => getRowId(row, startIndex + index));
    const allSelected = allRowIds.every(id => selection.selected.includes(id));

    if (allSelected) {
      // Deselect all visible rows
      selection.onChange(selection.selected.filter(id => !allRowIds.includes(id)));
    } else {
      // Select all visible rows
      const newSelected = [...selection.selected];
      allRowIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      selection.onChange(newSelected);
    }
  };

  const toggleExpansion = (row: any, index: number) => {
    if (!expandable) return;
    const rowId = getRowId(row, index);
    expandable.onExpand(rowId);
  };

  // Calculate if all visible rows are selected
  const allVisibleSelected = selection ? paginatedData.length > 0 &&
    paginatedData.every((row, index) => isRowSelected(row, startIndex + index)) : false;
  const someVisibleSelected = selection ? paginatedData.some((row, index) => isRowSelected(row, startIndex + index)) : false;


  // Loading and error states
  if (loading) {
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-morandi-primary" />
          <span className="ml-2 text-morandi-secondary">載入中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)}>
        <div className="flex items-center justify-center py-8 text-red-500">
          <span>錯誤: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col h-full", className)}>
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-white border-b-2 border-morandi-gold/20">
            {/* 主標題行 */}
            <tr className="relative bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40">
              {/* Selection checkbox column */}
              {selection && (
                <th className="w-12 py-2.5 px-4 text-xs">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected && !allVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
              )}

              {columns.map((column, index) => (
                <th key={column.key} className={cn(
                  "text-left py-2.5 px-4 text-xs relative",
                  index === columns.length - 1 && "pl-4 pr-1"
                )}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-morandi-gold/30"></div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent font-medium text-morandi-secondary hover:text-morandi-primary transition-colors [&_svg]:!size-[14px]"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                        {getSortIcon(column.key)}
                      </Button>
                    ) : (
                      <span className="font-medium text-morandi-secondary">{column.label}</span>
                    )}
                    {index === columns.length - 1 && columns.some(col => col.filterable) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter size={12} className={cn(
                          "transition-colors",
                          showFilters ? "text-morandi-primary" : "text-morandi-muted"
                        )} />
                      </Button>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {actions && (
                <th className="text-left py-2.5 px-4 text-xs">
                  <span className="font-medium text-morandi-secondary">操作</span>
                </th>
              )}
            </tr>

            {/* 篩選行 */}
            {showFilters && (
              <tr className="bg-background border-t border-border/50">
                {/* Selection checkbox column - empty */}
                {selection && <td className="py-2 px-4"></td>}

                {columns.map((column) => (
                  <td key={column.key} className="py-2 px-4">
                    {column.filterable ? (
                      column.filterType === 'select' ? (
                        <Select
                          value={filters[column.key] || '__all__'}
                          onValueChange={(value) => updateFilter(column.key, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={`選擇${column.label}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">全部{column.label}</SelectItem>
                            {column.filterOptions?.map((option) => (
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
                          onChange={(e) => updateFilter(column.key, e.target.value)}
                          className="h-8 text-xs"
                        />
                      )
                    ) : null}
                  </td>
                ))}

                {/* Actions column - empty */}
                {actions && <td className="py-2 px-4"></td>}

                {/* Expandable icon column - empty */}
                {expandable && <td className="py-2 px-4"></td>}
              </tr>
            )}
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={
                  columns.length +
                  (selection ? 1 : 0) +
                  (expandable ? 1 : 0) +
                  (actions ? 1 : 0)
                } className="py-8 px-6">
                  {emptyState}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const actualRowIndex = startIndex + index;
                const rowId = getRowId(row, actualRowIndex);
                const isSelected = isRowSelected(row, actualRowIndex);
                const isExpanded = isRowExpanded(row, actualRowIndex);
                const isDisabled = selection?.disabled?.(row) ?? false;

                return (
                  <React.Fragment key={rowId}>
                    <tr
                      className={cn(
                        "relative group border-b border-border/50 last:border-b-0",
                        isSelected && "bg-morandi-gold/10",
                        (onRowClick || onRowDoubleClick) && !selection && !expandable && "cursor-pointer",
                        hoverable && "hover:bg-morandi-container/20 transition-all duration-150",
                        striped && index % 2 === 0 && "bg-morandi-container/5",
                        rowClassName?.(row)
                      )}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on selection checkbox or expand button
                        if (selection || expandable) return;
                        onRowClick?.(row, actualRowIndex);
                      }}
                      onDoubleClick={() => onRowDoubleClick?.(row, actualRowIndex)}
                    >
                      {/* Selection checkbox */}
                      {selection && (
                        <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={() => toggleSelection(row, actualRowIndex)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}

                      {/* Data columns */}
                      {columns.map((column, colIndex) => (
                        <td
                          key={column.key}
                          className={cn(
                            "py-1.5 sm:py-2",
                            colIndex === columns.length - 1 ? "pl-4 pr-1" : "px-3 sm:px-4",
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right",
                            column.className
                          )}
                          style={{ width: column.width }}
                        >
                          {column.render ? column.render(row[column.key], row) : (
                            <div className="text-[10px] sm:text-xs text-morandi-primary">
                              {row[column.key]}
                            </div>
                          )}
                        </td>
                      ))}

                      {/* Actions column */}
                      {actions && (
                        <td className="py-1.5 sm:py-2 px-3 sm:px-4">
                          <div onClick={(e) => e.stopPropagation()}>
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded content row */}
                    {expandable && isExpanded && (
                      <tr>
                        <td colSpan={
                          columns.length +
                          (selection ? 1 : 0) +
                          (expandable ? 1 : 0) +
                          (actions ? 1 : 0)
                        } className="py-0 px-0">
                          <div className="bg-morandi-container/20 p-4 border-t border-border/50">
                            {expandable.renderExpanded(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁控制 - 永遠顯示 */}
      {processedData.length > 0 && (
        <div className="p-2 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 border-t border-border bg-morandi-container/5">
          {/* 左側：資料統計 */}
          <div className="text-[10px] sm:text-xs text-morandi-secondary">
            顯示第 <span className="font-medium text-morandi-primary">{startIndex + 1}</span> 到 <span className="font-medium text-morandi-primary">{Math.min(startIndex + pageSize, processedData.length)}</span> 筆，
            共 <span className="font-medium text-morandi-primary">{processedData.length}</span> 筆資料
          </div>

          {/* 右側：分頁控制 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 每頁顯示筆數 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs text-morandi-secondary">每頁</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-14 sm:w-16 h-7 sm:h-8 text-[10px] sm:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] sm:text-xs text-morandi-secondary">筆</span>
            </div>

            {/* 分頁按鈕 - 只在有多頁時顯示 */}
            {totalPages > 1 && (
              <>
                <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1"></div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                >
                  上一頁
                </Button>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-[10px] sm:text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                >
                  下一頁
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 便利的 Hook 用於處理排序和篩選邏輯
export function useEnhancedTable<T>(
  originalData: T[],
  sortFunction?: (data: T[], column: string, direction: 'asc' | 'desc') => T[],
  filterFunction?: (data: T[], filters: Record<string, string>) => T[]
) {
  const [sortedData, setSortedData] = useState(originalData);
  const [filteredData, setFilteredData] = useState(originalData);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    if (sortFunction) {
      const sorted = sortFunction(filteredData, column, direction);
      setSortedData(sorted);
    }
  };

  const handleFilter = (filters: Record<string, string>) => {
    if (filterFunction) {
      const filtered = filterFunction(originalData, filters);
      setFilteredData(filtered);
      setSortedData(filtered);
    }
  };

  return {
    data: sortedData,
    handleSort,
    handleFilter
  };
}