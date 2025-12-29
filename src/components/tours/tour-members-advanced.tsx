'use client'

import { useState, useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent } from '@dnd-kit/core'
import { Tour } from '@/types/tour.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Printer, Hotel, Bus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { TourRoomManager } from './tour-room-manager'
import { TourVehicleManager } from './tour-vehicle-manager'
import { TourHandoverPrint } from './tour-handover-print'

// Hooks
import { useTourMembers } from './hooks/useTourMembers'
import { useCustomFields } from './hooks/useCustomFields'
import { useRoomAssignments } from './hooks/useRoomAssignments'
import { useVehicleAssignments } from './hooks/useVehicleAssignments'

// Components
import { ColumnSettings } from './components/ColumnSettings'
import { AddFieldDialog } from './components/AddFieldDialog'
import { MembersTable } from './components/MembersTable'
import { EntryCardDialog } from './components/EntryCardDialog'

interface TourMembersAdvancedProps {
  tour: Tour
}

export function TourMembersAdvanced({ tour }: TourMembersAdvancedProps) {
  // State
  const [isDragMode, setIsDragMode] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false)
  const [showRoomManager, setShowRoomManager] = useState(false)
  const [showVehicleManager, setShowVehicleManager] = useState(false)
  const [showEntryCardDialog, setShowEntryCardDialog] = useState(false)

  const [visibleColumns, setVisibleColumns] = useState({
    passport_name: true,
    birth_date: true,
    gender: true,
    passport_number: true,
    dietary: true,
    notes: true,
    room: true,
    vehicle: true,
  })

  // Hooks
  const {
    members,
    setMembers,
    orderCodes,
    loading,
    getDietaryRestrictions,
    handleDietaryChange,
  } = useTourMembers(tour.id)

  const {
    customFields,
    loadCustomFields,
    loadFieldValues,
    addField,
    deleteField,
    updateFieldValue,
    getFieldValue,
  } = useCustomFields(tour.id)

  const { roomAssignments, loadRoomAssignments } = useRoomAssignments(tour.id)
  const { vehicleAssignments, loadVehicleAssignments } = useVehicleAssignments(tour.id)

  // Load custom fields and assignments
  useEffect(() => {
    loadCustomFields()
    loadFieldValues()
    loadRoomAssignments()
    loadVehicleAssignments()
  }, [tour.id])

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setMembers(items => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)

      return arrayMove(items, oldIndex, newIndex)
    })

    toast.success('順序已更新')
  }

  const handleColumnVisibilityChange = (key: keyof typeof visibleColumns, value: boolean) => {
    setVisibleColumns(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="p-6 text-center">載入中...</div>
  }

  if (members.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-morandi-secondary mb-4">目前沒有團員</p>
        <p className="text-sm text-morandi-text-light">請先在「訂單管理」中新增訂單和團員</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-morandi-gold/20">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-morandi-primary">
            團員名單總覽 ({members.length} 人)
          </h2>
          {isDragMode && (
            <span className="text-sm text-status-warning bg-status-warning-bg px-3 py-1 rounded-full">
              拖曳模式
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isDragMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsDragMode(!isDragMode)}
          >
            {isDragMode ? '完成排序' : '排序模式'}
          </Button>
          <ColumnSettings
            visibleColumns={visibleColumns}
            onVisibilityChange={handleColumnVisibilityChange}
            open={showColumnSettings}
            onOpenChange={setShowColumnSettings}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddFieldDialog(true)}
          >
            <Plus size={16} className="mr-1" />
            新增欄位
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRoomManager(true)}
            className="bg-status-warning-bg hover:bg-status-warning-bg border-morandi-gold"
          >
            <Hotel size={16} className="mr-1" />
            分房管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVehicleManager(true)}
            className="bg-status-info-bg hover:bg-muted border-morandi-gold"
          >
            <Bus size={16} className="mr-1" />
            分車管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEntryCardDialog(true)}
          >
            <FileText size={16} className="mr-1" />
            列印入境卡
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintPreview(true)}
          >
            <Printer size={16} className="mr-1" />
            列印交接單
          </Button>
        </div>
      </div>

      {/* Members table */}
      <div className="flex-1 overflow-auto p-6">
        <MembersTable
          members={members}
          customFields={customFields}
          getFieldValue={getFieldValue}
          updateFieldValue={updateFieldValue}
          isDragMode={isDragMode}
          orderCodes={orderCodes}
          getDietaryRestrictions={getDietaryRestrictions}
          onDietaryChange={handleDietaryChange}
          visibleColumns={visibleColumns}
          roomAssignments={roomAssignments}
          vehicleAssignments={vehicleAssignments}
          onDragEnd={handleDragEnd}
          onDeleteField={deleteField}
        />
      </div>

      {/* Dialogs */}
      <AddFieldDialog
        open={showAddFieldDialog}
        onOpenChange={setShowAddFieldDialog}
        onAdd={addField}
      />

      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <div className="no-print flex items-center justify-between mb-4">
            <DialogHeader>
              <DialogTitle>列印預覽 - 職務交辦單</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrintPreview(false)}
              >
                關閉
              </Button>
              <Button
                onClick={() => window.print()}
              >
                <Printer size={16} className="mr-1" />
                列印
              </Button>
            </div>
          </div>
          <TourHandoverPrint
            tour={tour}
            members={members as unknown as Parameters<typeof TourHandoverPrint>[0]['members']}
            customFields={customFields}
            fieldValues={{}}
          />
        </DialogContent>
      </Dialog>

      <TourRoomManager
        tourId={tour.id}
        tour={{ id: tour.id, departure_date: tour.departure_date, return_date: tour.return_date }}
        members={members}
        open={showRoomManager}
        onOpenChange={setShowRoomManager}
      />

      <TourVehicleManager
        tourId={tour.id}
        members={members}
        open={showVehicleManager}
        onOpenChange={setShowVehicleManager}
      />

      <EntryCardDialog
        open={showEntryCardDialog}
        onOpenChange={setShowEntryCardDialog}
        members={members}
      />
    </div>
  )
}
