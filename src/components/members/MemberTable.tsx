import React, { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'

// 允許任何包含 id 的物件（用於編輯中的成員，可能有額外的 index, age 等欄位）
type MemberData = Record<string, unknown> & { id?: string }

interface MemberTableProps {
  data: MemberData[]
  isEditMode: boolean
  handleEditModeChange: (index: number, field: string, value: string) => void
  // 可選 props（為了相容 OrderMemberView/TourMemberView 的傳入，但本組件不使用）
  columns?: unknown
  handleDataUpdate?: (data: unknown[]) => void
}

export const MemberTable = forwardRef<HTMLDivElement, MemberTableProps>(
  ({ data, isEditMode, handleEditModeChange }, ref) => {
    // 根據 row.id 找到 index
    const getIndex = (row: MemberData) => data.findIndex(m => m.id === row.id)

    const tableColumns: TableColumn<MemberData>[] = [
      {
        key: '#',
        label: '#',
        render: (_value: unknown, row: MemberData) => (
          <span className="px-2 py-1 text-muted-foreground">{getIndex(row) + 1}</span>
        ),
        width: '40px',
      },
      {
        key: 'name',
        label: '姓名',
        render: (value: unknown, row: MemberData) =>
          isEditMode ? (
            <Input
              value={String(row.name || '')}
              onChange={e => handleEditModeChange(getIndex(row), 'name', e.target.value)}
              placeholder="姓名"
              className="h-8 text-sm"
            />
          ) : (
            <span>{String(value || '')}</span>
          ),
      },
      {
        key: 'name_en',
        label: '英文姓名',
        render: (value: unknown, row: MemberData) =>
          isEditMode ? (
            <Input
              value={String(row.name_en || '')}
              onChange={e => handleEditModeChange(getIndex(row), 'name_en', e.target.value)}
              placeholder="英文姓名"
              className="h-8 text-sm"
            />
          ) : (
            <span>{String(value || '')}</span>
          ),
      },
      {
        key: 'birthday',
        label: '生日',
        render: (_value: unknown, row: MemberData) =>
          isEditMode ? (
            <DatePicker
              value={String(row.birthday || '')}
              onChange={date => handleEditModeChange(getIndex(row), 'birthday', date)}
              placeholder="選擇日期"
              className="h-8 text-sm"
            />
          ) : (
            <span>{row.birthday ? new Date(String(row.birthday)).toLocaleDateString() : '-'}</span>
          ),
      },
      {
        key: 'gender',
        label: '性別',
        width: '50px',
        align: 'center',
        render: (value: unknown) => (
          <span>{value === 'M' ? '男' : value === 'F' ? '女' : '-'}</span>
        ),
      },
      {
        key: 'id_number',
        label: '身分證字號',
        render: (value: unknown, row: MemberData) =>
          isEditMode ? (
            <Input
              value={String(row.id_number || '')}
              onChange={e => handleEditModeChange(getIndex(row), 'id_number', e.target.value)}
              placeholder="身分證字號"
              className="h-8 text-sm font-mono"
            />
          ) : (
            <span className="font-mono">{String(value || '')}</span>
          ),
      },
      {
        key: 'passport_number',
        label: '護照號碼',
        render: (value: unknown, row: MemberData) =>
          isEditMode ? (
            <Input
              value={String(row.passport_number || '')}
              onChange={e => handleEditModeChange(getIndex(row), 'passport_number', e.target.value)}
              placeholder="護照號碼"
              className="h-8 text-sm font-mono"
            />
          ) : (
            <span className="font-mono">{String(value || '')}</span>
          ),
      },
      {
        key: 'passport_expiry',
        label: '護照效期',
        render: (_value: unknown, row: MemberData) =>
          isEditMode ? (
            <DatePicker
              value={String(row.passport_expiry || '')}
              onChange={date => handleEditModeChange(getIndex(row), 'passport_expiry', date)}
              placeholder="選擇日期"
              className="h-8 text-sm"
            />
          ) : (
            <span>{row.passport_expiry ? new Date(String(row.passport_expiry)).toLocaleDateString() : '-'}</span>
          ),
      },
    ]

    return (
      <div ref={ref}>
        <EnhancedTable columns={tableColumns} data={data} striped hoverable={false} />
      </div>
    )
  },
)

MemberTable.displayName = 'MemberTable'