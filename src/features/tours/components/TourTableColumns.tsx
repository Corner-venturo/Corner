/**
 * TourTableColumns - Table column definitions for tours list
 */

'use client'

import { useMemo, useEffect } from 'react'
import { TableColumn } from '@/components/ui/enhanced-table'
import { Tour } from '@/stores/types'
import { cn } from '@/lib/utils'
import { DateCell } from '@/components/table-cells'
import { useUserStore } from '@/stores/user-store'

interface UseTourTableColumnsParams {
  getStatusColor: (status: string) => string
}

export function useTourTableColumns({ getStatusColor }: UseTourTableColumnsParams) {
  const { items: employees, fetchAll: fetchEmployees } = useUserStore()

  // 載入員工資料（用於顯示團控人員名稱）
  useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees()
    }
  }, [employees.length, fetchEmployees])

  // 建立 ID -> 名稱的映射
  const employeeMap = useMemo(() => {
    const map = new Map<string, string>()
    employees.forEach(emp => {
      map.set(emp.id, emp.display_name || emp.english_name || emp.employee_number)
    })
    return map
  }, [employees])

  return useMemo<TableColumn[]>(
    () => [
      {
        key: 'code',
        label: '團號',
        sortable: true,
        width: '110px',
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'name',
        label: '旅遊團名稱',
        sortable: true,
        width: '180px',
        render: (value) => <span className="text-sm text-morandi-primary">{String(value || "")}</span>,
      },
      {
        key: 'departure_date',
        label: '出發日期',
        sortable: true,
        width: '100px',
        render: (value, row) => {
          const tour = row as Tour
          return <DateCell date={tour.departure_date} showIcon={false} />
        },
      },
      {
        key: 'controller_id',
        label: '團控',
        sortable: false,
        width: '80px',
        render: (value, row) => {
          const tour = row as Tour
          const controllerName = tour.controller_id ? employeeMap.get(tour.controller_id) : null
          return (
            <span className="text-sm text-morandi-secondary">
              {controllerName || '-'}
            </span>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        width: '80px',
        render: (value, row) => {
          const tour = row as Tour
          const status = tour.status || ''
          return (
            <span className={cn('text-sm font-medium', getStatusColor(status))}>
              {status}
            </span>
          )
        },
      },
    ],
    [getStatusColor, employeeMap]
  )
}
