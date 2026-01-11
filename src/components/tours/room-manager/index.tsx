'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Hotel, Check, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, differenceInDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { parseLocalDate } from '@/lib/utils/format-date'
import { confirm } from '@/lib/ui/alert-dialog'
import { toast } from 'sonner'
import type { TourRoomStatus } from '@/types/room-vehicle.types'
import { useRoomData } from './hooks/useRoomData'
import { RoomList } from './components/RoomList'
import { MemberAssignmentPanel } from './components/MemberAssignmentPanel'
import { RoomAssignmentDialog, type NewRoomRow } from './components/RoomAssignmentDialog'
import { EditRoomDialog } from './components/EditRoomDialog'
import { useContinueFromPrevious } from './hooks/useContinueFromPrevious'

interface OrderMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
}

interface TourInfo {
  id: string
  departure_date: string
  return_date: string
}

interface TourRoomManagerProps {
  tourId: string
  tour?: TourInfo
  members: OrderMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TourRoomManager({ tourId, tour, members, open, onOpenChange }: TourRoomManagerProps) {
  const {
    rooms,
    assignments,
    loading,
    loadRooms,
    loadAssignments,
    deleteRoom,
    clearRoom,
    assignMember,
    removeAssignment,
    updateRoom,
    addRooms,
    sortAndSaveRooms,
  } = useRoomData({ tourId, open })

  const [selectedNight, setSelectedNight] = useState(1)
  const [isSorting, setIsSorting] = useState(false)
  const [showFullRooms, setShowFullRooms] = useState(true)
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null)
  const [memberFilter, setMemberFilter] = useState('')
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [editRoomOpen, setEditRoomOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<TourRoomStatus | null>(null)

  const { continueFromPrevious, toggleContinueFromPrevious } = useContinueFromPrevious({
    tourId,
    rooms,
    assignments,
    loadRooms,
    loadAssignments,
  })

  const tourNights = useMemo(() => {
    if (!tour?.departure_date || !tour?.return_date) return 0
    const startDate = parseLocalDate(tour.departure_date)
    const endDate = parseLocalDate(tour.return_date)
    if (!startDate || !endDate) return 0
    const days = differenceInDays(endDate, startDate) + 1
    return Math.max(days - 1, 0)
  }, [tour?.departure_date, tour?.return_date])

  const getNightDate = (nightNumber: number): string => {
    if (!tour?.departure_date) return ''
    const startDate = parseLocalDate(tour.departure_date)
    if (!startDate) return ''
    const nightDate = addDays(startDate, nightNumber - 1)
    return format(nightDate, 'M/d (EEE)', { locale: zhTW })
  }

  const maxNight = tourNights > 0 ? tourNights : Math.max(...[...new Set(rooms.map(r => r.night_number))], 1)
  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)

  const getUnassignedMembers = (nightNumber: number) => {
    const nightRoomIds = rooms
      .filter(r => r.night_number === nightNumber)
      .map(r => r.id)
    const assignedMemberIds = assignments
      .filter(a => nightRoomIds.includes(a.room_id))
      .map(a => a.order_member_id)
    return members.filter(m => !assignedMemberIds.includes(m.id))
  }

  const unassignedMembers = getUnassignedMembers(selectedNight)
  const filteredUnassignedMembers = unassignedMembers.filter(m => {
    if (!memberFilter.trim()) return true
    const name = m.chinese_name || m.passport_name || ''
    return name.toLowerCase().includes(memberFilter.toLowerCase())
  })

  const totalAssigned = currentNightRooms.reduce((sum, r) => sum + r.assigned_count, 0)
  const totalCapacity = currentNightRooms.reduce((sum, r) => sum + r.capacity, 0)

  const handleSortAndClose = async () => {
    setIsSorting(true)
    try {
      await sortAndSaveRooms(rooms, assignments, members)
      onOpenChange(false)
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
    await deleteRoom(roomId)
    setSelectedRoomType(null)
  }

  const handleEditRoom = (room: TourRoomStatus) => {
    setEditingRoom(room)
    setEditRoomOpen(true)
  }

  const handleAddRoomsSubmit = async (newRoomRows: NewRoomRow[]) => {
    const validRows = newRoomRows.filter(row => row.count > 0 && row.capacity > 0)
    if (validRows.length === 0) {
      toast.error('請至少新增一間房間')
      return
    }

    const getCustomRoomType = (capacity: number): string => {
      if (capacity <= 1) return 'single'
      if (capacity === 2) return 'double'
      if (capacity === 3) return 'triple'
      return 'quad'
    }

    const newRooms = []
    let order = currentNightRooms.length

    for (const row of validRows) {
      for (let i = 0; i < row.count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: row.roomName.trim(),
          room_type: getCustomRoomType(row.capacity),
          capacity: row.capacity,
          night_number: selectedNight,
          display_order: order++,
          booking_code: row.bookingCode?.trim() || null,
          amount: row.amount ? parseFloat(row.amount) : null,
        })
      }
    }

    await addRooms(newRooms)
    setAddRoomOpen(false)
  }

  return (
    <>
      {/* 主 Dialog：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
      {!addRoomOpen && !editRoomOpen && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl w-[95vw] h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-morandi-primary">
              <Hotel className="h-5 w-5 text-morandi-gold" />
              分房管理
              {tourNights > 0 && (
                <span className="text-sm font-normal text-morandi-muted">
                  {tourNights + 1} 天 {tourNights} 夜
                </span>
              )}
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
                <button
                  onClick={() => setAddRoomOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-normal px-4 py-1.5 rounded-md border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all"
                >
                  <Plus className="h-4 w-4" />
                  新增房間
                </button>
                <Button onClick={handleSortAndClose} disabled={isSorting} className="gap-1.5">
                  {isSorting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  完成並排序
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4 mt-4">
            <RoomList
              currentNightRooms={currentNightRooms}
              selectedNight={selectedNight}
              continueFromPrevious={continueFromPrevious}
              showFullRooms={showFullRooms}
              selectedRoomType={selectedRoomType}
              totalCapacity={totalCapacity}
              assignments={assignments}
              members={members}
              onToggleContinue={toggleContinueFromPrevious}
              onToggleShowFull={() => setShowFullRooms(!showFullRooms)}
              onClearRoom={clearRoom}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              onRemoveAssignment={removeAssignment}
            />

            <MemberAssignmentPanel
              currentNightRooms={currentNightRooms}
              unassignedMembers={unassignedMembers}
              filteredUnassignedMembers={filteredUnassignedMembers}
              memberFilter={memberFilter}
              totalAssigned={totalAssigned}
              totalCapacity={totalCapacity}
              assignments={assignments}
              rooms={rooms}
              members={members}
              onMemberFilterChange={setMemberFilter}
              onAssignMember={assignMember}
            />
          </div>
          </DialogContent>
        </Dialog>
      )}

      <RoomAssignmentDialog
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
        selectedNight={selectedNight}
        currentNightRoomsCount={currentNightRooms.length}
        getNightDate={getNightDate}
        onAddRooms={handleAddRoomsSubmit}
      />

      <EditRoomDialog
        open={editRoomOpen}
        onOpenChange={setEditRoomOpen}
        room={editingRoom}
        onSave={updateRoom}
      />
    </>
  )
}
