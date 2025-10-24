'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactDataSheet from 'react-datasheet';
import { calculateFormula, getMemberContext } from '@/lib/formula-calculator';
import { cn } from '@/lib/utils';
import { X, EyeOff } from 'lucide-react';

// 引入 react-datasheet 的 CSS (我們會自訂樣式)
import 'react-datasheet/lib/react-datasheet.css';

interface CellData {
  value: unknown;
  displayValue?: unknown;
  readOnly?: boolean;
  key?: string;
  rowData?: Record<string, unknown>;
  colKey?: string;
  width?: number;
  columnKey?: string;
  rowIndex?: number;
  className?: string;
}

export interface DataSheetColumn {
  key: string;
  label: string;
  width?: number;
  readOnly?: boolean;
  dataRenderer?: (value: unknown, row: Record<string, unknown>, col: string) => string;
  valueRenderer?: (cell: CellData, row: number, col: number) => React.ReactNode;
  dataEditor?: React.ComponentType<unknown>;
  type?: 'text' | 'select' | 'readonly';
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  onCellClick?: (rowData: Record<string, unknown>, field: string) => void;
}

export interface DataSheetProps {
  columns: DataSheetColumn[];
  data: Record<string, unknown>[];
  tour_add_ons?: Record<string, unknown>[];
  tourPrice?: number;
  onCellsChanged?: (changes: Array<{ cell: CellData; row: number; col: number; value: unknown }>) => void;
  onDataUpdate?: (newData: Record<string, unknown>[]) => void;
  onColumnDelete?: (columnKey: string) => void;
  onColumnHide?: (columnKey: string) => void;
  hiddenColumns?: string[];
  className?: string;
  orderFilter?: string;
  roomOptions?: Array<{ value: string; label: string; capacity: number; room_type: string }>;
  onRoomAssign?: (member_id: string, roomValue: string) => void;
  getRoomUsage?: (roomValue: string) => { bedCount: number; noBedCount: number; totalCount: number; capacity: number };
  isRoomFull?: (roomValue: string, excludeMemberId?: string) => boolean;
  enableColumnResize?: boolean;
  enableRowDrag?: boolean;
  tour_id?: string;
  tourId?: string; // 相容舊名稱
}

export function ReactDataSheetWrapper({
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
  tourId
}: DataSheetProps) {
  // 統一使用 tour_id (優先使用 tour_id，其次 tourId)
  const finalTourId = tour_id || tourId;
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{start: {i: number, j: number}, end: {i: number, j: number}} | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [draggedRow, setDraggedRow] = useState<number | null>(null);

  // 過濾掉隱藏的欄位
  const visibleColumns = useMemo(() => {
    return columns.filter(col => !hiddenColumns.includes(col.key));
  }, [columns, hiddenColumns]);

  // 從 localStorage 載入欄位寬度
  useEffect(() => {
    if (finalTourId) {
      const savedWidths = localStorage.getItem(`columnWidths_${finalTourId}`);
      if (savedWidths) {
        try {
          setColumnWidths(JSON.parse(savedWidths));
        } catch (e) {
          console.warn('Failed to parse saved column widths:', e);
        }
      }
    }
  }, [finalTourId]);

  // 儲存欄位寬度到 localStorage
  const saveColumnWidth = useCallback((columnKey: string, width: number) => {
    const newWidths = { ...columnWidths, [columnKey]: width };
    setColumnWidths(newWidths);
    if (finalTourId) {
      localStorage.setItem(`columnWidths_${finalTourId}`, JSON.stringify(newWidths));
    }
  }, [columnWidths, finalTourId]);

  // 處理欄位寬度調整
  const handleColumnResize = useCallback((e: React.MouseEvent, columnKey: string) => {
    if (!enableColumnResize) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const column = visibleColumns.find(col => col.key === columnKey);
    const currentWidth = columnWidths[columnKey] || column?.width || 100;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, currentWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      const finalWidth = columnWidths[columnKey];
      if (finalWidth) {
        saveColumnWidth(columnKey, finalWidth);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [enableColumnResize, visibleColumns, columnWidths, saveColumnWidth]);

  // 處理行拖曳
  const handleRowDragStart = useCallback((e: React.DragEvent, rowIndex: number) => {
    if (!enableRowDrag || rowIndex === 0) return; // 不允許拖曳標題行
    setDraggedRow(rowIndex - 1); // 減 1 因為第 0 行是標題
    e.dataTransfer.effectAllowed = 'move';
  }, [enableRowDrag]);

  const handleRowDragOver = useCallback((e: React.DragEvent) => {
    if (!enableRowDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [enableRowDrag]);

  const handleRowDrop = useCallback((e: React.DragEvent, dropRowIndex: number) => {
    if (!enableRowDrag || draggedRow === null || dropRowIndex === 0) return;

    e.preventDefault();
    const dropIndex = dropRowIndex - 1; // 減 1 因為第 0 行是標題

    if (draggedRow === dropIndex) {
      setDraggedRow(null);
      return;
    }

    const newData = [...data];
    const draggedItem = newData[draggedRow];
    newData.splice(draggedRow, 1);
    newData.splice(dropIndex, 0, draggedItem);

    if (onDataUpdate) {
      onDataUpdate(newData);
    }

    setDraggedRow(null);
  }, [enableRowDrag, draggedRow, data, onDataUpdate]);

  // 將我們的資料轉換為 react-datasheet 格式
  const sheetData = useMemo(() => {
    // 創建標題行
    const headerRow = visibleColumns.map((col, colIndex) => {
      const width = columnWidths[col.key] || col.width || 100;
      return {
        value: col.label,
        readOnly: true,
        className: 'datasheet-header',
        width: width,
        columnKey: col.key,
        colIndex: colIndex
      };
    });

    // 創建資料行
    const dataRows = data.map((row, rowIndex) => {
      return visibleColumns.map((col, colIndex) => {
        const value = row[col.key] || '';
        const isReadOnly = col.readOnly;
        const width = columnWidths[col.key] || col.width || 100;

        // 如果是公式欄位，計算結果
        let displayValue = value;
        if (typeof value === 'string' && value.startsWith('=')) {
          const context = getMemberContext(row, tour_add_ons, tourPrice);
          displayValue = calculateFormula(value, context);
        }

        return {
          value: value,
          displayValue: displayValue,
          readOnly: isReadOnly || (col.key === 'assignedRoom' && orderFilter),
          key: `${rowIndex}-${colIndex}`,
          rowData: row,
          colKey: col.key,
          width: width,
          columnKey: col.key,
          rowIndex: rowIndex,
          className: cn(
            'datasheet-cell',
            isReadOnly && 'datasheet-readonly',
            typeof value === 'string' && value.startsWith('=') && 'datasheet-formula',
            draggedRow === rowIndex && 'dragging'
          )
        };
      });
    });

    return [headerRow, ...dataRows];
  }, [visibleColumns, data, tour_add_ons, tourPrice, columnWidths, draggedRow, orderFilter]);

  // 處理單元格變更
  const handleCellsChanged = useCallback((changes: Array<{ cell: CellData; row: number; col: number; value: unknown }>) => {
    if (!onDataUpdate) return;

    const newData = [...data];

    changes.forEach(({ cell, row, col, value }) => {
      if (row === 0) return; // 跳過標題行

      const dataRowIndex = row - 1;
      const column = visibleColumns[col];

      if (column && newData[dataRowIndex]) {
        newData[dataRowIndex] = {
          ...newData[dataRowIndex],
          [column.key]: value
        };
      }
    });

    onDataUpdate(newData);

    if (onCellsChanged) {
      onCellsChanged(changes);
    }
  }, [data, visibleColumns, onDataUpdate, onCellsChanged]);

  // 自訂值渲染器
  const valueRenderer = useCallback((cell: CellData, row: number, col: number) => {
    // 如果是標題行，顯示帶有 hover 控制的標題
    if (row === 0) {
      const column = visibleColumns[col];
      if (!column) return null;

      // 核心欄位不允許刪除
      const isCoreField = ['index', 'name', 'idNumber'].includes(column.key);
      // 自定義欄位可以刪除
      const isCustomField = !['index', 'name', 'nameEn', 'birthday', 'age', 'gender', 'idNumber', 'passport_number', 'passportExpiry', 'reservationCode', 'assignedRoom'].includes(column.key);
      // 大部分欄位都可以隱藏（除了核心欄位）
      const canHide = !isCoreField;

      return (
        <div
          className="relative w-full h-full flex items-center justify-center group"
          onMouseEnter={() => setHoveredColumn(col)}
          onMouseLeave={() => setHoveredColumn(null)}
        >
          <span className="text-xs font-medium text-morandi-secondary">{cell.value}</span>

          {/* 列寬調整控制 - 顯示在所有欄位 */}
          {enableColumnResize && hoveredColumn === col && (
            <div
              onMouseDown={(e) => handleColumnResize(e, column.key)}
              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-morandi-gold opacity-70 hover:opacity-100 z-20 border-r border-morandi-gold"
              title="拖曳調整欄位寬度"
            />
          )}

          {/* 欄位操作按鈕 */}
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

    // 如果有錯誤，顯示錯誤
    if (cell.displayValue === '#ERROR') {
      return <span className="text-red-500 text-xs">錯誤</span>;
    }

    // 特殊欄位處理：分房欄位
    if (col < visibleColumns.length) {
      const column = visibleColumns[col];
      if (column.key === 'assignedRoom' && orderFilter && cell.rowData?.id) {
        // 訂單詳細頁面 - 顯示操作下拉選單
        const member = cell.rowData;
        return (
          <select
            value={
              member.isChildNoBed
                ? (member.assignedRoom ? `no-bed-${member.assignedRoom}` : 'no-bed')
                : (member.assignedRoom || '')
            }
            onChange={(e) => {
              if (onRoomAssign && member.id) {
                onRoomAssign(member.id, e.target.value);
              }
            }}
            className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-morandi-gold"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">未分配</option>
            <option value="no-bed">不佔床</option>

            {/* 一般房間選項 */}
            {roomOptions.map(roomOption => {
              const usage = getRoomUsage ? getRoomUsage(roomOption.value) : { bedCount: 0, noBedCount: 0, totalCount: 0, capacity: roomOption.capacity };
              const isFull = isRoomFull ? isRoomFull(roomOption.value, member.id) : false;
              const isCurrentRoom = member.assignedRoom === roomOption.value && !member.isChildNoBed;

              if (isFull && !isCurrentRoom) {
                return null;
              }

              return (
                <option key={roomOption.value} value={roomOption.value}>
                  {roomOption.value} ({usage.bedCount}/{usage.capacity}床{usage.noBedCount > 0 ? ` +${usage.noBedCount}不佔床` : ''})
                </option>
              );
            }).filter(Boolean)}

            {/* 不佔床 + 房間選項 */}
            {member.isChildNoBed && roomOptions.map(roomOption => (
              <option key={`no-bed-${roomOption.value}`} value={`no-bed-${roomOption.value}`}>
                不佔床 - {roomOption.value}
              </option>
            ))}
          </select>
        );
      }
    }

    // 如果是公式，顯示計算結果
    if (cell.displayValue !== cell.value) {
      return <span className="text-morandi-primary text-xs">{cell.displayValue}</span>;
    }

    // 一般顯示
    return <span className="text-morandi-primary text-xs">{cell.value}</span>;
  }, [visibleColumns, hoveredColumn, onColumnHide, onColumnDelete, enableColumnResize, getRoomUsage, handleColumnResize, isRoomFull, onRoomAssign, orderFilter, roomOptions]);

  // 增強鍵盤導航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+C 複製
    if (e.ctrlKey && e.key === 'c') {
      console.log('Copy triggered');
      // react-datasheet 內建支持
    }
    // Ctrl+V 貼上
    else if (e.ctrlKey && e.key === 'v') {
      console.log('Paste triggered');
      // react-datasheet 內建支持
    }
    // Delete 鍵清除內容
    else if (e.key === 'Delete') {
      console.log('Delete triggered');
      // 可以在此添加自定義清除邏輯
    }
  }, []);

  // 處理選擇範圍變更
  const handleSelect = useCallback((start: {i: number, j: number}, end?: {i: number, j: number}) => {
    if (!start) return;

    // 如果沒有 end，則設為與 start 相同（單個儲存格選擇）
    const endCell = end || start;

    setSelectedRange({ start, end: endCell });

    if (start.i !== endCell.i || start.j !== endCell.j) {
      console.log('Multi-cell selection:', start, 'to', endCell);
    }
  }, []);

  return (
    <div className={cn("excel-datasheet-wrapper", className)}>
      <style jsx>{`
        /* 確保組件本身支援橫向排列 */
        .excel-datasheet-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        /* 限制樣式只影響當前組件 */
        :global(.excel-datasheet-wrapper .data-grid-container) {
          font-family: inherit;
          font-size: 14px;
        }

        :global(.excel-datasheet-wrapper .data-grid) {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
        }

        :global(.excel-datasheet-wrapper .data-grid table) {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell) {
          border: 1px solid #e5e7eb;
          padding: 8px;
          min-height: 32px;
          background: white;
          text-align: left;
          vertical-align: middle;
          white-space: nowrap;
        }

        :global(.excel-datasheet-wrapper .data-grid td) {
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          min-width: 80px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.excel-datasheet-wrapper .data-grid th) {
          padding: 8px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
          text-align: center;
          min-width: 80px;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
          border: 2px solid #d97706;
          background: #fef3c7;
          outline: none;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.editing) {
          border: 2px solid #d97706;
          background: white;
          padding: 0;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.editing input) {
          width: 100%;
          height: 32px;
          padding: 4px 8px;
          border: none;
          outline: none;
          font-size: 14px !important;
          background: transparent;
          font-family: inherit;
          line-height: 1.4;
        }

        :global(.excel-datasheet-wrapper .datasheet-header) {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }

        :global(.excel-datasheet-wrapper .datasheet-readonly) {
          background: #fafafa;
          color: #6b7280;
        }

        :global(.excel-datasheet-wrapper .datasheet-formula) {
          background: #ecfdf5;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell:hover) {
          background: #f9fafb;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.read-only:hover) {
          background: #f3f4f6;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.selected) {
          background: rgba(217, 119, 6, 0.1);
          border: 1px solid #d97706;
        }

        :global(.excel-datasheet-wrapper .data-grid:focus-within .cell.selected) {
          outline: 2px solid #d97706;
          outline-offset: -2px;
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.copying) {
          border: 2px dashed #059669;
          background: rgba(5, 150, 105, 0.1);
        }

        :global(.excel-datasheet-wrapper .data-grid .cell.selected::after) {
          content: '';
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 6px;
          height: 6px;
          background: #d97706;
          cursor: crosshair;
          border: 1px solid white;
        }

        /* 列寬調整樣式 */
        :global(.excel-datasheet-wrapper .resize-handle) {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: col-resize;
          background: transparent;
          z-index: 10;
        }

        :global(.excel-datasheet-wrapper .resize-handle:hover) {
          background: #d97706;
        }

        /* 行拖曳樣式 */
        :global(.excel-datasheet-wrapper .data-grid tr.draggable) {
          cursor: move;
        }

        :global(.excel-datasheet-wrapper .data-grid tr.draggable:hover) {
          background: rgba(217, 119, 6, 0.05);
        }

        :global(.excel-datasheet-wrapper .data-grid tr.dragging) {
          opacity: 0.5;
          background: rgba(217, 119, 6, 0.1);
          border-left: 3px solid #d97706;
        }

        /* 優化表格布局 */
        :global(.excel-datasheet-wrapper .data-grid table) {
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
        }

        :global(.excel-datasheet-wrapper .data-grid td) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        :global(.excel-datasheet-wrapper .data-grid th) {
          position: relative;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          user-select: none;
        }
      `}</style>

      <div
        onKeyDown={(e) => {
          handleKeyDown(e);
          // 阻止方向鍵滾動頁面
          if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        tabIndex={0}
      >
        {/* @ts-ignore - ReactDataSheet 型別定義不完整 */}
        <ReactDataSheet
          data={sheetData}
          onCellsChanged={handleCellsChanged}
          valueRenderer={valueRenderer}
          dataRenderer={(cell) => cell.value}
          onContextMenu={(e: any, cell: any, i: any, j: any) => e.preventDefault()}
          // 增強多儲存格選擇
          onSelect={handleSelect}
          // 處理複製貼上
          parsePaste={(str: any) => {
            return str.split(/\r\n|\n|\r/).map((row) => row.split('\t'));
          }}
          // 啟用 Excel 式功能
          tabBehaviour={'default'}
          // 自定義鍵盤導航
          onKeyDown={(e) => {
            // 阻止方向鍵滾動頁面
            if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          rowRenderer={(props) => {
            const rowIndex = props['data-row'];
            const isDraggable = enableRowDrag && rowIndex > 0; // 不允許拖曳標題行
            const isDragging = draggedRow === rowIndex - 1;

            return (
              <tr
                {...props}
                draggable={isDraggable}
                onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                onDragOver={handleRowDragOver}
                onDrop={(e) => handleRowDrop(e, rowIndex)}
                className={cn(
                  props.className,
                  isDragging && 'opacity-50 bg-morandi-gold/10',
                  isDraggable && 'hover:bg-morandi-gold/5 cursor-move'
                )}
                style={{
                  ...props.style,
                  borderLeft: isDragging ? '3px solid #d97706' : undefined
                }}
              />
            );
          }}
          cellRenderer={(props) => {
            // 過濾掉非 DOM 屬性
            const {
              editing,
              selected,
              updated,
              width,
              columnKey,
              rowIndex,
              attributesRenderer,
              valueRenderer,
              dataRenderer,
              ...tdProps
            } = props;
            const cellWidth = width || 100;

            return (
              <td
                {...tdProps}
                style={{
                  ...props.style,
                  padding: 0,
                  width: `${cellWidth}px`,
                  minWidth: `${cellWidth}px`,
                  maxWidth: `${cellWidth}px`
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
}

// 導出 react-datasheet 相關類型
export type { ReactDataSheet };
export default ReactDataSheet;