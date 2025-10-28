import React from 'react';

export interface CellData {
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
  tourId?: string;
}

export interface SelectionRange {
  start: { _i: number; j: number };
  end: { _i: number; j: number };
}

export interface RoomUsage {
  bedCount: number;
  noBedCount: number;
  totalCount: number;
  capacity: number;
}

export type CellChange = {
  cell: CellData;
  row: number;
  col: number;
  value: unknown;
};
