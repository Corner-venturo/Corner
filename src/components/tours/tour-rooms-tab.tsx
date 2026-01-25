'use client'

/**
 * TourRoomsTab - 分房頁籤（內嵌版本）
 *
 * 與分車介面風格一致，直接在頁籤內操作分房
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useRoomAssignmentInline } from './hooks/useRoomAssignmentInline'
import { Plus, Trash2, Hotel, User, GripVertical, Edit2, Save, X, Bed, ChevronLeft, ChevronRight } from 'lucide-react'
import { ROOM_TYPES, type TourRoomStatus } from '@/types/room-vehicle.types'
import { Badge } from '@/components/ui/badge'

interface TourRoomsTabProps {
  tourId: string
  workspaceId: string
}

interface RoomMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
  order_code?: string
}

export function TourRoomsTab({ tourId, workspaceId }: TourRoomsTabProps) {
  const {
    rooms,
    members,
    loading,
    saving,
    tourNights,
    addRoom,
    updateRoom,
    deleteRoom,
    assignMemberToRoom,
    getMembersForRoom,
    getUnassignedMembersForNight,
    getRoomsForNight,
  } = useRoomAssignmentInline({ tourId, workspaceId })

  const [currentNight, setCurrentNight] = useState(1)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState<TourRoomStatus | null>(null)
  const [draggedMember, setDraggedMember] = useState<RoomMember | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | 'unassigned' | null>(null)

  // 新房間表單
  const [newRoom, setNewRoom] = useState({
    hotel_name: '',
    room_type: 'double',
    room_number: '',
    capacity: 2,
    notes: '',
    display_order: 1,
  })

  // 計算下一個房間序號
  const getNextRoomNumber = useCallback(() => {
    const nightRooms = getRoomsForNight(currentNight)
    return nightRooms.length + 1
  }, [getRoomsForNight, currentNight])

  // 開啟新增房間對話框
  const handleOpenAddRoom = () => {
    const nextNum = getNextRoomNumber()
    setNewRoom(prev => ({
      ...prev,
      display_order: nextNum,
    }))
    setShowAddRoom(true)
  }

  // 新增房間
  const handleAddRoom = async () => {
    await addRoom({
      hotel_name: newRoom.hotel_name,
      room_type: newRoom.room_type,
      room_number: newRoom.room_number || undefined,
      capacity: newRoom.capacity,
      notes: newRoom.notes || undefined,
      display_order: newRoom.display_order,
      night_number: currentNight,
    })
    setShowAddRoom(false)
    setNewRoom({
      hotel_name: newRoom.hotel_name, // 保留飯店名稱便於快速新增同飯店房間
      room_type: 'double',
      room_number: '',
      capacity: 2,
      notes: '',
      display_order: getNextRoomNumber() + 1,
    })
  }

  // 更新房間
  const handleUpdateRoom = async () => {
    if (!editingRoom) return
    await updateRoom(editingRoom.id, {
      hotel_name: editingRoom.hotel_name,
      room_type: editingRoom.room_type,
      room_number: editingRoom.room_number || undefined,
      capacity: editingRoom.capacity,
      notes: editingRoom.notes || undefined,
    })
    setEditingRoom(null)
  }

  // 拖曳開始
  const handleDragStart = (member: RoomMember) => {
    setDraggedMember(member)
  }

  // 拖曳結束
  const handleDragEnd = () => {
    setDraggedMember(null)
    setDragOverTarget(null)
  }

  // 拖曳進入
  const handleDragOver = (e: React.DragEvent, target: string | 'unassigned') => {
    e.preventDefault()
    setDragOverTarget(target)
  }

  // 拖曳離開
  const handleDragLeave = () => {
    setDragOverTarget(null)
  }

  // 放下
  const handleDrop = async (target: string | 'unassigned') => {
    if (!draggedMember) return
    const roomId = target === 'unassigned' ? null : target
    await assignMemberToRoom(draggedMember.id, roomId, currentNight)
    setDraggedMember(null)
    setDragOverTarget(null)
  }

  // 當前晚數的資料
  const nightRooms = getRoomsForNight(currentNight)
  const unassignedMembers = getUnassignedMembersForNight(currentNight)

  // 計算統計
  const totalCapacity = nightRooms.reduce((sum, r) => sum + (r.capacity || 0), 0)
  const totalAssigned = nightRooms.reduce((sum, r) => sum + (r.assigned_count || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-morandi-secondary">載入中...</p>
      </div>
    )
  }

  if (tourNights === 0) {
    return (
      <div className="text-center py-12 text-morandi-secondary">
        此團沒有住宿天數（當日來回）
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hotel className="text-morandi-gold" size={20} />
          <h3 className="font-medium text-morandi-primary">分房管理</h3>
          <span className="text-xs text-morandi-secondary">
            (共 {tourNights} 晚 / {members.length} 人)
          </span>
        </div>
        <Button
          size="sm"
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
          onClick={handleOpenAddRoom}
          disabled={saving}
        >
          <Plus size={14} />
          新增房間
        </Button>
      </div>

      {/* 晚數切換 */}
      {tourNights > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 bg-morandi-container/30 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentNight(n => Math.max(1, n - 1))}
            disabled={currentNight === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: tourNights }, (_, i) => i + 1).map(night => (
              <Button
                key={night}
                variant={currentNight === night ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 min-w-[60px]',
                  currentNight === night && 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                )}
                onClick={() => setCurrentNight(night)}
              >
                第 {night} 晚
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentNight(n => Math.min(tourNights, n + 1))}
            disabled={currentNight === tourNights}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* 當晚統計 */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className="gap-1">
          <Bed size={12} />
          {nightRooms.length} 間房
        </Badge>
        <Badge variant="outline" className="gap-1">
          <User size={12} />
          {totalAssigned}/{totalCapacity} 床位
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'gap-1',
            unassignedMembers.length > 0 ? 'text-yellow-600 border-yellow-600' : 'text-green-600 border-green-600'
          )}
        >
          {unassignedMembers.length > 0 ? `${unassignedMembers.length} 人未分配` : '全部已分配'}
        </Badge>
      </div>

      {/* 分房區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 未分配區域 */}
        <div
          className={cn(
            'border rounded-lg p-3 min-h-[200px] transition-colors',
            dragOverTarget === 'unassigned' ? 'border-morandi-gold bg-morandi-gold/5' : 'border-border bg-morandi-container/20'
          )}
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop('unassigned')}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <User size={16} className="text-morandi-secondary" />
            <span className="text-sm font-medium text-morandi-primary">未分配</span>
            <span className="text-xs text-morandi-secondary">({unassignedMembers.length} 人)</span>
          </div>
          <div className="space-y-1">
            {unassignedMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onDragStart={() => handleDragStart(member)}
                onDragEnd={handleDragEnd}
                isDragging={draggedMember?.id === member.id}
              />
            ))}
            {unassignedMembers.length === 0 && (
              <p className="text-xs text-morandi-muted text-center py-4">全部成員已分配</p>
            )}
          </div>
        </div>

        {/* 房間區域 */}
        {nightRooms.map(room => {
          const roomMembers = getMembersForRoom(room.id)
          const roomTypeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label || room.room_type
          return (
            <div
              key={room.id}
              className={cn(
                'border rounded-lg p-3 min-h-[200px] transition-colors',
                dragOverTarget === room.id
                  ? 'border-morandi-gold bg-morandi-gold/5'
                  : 'border-border bg-white'
              )}
              onDragOver={(e) => handleDragOver(e, room.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(room.id)}
            >
              {/* 房間標題 */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bed size={16} className="text-morandi-gold" />
                  <span className="text-sm font-medium text-morandi-primary">
                    {room.hotel_name}
                  </span>
                  <span className="text-xs text-morandi-secondary">
                    ({roomMembers.length}/{room.capacity} 人)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingRoom(room)}
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-morandi-red hover:text-morandi-red"
                    onClick={() => deleteRoom(room.id)}
                    disabled={saving}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* 房間資訊 */}
              <div className="text-xs text-morandi-secondary mb-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {roomTypeLabel}
                  </Badge>
                  {room.room_number && (
                    <span>房號: {room.room_number}</span>
                  )}
                </div>
                {room.notes && (
                  <div className="text-morandi-muted">{room.notes}</div>
                )}
              </div>

              {/* 成員列表 */}
              <div className="space-y-1">
                {roomMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onDragStart={() => handleDragStart(member)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedMember?.id === member.id}
                  />
                ))}
                {roomMembers.length === 0 && (
                  <p className="text-xs text-morandi-muted text-center py-4">拖曳成員到此處</p>
                )}
                {room.is_full && (
                  <div className="text-xs text-green-600 text-center mt-2">
                    已滿房
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 無房間提示 */}
        {nightRooms.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center col-span-full lg:col-span-1">
            <Hotel size={32} className="text-morandi-muted mb-2" />
            <p className="text-sm text-morandi-secondary mb-2">第 {currentNight} 晚尚未新增房間</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={handleOpenAddRoom}
            >
              <Plus size={14} />
              新增第一間房間
            </Button>
          </div>
        )}
      </div>

      {/* 新增房間對話框 */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent level={2} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增房間（第 {currentNight} 晚）</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>飯店名稱 *</Label>
              <Input
                value={newRoom.hotel_name}
                onChange={(e) => setNewRoom(prev => ({ ...prev, hotel_name: e.target.value }))}
                placeholder="例：帝國飯店"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>房型</Label>
                <Select
                  value={newRoom.room_type}
                  onValueChange={(v) => {
                    const type = ROOM_TYPES.find(t => t.value === v)
                    const defaultCapacity = type?.value === 'single' ? 1
                      : type?.value === 'double' ? 2
                        : type?.value === 'triple' ? 3
                          : type?.value === 'quad' ? 4 : 2
                    setNewRoom(prev => ({
                      ...prev,
                      room_type: v,
                      capacity: defaultCapacity,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>床位數</Label>
                <Input
                  type="number"
                  min={1}
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <Label>房號</Label>
              <Input
                value={newRoom.room_number}
                onChange={(e) => setNewRoom(prev => ({ ...prev, room_number: e.target.value }))}
                placeholder="選填，例：801"
              />
            </div>
            <div>
              <Label>備註</Label>
              <Input
                value={newRoom.notes}
                onChange={(e) => setNewRoom(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="選填"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoom(false)}>
              <X size={14} className="mr-1" />
              取消
            </Button>
            <Button
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              onClick={handleAddRoom}
              disabled={saving || !newRoom.hotel_name.trim()}
            >
              <Plus size={14} className="mr-1" />
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯房間對話框 */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent level={2} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯房間</DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <div className="space-y-4 py-4">
              <div>
                <Label>飯店名稱 *</Label>
                <Input
                  value={editingRoom.hotel_name}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, hotel_name: e.target.value } : null)}
                  placeholder="例：帝國飯店"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>房型</Label>
                  <Select
                    value={editingRoom.room_type}
                    onValueChange={(v) => {
                      const type = ROOM_TYPES.find(t => t.value === v)
                      const defaultCapacity = type?.value === 'single' ? 1
                        : type?.value === 'double' ? 2
                          : type?.value === 'triple' ? 3
                            : type?.value === 'quad' ? 4 : 2
                      setEditingRoom(prev => prev ? {
                        ...prev,
                        room_type: v,
                        capacity: defaultCapacity,
                      } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>床位數</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingRoom.capacity}
                    onChange={(e) => setEditingRoom(prev => prev ? { ...prev, capacity: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
              </div>
              <div>
                <Label>房號</Label>
                <Input
                  value={editingRoom.room_number || ''}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, room_number: e.target.value } : null)}
                  placeholder="選填，例：801"
                />
              </div>
              <div>
                <Label>備註</Label>
                <Input
                  value={editingRoom.notes || ''}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="選填"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              <X size={14} className="mr-1" />
              取消
            </Button>
            <Button
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              onClick={handleUpdateRoom}
              disabled={saving}
            >
              <Save size={14} className="mr-1" />
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 成員卡片組件
interface MemberCardProps {
  member: RoomMember
  onDragStart: () => void
  onDragEnd: () => void
  isDragging: boolean
}

function MemberCard({ member, onDragStart, onDragEnd, isDragging }: MemberCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 bg-white border border-border rounded cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <GripVertical size={12} className="text-morandi-muted flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-morandi-primary truncate">
          {member.chinese_name || member.passport_name || '未命名'}
        </div>
        {member.order_code && (
          <div className="text-[10px] text-morandi-secondary truncate">
            {member.order_code}
          </div>
        )}
      </div>
    </div>
  )
}
