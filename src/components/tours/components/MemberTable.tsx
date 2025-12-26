'use client'

import React from 'react'
import { Users } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { MemberRow } from './MemberRow'
import { EditingMember, EditingCell } from '../hooks/useTourMemberEditor'

// 使用簡化的 Order 類型，僅包含此組件需要的欄位
interface TourOrder {
  id: string
  order_number?: string | null
  code?: string
  contact_person?: string
}

interface MemberTableProps {
  members: EditingMember[]
  tourOrders: TourOrder[]
  editingCell: EditingCell | null
  draggedRow: number | null
  isNavigating: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  roomAssignments: Record<string, string>
  editableFields: (keyof EditingMember)[]
  onCellClick: (rowIndex: number, field: keyof EditingMember) => void
  onCellValueChange: (value: string) => void
  onCellBlur: () => void
  onDelete: (index: number) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  setEditingCell: (cell: EditingCell | null) => void
  setIsNavigating: (value: boolean) => void
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  tourOrders,
  editingCell,
  draggedRow,
  isNavigating,
  inputRef,
  roomAssignments,
  editableFields,
  onCellClick,
  onCellValueChange,
  onCellBlur,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  setEditingCell,
  setIsNavigating,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof EditingMember, rowIndex: number) => {
    logger.log('Key pressed:', e.key, 'Field:', field, 'Row:', rowIndex)

    if (e.key === 'Enter') {
      e.preventDefault()
      const nextRow = rowIndex + 1
      if (nextRow < members.length) {
        setEditingCell({ rowIndex: nextRow, field })
      } else {
        setEditingCell(null)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const currentFieldIndex = editableFields.indexOf(field)
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          setEditingCell({ rowIndex, field: editableFields[currentFieldIndex - 1] })
        }
      } else {
        if (currentFieldIndex < editableFields.length - 1) {
          setEditingCell({ rowIndex, field: editableFields[currentFieldIndex + 1] })
        } else {
          const nextRow = rowIndex + 1
          if (nextRow < members.length) {
            setEditingCell({ rowIndex: nextRow, field: editableFields[0] })
          } else {
            setEditingCell(null)
          }
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      setIsNavigating(true)
      const nextRow = rowIndex + 1
      if (nextRow < members.length) {
        setEditingCell({ rowIndex: nextRow, field })
      }
      setTimeout(() => setIsNavigating(false), 100)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      setIsNavigating(true)
      const prevRow = rowIndex - 1
      if (prevRow >= 0) {
        setEditingCell({ rowIndex: prevRow, field })
      }
      setTimeout(() => setIsNavigating(false), 100)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      setIsNavigating(true)
      const currentFieldIndex = editableFields.indexOf(field)
      if (currentFieldIndex < editableFields.length - 1) {
        setEditingCell({ rowIndex, field: editableFields[currentFieldIndex + 1] })
      }
      setTimeout(() => setIsNavigating(false), 100)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      setIsNavigating(true)
      const currentFieldIndex = editableFields.indexOf(field)
      if (currentFieldIndex > 0) {
        setEditingCell({ rowIndex, field: editableFields[currentFieldIndex - 1] })
      }
      setTimeout(() => setIsNavigating(false), 100)
    }
  }

  return (
    <div className="overflow-hidden bg-card">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[1200px] bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-card sticky top-0 border-b-2 border-morandi-gold/20">
            <tr>
              <th className="w-[30px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20"></th>
              <th className="w-[40px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                序號
              </th>
              <th className="min-w-[80px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                姓名
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                英文姓名
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                生日
              </th>
              <th className="min-w-[60px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                年齡
              </th>
              <th className="min-w-[50px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                性別
              </th>
              <th className="min-w-[120px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                身分證字號
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                護照號碼
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                護照效期
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                所屬訂單
              </th>
              <th className="min-w-[80px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                聯絡人
              </th>
              <th className="min-w-[100px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                分房
              </th>
              <th className="w-[40px] py-2.5 px-4 text-xs font-medium text-morandi-secondary border border-morandi-gold/20">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => {
              const orderIndex = tourOrders.findIndex(order => order.id === member.order_id)
              const bgColor = orderIndex % 2 === 0 ? 'bg-white' : 'bg-status-info-bg'

              return (
                <MemberRow
                  key={member.id || 'row-' + index}
                  member={member}
                  index={index}
                  bgColor={bgColor}
                  isDragging={draggedRow === index}
                  editingCell={editingCell}
                  inputRef={inputRef}
                  isNavigating={isNavigating}
                  roomAssignments={roomAssignments}
                  editableFields={editableFields}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  onCellClick={onCellClick}
                  onCellValueChange={onCellValueChange}
                  onCellBlur={onCellBlur}
                  onKeyDown={handleKeyDown}
                  onDelete={onDelete}
                />
              )
            })}

            {members.length === 0 && (
              <tr>
                <td colSpan={14} className="py-12 text-center text-morandi-secondary">
                  <Users size={24} className="mx-auto mb-4 opacity-50" />
                  <p>尚無團員資料</p>
                  <p className="text-sm mt-1">點擊上方按鈕新增團員到指定訂單</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-morandi-secondary px-2 py-1 space-y-1">
        <p>• 點擊任意單元格即可編輯，自動儲存</p>
        <p>• 年齡和性別為自動計算欄位</p>
        <p>• 可拖拽行首圖示調整順序</p>
        <p>• 不同訂單用底色區分，方便識別</p>
      </div>
    </div>
  )
}
