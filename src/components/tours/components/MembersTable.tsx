'use client'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Trash2 } from 'lucide-react'
import { OrderMember, VisibleColumns } from '../types'
import { SortableRow } from './SortableRow'

interface MembersTableProps {
  members: OrderMember[]
  customFields: string[]
  getFieldValue: (memberId: string, fieldName: string) => string
  updateFieldValue: (memberId: string, fieldName: string, value: string) => void
  isDragMode: boolean
  orderCodes: Record<string, string>
  getDietaryRestrictions: (customerId: string | null) => string
  onDietaryChange: (customerId: string | null, value: string) => void
  visibleColumns: VisibleColumns
  roomAssignments: Record<string, string>
  vehicleAssignments: Record<string, string>
  onDragEnd: (event: DragEndEvent) => void
  onDeleteField: (fieldName: string) => void
}

export function MembersTable({
  members,
  customFields,
  getFieldValue,
  updateFieldValue,
  isDragMode,
  orderCodes,
  getDietaryRestrictions,
  onDietaryChange,
  visibleColumns,
  roomAssignments,
  vehicleAssignments,
  onDragEnd,
  onDeleteField,
}: MembersTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 計算 sticky 位置
  const stickyLeftPositions = {
    drag: 0,
    index: isDragMode ? 40 : 0,
    name: isDragMode ? 72 : 32,
  }

  return (
    <div className="bg-white rounded-lg border border-morandi-gold/20 overflow-hidden">
      {/* 水平滾動容器 */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-morandi-container/30 border-b border-morandi-gold/20">
                {/* 固定欄位：拖拉手柄 */}
                {isDragMode && (
                  <th
                    className="w-10 sticky left-0 z-20 bg-morandi-container/30"
                    style={{ left: stickyLeftPositions.drag }}
                  />
                )}
                {/* 固定欄位：序號 */}
                <th
                  className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-8 sticky z-20 bg-morandi-container/30"
                  style={{ left: stickyLeftPositions.index }}
                >
                  序
                </th>
                {/* 固定欄位：中文姓名 */}
                <th
                  className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 sticky z-20 bg-morandi-container/30 border-r border-morandi-gold/20"
                  style={{ left: stickyLeftPositions.name }}
                >
                  中文姓名
                </th>
                {/* 可滾動欄位 */}
                {visibleColumns.passport_name && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-40">護照拼音</th>}
                {visibleColumns.birth_date && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24">生日</th>}
                {visibleColumns.gender && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-10">性別</th>}
                {visibleColumns.passport_number && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24">護照號碼</th>}
                {visibleColumns.dietary && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-status-warning-bg">飲食禁忌</th>}
                {visibleColumns.room && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-status-success-bg">分房</th>}
                {visibleColumns.vehicle && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-status-info-bg">分車</th>}
                {visibleColumns.notes && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-48 bg-purple-50">備註</th>}
                {customFields.map(field => (
                  <th key={field} className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs bg-morandi-gold/10 relative group min-w-[100px]">
                    <div className="flex items-center justify-between gap-2">
                      <span>{field}</span>
                      {!isDragMode && (
                        <button
                          onClick={() => onDeleteField(field)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-status-danger-bg rounded"
                          title="刪除欄位"
                        >
                          <Trash2 size={12} className="text-status-danger" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {members.map((member, index) => (
                <SortableRow
                  key={member.id}
                  member={member}
                  index={index}
                  customFields={customFields}
                  getFieldValue={getFieldValue}
                  updateFieldValue={updateFieldValue}
                  isDragMode={isDragMode}
                  orderCode={orderCodes[member.order_id] || '-'}
                  dietaryRestrictions={getDietaryRestrictions(member.customer_id)}
                  onDietaryChange={onDietaryChange}
                  visibleColumns={visibleColumns}
                  roomAssignment={roomAssignments[member.id] || ''}
                  vehicleAssignment={vehicleAssignments[member.id] || ''}
                  stickyLeftPositions={stickyLeftPositions}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
        </DndContext>
      </div>
    </div>
  )
}
