'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  flexRender,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'

export { flexRender }
export type { ColumnDef }

interface UseDataTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  /** 啟用分頁 */
  enablePagination?: boolean
  /** 每頁行數 */
  pageSize?: number
  /** 啟用排序 */
  enableSorting?: boolean
  /** 啟用篩選 */
  enableFiltering?: boolean
  /** 啟用選取 */
  enableRowSelection?: boolean
  /** 啟用欄位顯示切換 */
  enableColumnVisibility?: boolean
}

/**
 * TanStack Table 封裝 Hook
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: 'name', header: '姓名' },
 *   { accessorKey: 'email', header: 'Email' },
 * ]
 *
 * function UsersTable({ users }: { users: User[] }) {
 *   const table = useDataTable({
 *     data: users,
 *     columns,
 *     enablePagination: true,
 *     enableSorting: true,
 *   })
 *
 *   return (
 *     <table>
 *       <thead>
 *         {table.getHeaderGroups().map(headerGroup => (
 *           <tr key={headerGroup.id}>
 *             {headerGroup.headers.map(header => (
 *               <th key={header.id}>
 *                 {flexRender(header.column.columnDef.header, header.getContext())}
 *               </th>
 *             ))}
 *           </tr>
 *         ))}
 *       </thead>
 *       <tbody>
 *         {table.getRowModel().rows.map(row => (
 *           <tr key={row.id}>
 *             {row.getVisibleCells().map(cell => (
 *               <td key={cell.id}>
 *                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 *               </td>
 *             ))}
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   )
 * }
 * ```
 */
export function useDataTable<TData>({
  data,
  columns,
  enablePagination = false,
  pageSize = 10,
  enableSorting = true,
  enableFiltering = false,
  enableRowSelection = false,
  enableColumnVisibility = false,
}: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
    }),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: { pageSize },
      },
    }),
    ...(enableRowSelection && {
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
    }),
    ...(enableColumnVisibility && {
      onColumnVisibilityChange: setColumnVisibility,
    }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  return {
    table,
    // 狀態
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    // Setters
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
    setGlobalFilter,
    // 便捷方法
    selectedRows: table.getSelectedRowModel().rows,
    pageCount: table.getPageCount(),
    currentPage: table.getState().pagination.pageIndex + 1,
  }
}

/**
 * 建立 select 欄位的 helper
 */
export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}
