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

  const { roomAssignments, memberRoomMap, loadRoomAssignments } = useRoomAssignments(tour.id)
  const { vehicleAssignments, loadVehicleAssignments } = useVehicleAssignments(tour.id)

  // Load custom fields and assignments
  useEffect(() => {
    loadCustomFields()
    loadFieldValues()
    loadRoomAssignments()
    loadVehicleAssignments()
  }, [tour.id])

  // Drag and drop handler - 同房成員一起移動
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setMembers(items => {
      const draggedId = active.id as string
      const targetId = over.id as string

      // 找出被拖動成員的 room_id
      const draggedRoomId = memberRoomMap[draggedId]

      // 如果沒有分房，就單獨移動
      if (!draggedRoomId) {
        const oldIndex = items.findIndex(item => item.id === draggedId)
        const newIndex = items.findIndex(item => item.id === targetId)
        return arrayMove(items, oldIndex, newIndex)
      }

      // 找出所有同房成員的 ID
      const roommateIds = Object.entries(memberRoomMap)
        .filter(([, roomId]) => roomId === draggedRoomId)
        .map(([memberId]) => memberId)

      // 找出同房成員在陣列中的索引（按目前順序排列）
      const roommateIndices = roommateIds
        .map(id => items.findIndex(item => item.id === id))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b)

      // 如果只有一個人，直接移動
      if (roommateIndices.length <= 1) {
        const oldIndex = items.findIndex(item => item.id === draggedId)
        const newIndex = items.findIndex(item => item.id === targetId)
        return arrayMove(items, oldIndex, newIndex)
      }

      // 取出同房成員（保持他們之間的相對順序）
      const roommates = roommateIndices.map(idx => items[idx])

      // 移除同房成員，建立新陣列
      const remaining = items.filter(item => !roommateIds.includes(item.id))

      // 找出目標位置在剩餘陣列中的索引
      let insertIndex = remaining.findIndex(item => item.id === targetId)

      // 如果目標是同房成員之一，找最近的非同房成員作為參考
      if (insertIndex === -1) {
        const targetOriginalIndex = items.findIndex(item => item.id === targetId)
        // 往後找第一個非同房成員
        for (let i = targetOriginalIndex + 1; i < items.length; i++) {
          const idx = remaining.findIndex(item => item.id === items[i].id)
          if (idx !== -1) {
            insertIndex = idx
            break
          }
        }
        // 如果找不到，放到最後
        if (insertIndex === -1) {
          insertIndex = remaining.length
        }
      }

      // 判斷是往前還是往後移動
      const firstRoommateOriginalIndex = roommateIndices[0]
      const targetOriginalIndex = items.findIndex(item => item.id === targetId)

      if (targetOriginalIndex > firstRoommateOriginalIndex) {
        // 往後移動，插入到目標之後
        insertIndex = insertIndex + 1
      }

      // 插入同房成員群組
      const result = [
        ...remaining.slice(0, insertIndex),
        ...roommates,
        ...remaining.slice(insertIndex),
      ]

      return result
    })

    toast.success('順序已更新（同房成員一起移動）')
  }

  const handleColumnVisibilityChange = (key: keyof typeof visibleColumns, value: boolean) => {
    setVisibleColumns(prev => ({ ...prev, [key]: value }))
  }

  // 分房後自動排序 - 讓同房成員相鄰
  const handleRoomManagerClose = async () => {
    // 重新載入房間分配，取得最新的 memberRoomMap
    const newMemberRoomMap = await loadRoomAssignments()

    if (Object.keys(newMemberRoomMap).length === 0) {
      // 沒有分房資料，不需要排序
      return
    }

    setMembers(currentMembers => {
      // 取得所有房間 ID（按照 display_order 排序，因為 loadRoomAssignments 已經處理）
      const roomIds = [...new Set(Object.values(newMemberRoomMap))]

      // 分組：已分房的成員按房間分組，未分房的成員放最後
      const roomGroups: Record<string, typeof currentMembers> = {}
      const unassigned: typeof currentMembers = []

      currentMembers.forEach(member => {
        const roomId = newMemberRoomMap[member.id]
        if (roomId) {
          if (!roomGroups[roomId]) {
            roomGroups[roomId] = []
          }
          roomGroups[roomId].push(member)
        } else {
          unassigned.push(member)
        }
      })

      // 按房間順序組合成員
      const sortedMembers: typeof currentMembers = []
      roomIds.forEach(roomId => {
        if (roomGroups[roomId]) {
          sortedMembers.push(...roomGroups[roomId])
        }
      })
      sortedMembers.push(...unassigned)

      return sortedMembers
    })

    toast.success('已依分房結果自動排序')
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
        onClose={handleRoomManagerClose}
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
