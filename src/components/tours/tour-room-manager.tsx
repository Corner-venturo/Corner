'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Hotel, Plus, Check, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import type { OrderMember } from '@/components/orders/order-member.types'

// Hooks
import { useRoomData } from './hooks/useRoomData'
import { useRoomConfig } from './hooks/useRoomConfig'
import { useRoomAssignment } from './hooks/useRoomAssignment'
import { useItineraryHotels } from './hooks/useItineraryHotels'

// Components
import { RoomList } from './components/RoomList'
import { MemberAssignmentPanel } from './components/MemberAssignmentPanel'
import { AddRoomDialog } from './components/AddRoomDialog'
import { EditRoomDialog } from './components/EditRoomDialog'
import { RoomingListExport } from './components/RoomingListExport'

// 此元件只需要 OrderMember 的部分欄位
type MemberBasic = Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>

interface TourInfo {
  id: string
  code?: string
  name?: string
  departure_date: string
  return_date: string
}

interface TourRoomManagerProps {
  tourId: string
  tour?: TourInfo
  members: MemberBasic[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose?: () => void
}

export function TourRoomManager({ tourId, tour, members, open, onOpenChange, onClose }: TourRoomManagerProps) {
  const [selectedNight, setSelectedNight] = useState(1)
  const [isSorting, setIsSorting] = useState(false)
  const [showFullRooms, setShowFullRooms] = useState(true)
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [editRoomOpen, setEditRoomOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<TourRoomStatus | null>(null)
  const [roomingListOpen, setRoomingListOpen] = useState(false)

  // 使用自定義 Hooks
  const { rooms, assignments, loading, reload } = useRoomData({ tourId, open })
  const itineraryHotels = useItineraryHotels({ tourId, open })

  const {
    continueFromPrevious,
    tourNights,
    maxNight,
    toggleContinueFromPrevious,
  } = useRoomConfig({ tour, tourId, rooms, assignments, reload })

  const {
    getRoomMembers,
    getUnassignedMembers,
    handleAssignMember,
    handleRemoveAssignment,
    handleClearRoom,
  } = useRoomAssignment({ rooms, assignments, members, reload })

  const handleSortAndClose = async () => {
    setIsSorting(true)
    try {
      const nightNumbers = [...new Set(rooms.map(r => r.night_number))]
      const allUpdates = []

      for (const night of nightNumbers) {
        const nightRooms = rooms.filter(r => r.night_number === night)
        const roomSortKeys = new Map<string, number>()

        for (const room of nightRooms) {
          const roomAssignments = assignments.filter(a => a.room_id === room.id)
          const memberIdsInRoom = roomAssignments.map(a => a.order_member_id)

          if (memberIdsInRoom.length === 0) {
            roomSortKeys.set(room.id, Infinity)
            continue
          }

          const minIndex = Math.min(
            ...memberIdsInRoom.map(memberId => {
              const index = members.findIndex(m => m.id === memberId)
              return index === -1 ? Infinity : index
            })
          )
          roomSortKeys.set(room.id, minIndex)
        }

        const sortedNightRooms = [...nightRooms].sort((a, b) => {
          const keyA = roomSortKeys.get(a.id) ?? Infinity
          const keyB = roomSortKeys.get(b.id) ?? Infinity
          return keyA - keyB
        })

        const nightUpdates = sortedNightRooms.map((room, index) => ({
          id: room.id,
          display_order: index,
        }))

        allUpdates.push(...nightUpdates)
      }

      if (allUpdates.length > 0) {
        // 使用批量 update 而非 upsert，因為只更新 display_order
        for (const update of allUpdates) {
          const { error } = await supabase
            .from('tour_rooms')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
          if (error) {
            logger.error('Supabase update error:', error)
            throw error
          }
        }
      }

      toast.success("房間順序已儲存")
      onOpenChange(false)
      onClose?.()
    } catch (error) {
      logger.error("排序失敗:", error)
      toast.error("儲存排序失敗")
    } finally {
      setIsSorting(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    const confirmed = await confirm('確定要刪除這個房間嗎？已分配的團員將會被移除。', {
      title: '刪除房間',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('tour_rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error

      setSelectedRoomType(null)
      toast.success('房間已刪除')
      reload()
    } catch (error) {
      logger.error('刪除房間失敗:', error)
      toast.error('刪除房間失敗')
    }
  }

  const handleEditRoom = (room: TourRoomStatus) => {
    setEditingRoom(room)
    setEditRoomOpen(true)
  }

  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)
  const unassignedMembers = getUnassignedMembers(selectedNight)
  const totalAssigned = currentNightRooms.reduce((sum, r) => sum + r.assigned_count, 0)
  const totalCapacity = currentNightRooms.reduce((sum, r) => sum + r.capacity, 0)

  // 處理對話框關閉（包含自動排序觸發）
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      onClose?.()
    }
  }

  return (
    <>
      {/* 主 Dialog：level={2} 因為從 TourDetailDialog 打開 */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent level={2} className="max-w-6xl w-[95vw] h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-morandi-primary">
              <Hotel className="h-5 w-5 text-morandi-gold" />
              分房管理
              {tourNights > 0 && (
                <span className="text-sm font-normal text-morandi-muted">
                  {tourNights + 1} 天 {tourNights} 夜
                </span>
              )}

              {/* 夜晚選擇按鈕 */}
              <div className="flex items-center gap-1.5 ml-4">
                {[...Array(maxNight)].map((_, i) => {
                  const nightNum = i + 1
                  const isCont = continueFromPrevious.has(nightNum)

                  return (
                    <button
                      key={nightNum}
                      onClick={() => setSelectedNight(nightNum)}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-sm font-normal transition-all whitespace-nowrap border",
                        selectedNight === nightNum
                          ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                          : "border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold",
                        isCont && "border-dashed"
                      )}
                    >
                      第{nightNum}晚{isCont && '續'}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setRoomingListOpen(true)}
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  輸出分房總表
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddRoomOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  新增房間
                </Button>
                <Button
                  onClick={handleSortAndClose}
                  disabled={isSorting}
                  className="gap-1.5"
                >
                  {isSorting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  完成並排序
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4 mt-4">
            {/* 左側：房間列表 */}
            <RoomList
              rooms={rooms}
              selectedNight={selectedNight}
              showFullRooms={showFullRooms}
              selectedRoomType={selectedRoomType}
              continueFromPrevious={continueFromPrevious}
              getRoomMembers={getRoomMembers}
              onToggleShowFull={() => setShowFullRooms(!showFullRooms)}
              onToggleContinue={toggleContinueFromPrevious}
              onClearRoom={handleClearRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              onRemoveAssignment={handleRemoveAssignment}
              onRoomTypeFilter={setSelectedRoomType}
            />

            {/* 右側：分配團員 */}
            <MemberAssignmentPanel
              rooms={rooms}
              selectedNight={selectedNight}
              unassignedMembers={unassignedMembers}
              totalAssigned={totalAssigned}
              totalCapacity={totalCapacity}
              onAssignMember={handleAssignMember}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增房間 Dialog */}
      <AddRoomDialog
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
        tourId={tourId}
        selectedNight={selectedNight}
        tour={tour}
        currentRoomCount={currentNightRooms.length}
        continueFromPrevious={continueFromPrevious}
        onToggleContinue={toggleContinueFromPrevious}
        onSuccess={reload}
        defaultHotelName={itineraryHotels.getHotelForNight(selectedNight)}
      />

      {/* 編輯房間對話框 */}
      <EditRoomDialog
        room={editingRoom}
        open={editRoomOpen}
        onOpenChange={setEditRoomOpen}
        onSuccess={reload}
      />

      {/* 輸出分房總表 */}
      <RoomingListExport
        open={roomingListOpen}
        onOpenChange={setRoomingListOpen}
        tourCode={tour?.code || ''}
        tourName={tour?.name || ''}
        departureDate={tour?.departure_date || ''}
        returnDate={tour?.return_date || ''}
        rooms={rooms}
        assignments={assignments}
        members={members}
      />
    </>
  )
}
