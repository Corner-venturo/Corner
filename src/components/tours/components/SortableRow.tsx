'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { OrderMember, VisibleColumns } from '../types'

interface SortableRowProps {
  member: OrderMember
  index: number
  customFields: string[]
  getFieldValue: (memberId: string, fieldName: string) => string
  updateFieldValue: (memberId: string, fieldName: string, value: string) => void
  isDragMode: boolean
  orderCode: string
  dietaryRestrictions: string
  onDietaryChange: (customerId: string | null, value: string) => void
  visibleColumns: VisibleColumns
  roomAssignment: string
  vehicleAssignment: string
}

export function SortableRow({
  member,
  index,
  customFields,
  getFieldValue,
  updateFieldValue,
  isDragMode,
  orderCode,
  dietaryRestrictions,
  onDietaryChange,
  visibleColumns,
  roomAssignment,
  vehicleAssignment,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-morandi-gold/10 hover:bg-morandi-container/10 ${
        index % 2 === 0 ? 'bg-status-info-bg' : 'bg-status-success-bg'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle */}
      {isDragMode && (
        <td className="px-2 py-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical size={16} className="text-morandi-text-light" />
        </td>
      )}

      <td className="px-2 py-2 text-xs text-morandi-text-light">
        {index + 1}
      </td>
      <td className="px-2 py-2">{member.chinese_name || '-'}</td>
      {visibleColumns.passport_name && (
        <td className="px-2 py-2">{member.passport_name || '-'}</td>
      )}
      {visibleColumns.birth_date && (
        <td className="px-2 py-2 text-xs">{member.birth_date || '-'}</td>
      )}
      {visibleColumns.gender && (
        <td className="px-2 py-2 text-xs">
          {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
        </td>
      )}
      {visibleColumns.passport_number && (
        <td className="px-2 py-2 text-xs">{member.passport_number || '-'}</td>
      )}
      {/* Dietary restrictions - fixed field, synced to customers */}
      {visibleColumns.dietary && (
        <td className="px-2 py-2 bg-status-warning-bg">
          <input
            type="text"
            value={dietaryRestrictions}
            onChange={e => onDietaryChange(member.customer_id, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none focus:bg-status-warning-bg px-1 py-0.5 rounded"
            placeholder="-"
            disabled={isDragMode}
          />
        </td>
      )}
      {/* Room assignment */}
      {visibleColumns.room && (
        <td className="px-2 py-2 text-xs bg-status-success-bg">
          <span className={roomAssignment ? 'text-status-success' : 'text-morandi-text-light'}>
            {roomAssignment || '未分房'}
          </span>
        </td>
      )}
      {/* Vehicle assignment */}
      {visibleColumns.vehicle && (
        <td className="px-2 py-2 text-xs bg-status-info-bg">
          <span className={vehicleAssignment ? 'text-status-info' : 'text-morandi-text-light'}>
            {vehicleAssignment || '未分車'}
          </span>
        </td>
      )}
      {customFields.map(field => (
        <td key={field} className="px-2 py-2 bg-white">
          <input
            type="text"
            value={getFieldValue(member.id, field)}
            onChange={e => updateFieldValue(member.id, field, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none focus:bg-morandi-container/20 px-1 py-0.5 rounded"
            placeholder="-"
            disabled={isDragMode}
          />
        </td>
      ))}
    </tr>
  )
}
