'use client'

import React from 'react'
import { Tour } from '@/stores/types'
import { useTourMemberEditor } from './hooks/useTourMemberEditor'
import { MemberTable } from './components/MemberTable'
import { MemberStats } from './components/MemberStats'
import { EntryCardDialog } from './components/EntryCardDialog'

interface TourMembersProps {
  tour: Tour
  orderFilter?: string
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
}

export const TourMembers = React.memo(function TourMembers({
  tour,
  orderFilter,
  triggerAdd,
  onTriggerAddComplete,
}: TourMembersProps) {
  const {
    tableMembers,
    editingCell,
    draggedRow,
    isNavigating,
    inputRef,
    roomAssignments,
    showEntryCardDialog,
    entryCardSettings,
    editableFields,
    tourOrders,
    totalMembers,
    completedMembers,
    setEditingCell,
    setIsNavigating,
    setShowEntryCardDialog,
    setEntryCardSettings,
    startCellEdit,
    updateCellValue,
    deleteRow,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useTourMemberEditor(tour, orderFilter, triggerAdd, onTriggerAddComplete)

  if (tourOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-morandi-secondary">此旅遊團尚無訂單</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <MemberTable
        members={tableMembers}
        tourOrders={tourOrders as any}
        editingCell={editingCell}
        draggedRow={draggedRow}
        isNavigating={isNavigating}
        inputRef={inputRef as any}
        roomAssignments={roomAssignments}
        editableFields={editableFields}
        onCellClick={startCellEdit}
        onCellValueChange={updateCellValue}
        onCellBlur={() => setEditingCell(null)}
        onDelete={deleteRow}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        setEditingCell={setEditingCell}
        setIsNavigating={setIsNavigating}
      />

      <MemberStats
        members={tableMembers}
        tourOrders={tourOrders as any}
        totalMembers={totalMembers}
        completedMembers={completedMembers}
        orderFilter={orderFilter}
      />

      <EntryCardDialog
        open={showEntryCardDialog}
        members={tableMembers}
        settings={entryCardSettings}
        onOpenChange={setShowEntryCardDialog}
        onSettingsChange={setEntryCardSettings}
      />
    </div>
  )
})
