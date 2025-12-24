'use client'

import React from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EditingMember, EditingCell } from '../hooks/useTourMemberEditor'

interface MemberRowProps {
  member: EditingMember
  index: number
  bgColor: string
  isDragging: boolean
  editingCell: EditingCell | null
  inputRef: React.RefObject<HTMLInputElement>
  isNavigating: boolean
  roomAssignments: Record<string, string>
  editableFields: (keyof EditingMember)[]
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onCellClick: (rowIndex: number, field: keyof EditingMember) => void
  onCellValueChange: (value: string) => void
  onCellBlur: () => void
  onKeyDown: (e: React.KeyboardEvent, field: keyof EditingMember, rowIndex: number) => void
  onDelete: (index: number) => void
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  index,
  bgColor,
  isDragging,
  editingCell,
  inputRef,
  isNavigating,
  roomAssignments,
  editableFields,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onCellClick,
  onCellValueChange,
  onCellBlur,
  onKeyDown,
  onDelete,
}) => {
  const renderCell = (field: keyof EditingMember) => {
    const isEditing = editingCell?.rowIndex === index && editingCell?.field === field
    const isAutoField =
      field === 'age' ||
      field === 'order_number' ||
      field === 'contact_person' ||
      field === 'assignedRoom'
    let value = member[field] as string

    if (field === 'gender') {
      value = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : ''
    } else if (field === 'age') {
      value = member.age > 0 ? member.age + '歲' : ''
    } else if (field === 'assignedRoom') {
      value = (member.id && roomAssignments[member.id]) || member.assignedRoom || '未分房'
    }

    if (isEditing) {
      let displayValue = ''
      if (field === 'age') {
        displayValue = ''
      } else if (field === 'gender') {
        displayValue = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : ''
      } else {
        displayValue = (member[field] as string) || ''
      }

      return (
        <input
          ref={inputRef}
          value={displayValue}
          onChange={e => onCellValueChange(e.target.value)}
          onBlur={() => {
            if (!isNavigating) {
              onCellBlur()
            }
          }}
          onKeyDown={e => onKeyDown(e, field, index)}
          type={field === 'birthday' || field === 'passportExpiry' ? 'date' : 'text'}
          className="h-8 w-full border-none outline-none bg-transparent p-0 px-2 focus:ring-0 focus:border-none"
          autoFocus
        />
      )
    }

    return (
      <div
        className={cn(
          'h-8 px-2 py-1 flex items-center w-full',
          isAutoField ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:bg-morandi-gold/5',
          member[field] && !isAutoField && 'font-medium'
        )}
        onClick={() => !isAutoField && onCellClick(index, field)}
      >
        {value || <span className="text-gray-300">點擊輸入</span>}
      </div>
    )
  }

  return (
    <tr
      key={member.id || 'row-' + index}
      className={cn(
        bgColor,
        isDragging && 'opacity-50',
        'hover:bg-morandi-gold/10 transition-colors cursor-pointer'
      )}
      draggable={true}
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <td className="border border-gray-300 text-center py-1">
        <GripVertical
          size={14}
          className="text-gray-400 cursor-grab active:cursor-grabbing mx-auto"
        />
      </td>
      <td className="border border-gray-300 text-center py-1">
        <span className="text-morandi-secondary font-medium">{index + 1}</span>
      </td>
      <td className="border border-gray-300 p-0">{renderCell('name')}</td>
      <td className="border border-gray-300 p-0">{renderCell('nameEn')}</td>
      <td className="border border-gray-300 p-0">{renderCell('birthday')}</td>
      <td className="border border-gray-300 p-0">{renderCell('age')}</td>
      <td className="border border-gray-300 p-0">{renderCell('gender')}</td>
      <td className="border border-gray-300 p-0">{renderCell('idNumber')}</td>
      <td className="border border-gray-300 p-0">{renderCell('passportNumber')}</td>
      <td className="border border-gray-300 p-0">{renderCell('passportExpiry')}</td>
      <td className="border border-gray-300 p-0">{renderCell('order_number')}</td>
      <td className="border border-gray-300 p-0">{renderCell('contact_person')}</td>
      <td className="border border-gray-300 p-0">{renderCell('assignedRoom')}</td>
      <td className="border border-gray-300 text-center py-1">
        <Button
          onClick={() => onDelete(index)}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-100"
        >
          <Trash2 size={12} className="text-red-500" />
        </Button>
      </td>
    </tr>
  )
}
