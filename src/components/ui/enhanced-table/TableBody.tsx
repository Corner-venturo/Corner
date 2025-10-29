'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TableColumn, SelectionConfig, ExpandableConfig } from './types';

interface TableBodyProps {
  columns: TableColumn[];
  paginatedData: unknown[];
  startIndex: number;
  emptyState?: React.ReactNode;
  selection?: SelectionConfig;
  expandable?: ExpandableConfig;
  actions?: (row: any) => React.ReactNode;
  rowClassName?: (row: any) => string;
  striped?: boolean;
  hoverable?: boolean;
  onRowClick?: (row: any, rowIndex: number) => void;
  onRowDoubleClick?: (row: any, rowIndex: number) => void;
  getRowId: (row: any, index: number) => string;
  isRowSelected: (row: any, index: number) => boolean;
  isRowExpanded: (row: any, index: number) => boolean;
  toggleSelection: (row: any, index: number) => void;
}

export function TableBody({
  columns,
  paginatedData,
  startIndex,
  emptyState,
  selection,
  expandable,
  actions,
  rowClassName,
  striped,
  hoverable,
  onRowClick,
  onRowDoubleClick,
  getRowId,
  isRowSelected,
  isRowExpanded,
  toggleSelection,
}: TableBodyProps) {
  if (paginatedData.length === 0) {
    return (
      <tbody>
        <tr className="h-[60vh]">
          <td colSpan={
            columns.length +
            (selection ? 1 : 0) +
            (expandable ? 1 : 0) +
            (actions ? 1 : 0)
          } className="py-12 px-6 text-center text-sm text-morandi-secondary align-top">
            {emptyState || (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-morandi-secondary">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm">目前沒有資料</p>
              </div>
            )}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {paginatedData.map((row, index) => {
        const actualRowIndex = startIndex + index;
        const rowId = getRowId(row, actualRowIndex);
        const isSelected = isRowSelected(row, actualRowIndex);
        const isExpanded = isRowExpanded(row, actualRowIndex);
        const isDisabled = selection?.disabled?.(row) ?? false;

        return (
          <React.Fragment key={rowId}>
            <tr
              className={cn(
                "relative group border-b border-border/40 last:border-b-0",
                isSelected && "bg-morandi-gold/10",
                (onRowClick || onRowDoubleClick) && !selection && !expandable && "cursor-pointer",
                hoverable && "hover:bg-morandi-container/20 transition-all duration-150",
                striped && index % 2 === 0 && "bg-morandi-container/10",
                rowClassName?.(row)
              )}
              onClick={() => {
                // Don't trigger row click if clicking on selection checkbox or expand button
                if (selection || expandable) return;
                onRowClick?.(row, actualRowIndex);
              }}
              onDoubleClick={() => onRowDoubleClick?.(row, actualRowIndex)}
            >
              {/* Selection checkbox */}
              {selection && (
                <td className="py-3 px-4 align-middle">
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
                    "py-3 px-4 text-sm text-morandi-primary",
                    colIndex === columns.length - 1 && "pr-4",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.render ? column.render((row as any)[column.key], row) : (
                    <span>{(row as any)[column.key]}</span>
                  )}
                </td>
              ))}

              {/* Actions column */}
              {actions && (
                <td className="py-3 px-4">
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
                  <div className="bg-morandi-container/20 p-4 border-t border-border/40">
                    {expandable.renderExpanded(row)}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  );
}
