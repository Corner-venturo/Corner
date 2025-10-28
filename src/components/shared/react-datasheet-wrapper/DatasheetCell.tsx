'use client';

import React from 'react';
import { X, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CellData, DataSheetColumn } from './types';
import { CORE_FIELD_KEYS, PROTECTED_FIELD_KEYS, ERROR_MESSAGES } from './constants';

interface DatasheetCellProps {
  cell: CellData;
  row: number;
  col: number;
  visibleColumns: DataSheetColumn[];
  hoveredColumn: number | null;
  enableColumnResize: boolean;
  orderFilter?: string;
  roomOptions?: Array<{ value: string; label: string; capacity: number; room_type: string }>;
  getRoomUsage?: (roomValue: string) => { bedCount: number; noBedCount: number; totalCount: number; capacity: number };
  isRoomFull?: (roomValue: string, excludeMemberId?: string) => boolean;
  onColumnHide?: (columnKey: string) => void;
  onColumnDelete?: (columnKey: string) => void;
  onColumnResize?: (e: React.MouseEvent, columnKey: string) => void;
}

export function DatasheetCell({
  cell,
  row,
  col,
  visibleColumns,
  hoveredColumn,
  enableColumnResize,
  orderFilter,
  roomOptions = [],
  getRoomUsage,
  isRoomFull,
  onColumnHide,
  onColumnDelete,
  onColumnResize
}: DatasheetCellProps) {
  // Header row rendering
  if (row === 0) {
    const column = visibleColumns[col];
    if (!column) return null;

    const isCoreField = CORE_FIELD_KEYS.includes(column.key);
    const isCustomField = !PROTECTED_FIELD_KEYS.includes(column.key);
    const canHide = !isCoreField;

    return (
      <div
        className="relative w-full h-full flex items-center justify-center group"
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      >
        <span className="text-xs font-medium text-morandi-secondary">{cell.value}</span>

        {/* Column resize handle */}
        {enableColumnResize && hoveredColumn === col && (
          <div
            onMouseDown={(e) => onColumnResize?.(e, column.key)}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-morandi-gold opacity-70 hover:opacity-100 z-20 border-r border-morandi-gold"
            title="拖曳調整欄位寬度"
          />
        )}

        {/* Column action buttons */}
        {hoveredColumn === col && (canHide || isCustomField) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-1 bg-white shadow-sm rounded px-1 z-10 border border-gray-200">
            {canHide && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onColumnHide && column) {
                    onColumnHide(column.key);
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="隱藏欄位"
              >
                <EyeOff size={12} className="text-gray-500" />
              </button>
            )}
            {isCustomField && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onColumnDelete && column) {
                    onColumnDelete(column.key);
                  }
                }}
                className="p-1 hover:bg-red-100 rounded"
                title="刪除欄位"
              >
                <X size={12} className="text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Error display
  if (cell.displayValue === ERROR_MESSAGES.FORMULA_ERROR) {
    return <span className="text-red-500 text-xs">{ERROR_MESSAGES.FORMULA_ERROR_DISPLAY}</span>;
  }

  // Special handling for room assignment
  if (col < visibleColumns.length) {
    const column = visibleColumns[col];
    if (column.key === 'assignedRoom' && orderFilter && cell.rowData?.id) {
      const member = cell.rowData;
      return (
        <select
          value={
            member.isChildNoBed
              ? (member.assignedRoom ? `no-bed-${member.assignedRoom}` : 'no-bed')
              : (member.assignedRoom || '')
          }
          onChange={(e) => {
            // Handler should be passed as prop if needed
          }}
          className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-morandi-gold"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">未分配</option>
          <option value="no-bed">不佔床</option>

          {/* Regular room options */}
          {roomOptions.map(roomOption => {
            const usage = getRoomUsage
              ? getRoomUsage(roomOption.value)
              : { bedCount: 0, noBedCount: 0, totalCount: 0, capacity: roomOption.capacity };
            const isFull = isRoomFull ? isRoomFull(roomOption.value, member.id as string) : false;
            const isCurrentRoom = member.assignedRoom === roomOption.value && !member.isChildNoBed;

            if (isFull && !isCurrentRoom) {
              return null;
            }

            return (
              <option key={roomOption.value} value={roomOption.value}>
                {roomOption.value} ({usage.bedCount}/{usage.capacity}床
                {usage.noBedCount > 0 ? ` +${usage.noBedCount}不佔床` : ''})
              </option>
            );
          }).filter(Boolean)}

          {/* No-bed room options */}
          {member.isChildNoBed &&
            roomOptions.map(roomOption => (
              <option key={`no-bed-${roomOption.value}`} value={`no-bed-${roomOption.value}`}>
                不佔床 - {roomOption.value}
              </option>
            ))}
        </select>
      );
    }
  }

  // Formula result display
  if (cell.displayValue !== cell.value) {
    return <span className="text-morandi-primary text-xs">{cell.displayValue}</span>;
  }

  // Default cell display
  return <span className="text-morandi-primary text-xs">{cell.value}</span>;
}
