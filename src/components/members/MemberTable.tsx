import React, { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Member } from '@/stores/types'

interface MemberTableProps {
  data: Member[]
  isEditMode: boolean
  handleEditModeChange: (index: number, field: keyof Member, value: string) => void
}

export const MemberTable = forwardRef<HTMLDivElement, MemberTableProps>(
  ({ data, isEditMode, handleEditModeChange }, ref) => {
    const tableColumns: TableColumn<Member>[] = [
      {
        key: '#',
        label: '#',
        render: (_, __, index) => <span className="px-2 py-1 text-muted-foreground">{index! + 1}</span>,
        width: '40px',
      },
      {
        key: 'name',
        label: '姓名',
        render: (value, row, index) =>
          isEditMode ? (
            <Input
              value={row.name || ''}
              onChange={e => handleEditModeChange(index!, 'name', e.target.value)}
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
        render: (value, row, index) =>
          isEditMode ? (
            <Input
              value={row.name_en || ''}
              onChange={e => handleEditModeChange(index!, 'name_en', e.target.value)}
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
        render: (value, row, index) =>
          isEditMode ? (
            <DatePicker
              value={row.birthday || ''}
              onChange={date => handleEditModeChange(index!, 'birthday', date)}
              placeholder="選擇日期"
              className="h-8 text-sm"
            />
          ) : (
            <span>{row.birthday ? new Date(row.birthday).toLocaleDateString() : '-'}</span>
          ),
      },
      {
        key: 'gender',
        label: '性別',
        width: '50px',
        align: 'center',
        render: value => <span>{value === 'M' ? '男' : value === 'F' ? '女' : '-'}</span>,
      },
      {
        key: 'id_number',
        label: '身分證字號',
        render: (value, row, index) =>
          isEditMode ? (
            <Input
              value={row.id_number || ''}
              onChange={e => handleEditModeChange(index!, 'id_number', e.target.value)}
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
        render: (value, row, index) =>
          isEditMode ? (
            <Input
              value={row.passport_number || ''}
              onChange={e => handleEditModeChange(index!, 'passport_number', e.target.value)}
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
        render: (value, row, index) =>
          isEditMode ? (
            <DatePicker
              value={row.passport_expiry || ''}
              onChange={date => handleEditModeChange(index!, 'passport_expiry', date)}
              placeholder="選擇日期"
              className="h-8 text-sm"
            />
          ) : (
            <span>{row.passport_expiry ? new Date(row.passport_expiry).toLocaleDateString() : '-'}</span>
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