'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseClient as any
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Trash2, Users, Hotel, X, Check, BedDouble, Copy, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { cn } from '@/lib/utils'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

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

// 每晚房型設定
interface NightRoomConfig {
  hotel_name: string
  double_count: number
  triple_count: number
  single_count: number
  quad_count: number
}

export function TourRoomManager({ tourId, tour, members, open, onOpenChange }: TourRoomManagerProps) {
  const [rooms, setRooms] = useState<TourRoomStatus[]>([])
  const [assignments, setAssignments] = useState<TourRoomAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNight, setSelectedNight] = useState(1)

  // 每晚的房型設定
  const [nightConfigs, setNightConfigs] = useState<Record<number, NightRoomConfig>>({})
  // 續住設定
  const [continueFromPrevious, setContinueFromPrevious] = useState<Set<number>>(new Set())

  // 計算行程天數
  const tourNights = useMemo(() => {
    if (!tour?.departure_date || !tour?.return_date) return 0
    try {
      const startDate = parseISO(tour.departure_date)
      const endDate = parseISO(tour.return_date)
      const days = differenceInDays(endDate, startDate) + 1
      return Math.max(days - 1, 0)
    } catch {
      return 0
    }
  }, [tour?.departure_date, tour?.return_date])

  const getNightDate = (nightNumber: number): string => {
    if (!tour?.departure_date) return ''
    try {
      const startDate = parseISO(tour.departure_date)
      const nightDate = addDays(startDate, nightNumber - 1)
      return format(nightDate, 'M/d (EEE)', { locale: zhTW })
    } catch {
      return ''
    }
  }

  const maxNight = tourNights > 0 ? tourNights : Math.max(...[...new Set(rooms.map(r => r.night_number))], 1)

  useEffect(() => {
    if (open) {
      loadRooms()
      loadAssignments()
    }
  }, [open, tourId])

  // 從現有房間資料建立 nightConfigs
  useEffect(() => {
    if (rooms.length > 0) {
      const configs: Record<number, NightRoomConfig> = {}
      const continuedNights = new Set<number>()

      for (let night = 1; night <= maxNight; night++) {
        const nightRooms = rooms.filter(r => r.night_number === night)
        if (nightRooms.length > 0) {
          const hotelName = nightRooms[0]?.hotel_name || ''
          configs[night] = {
            hotel_name: hotelName,
            double_count: nightRooms.filter(r => r.room_type === 'double').length,
            triple_count: nightRooms.filter(r => r.room_type === 'triple').length,
            single_count: nightRooms.filter(r => r.room_type === 'single').length,
            quad_count: nightRooms.filter(r => r.room_type === 'quad').length,
          }

          if (night > 1) {
            const prevConfig = configs[night - 1]
            if (prevConfig && prevConfig.hotel_name === hotelName) {
              continuedNights.add(night)
            }
          }
        }
      }

      setNightConfigs(configs)
      setContinueFromPrevious(continuedNights)
    }
  }, [rooms, maxNight])

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_rooms_status')
        .select('*')
        .eq('tour_id', tourId)
        .order('night_number')
        .order('display_order')

      if (error) throw error
      setRooms((data || []) as TourRoomStatus[])
    } catch (error) {
      console.error('載入房間失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const { data: roomsData } = await supabase
        .from('tour_rooms')
        .select('id')
        .eq('tour_id', tourId)

      if (!roomsData || roomsData.length === 0) {
        setAssignments([])
        return
      }

      const roomIds = roomsData.map((r: { id: string }) => r.id)

      const { data, error } = await supabase
        .from('tour_room_assignments')
        .select('*')
        .in('room_id', roomIds)

      if (error) throw error
      setAssignments((data || []) as TourRoomAssignment[])
    } catch (error) {
      console.error('載入分配失敗:', error)
    }
  }

  const getEffectiveConfig = (nightNumber: number): NightRoomConfig | null => {
    if (continueFromPrevious.has(nightNumber) && nightNumber > 1) {
      return getEffectiveConfig(nightNumber - 1)
    }
    return nightConfigs[nightNumber] || null
  }

  const updateNightConfig = (nightNumber: number, updates: Partial<NightRoomConfig>) => {
    setNightConfigs(prev => ({
      ...prev,
      [nightNumber]: {
        ...prev[nightNumber] || { hotel_name: '', double_count: 0, triple_count: 0, single_count: 0, quad_count: 0 },
        ...updates
      }
    }))
  }

  const toggleContinueFromPrevious = async (nightNumber: number) => {
    if (nightNumber <= 1) return

    const newContinued = new Set(continueFromPrevious)
    if (newContinued.has(nightNumber)) {
      // 取消續住
      newContinued.delete(nightNumber)
      setContinueFromPrevious(newContinued)
    } else {
      // 設為續住：複製前一晚的房間設定到這一晚
      newContinued.add(nightNumber)

      // 找到前一晚的房間（遞迴找到非續住的那一晚）
      let sourceNight = nightNumber - 1
      while (newContinued.has(sourceNight) && sourceNight > 1) {
        sourceNight--
      }

      const sourceRooms = rooms.filter(r => r.night_number === sourceNight)

      if (sourceRooms.length === 0) {
        toast.error('前一晚尚未設定房間')
        return
      }

      try {
        // 先刪除當前晚的房間
        const currentNightRoomIds = rooms.filter(r => r.night_number === nightNumber).map(r => r.id)
        if (currentNightRoomIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('tour_rooms')
            .delete()
            .in('id', currentNightRoomIds)
          if (deleteError) throw deleteError
        }

        // 複製前一晚的房間到這一晚
        const newRooms = sourceRooms.map((room, index) => ({
          tour_id: tourId,
          hotel_name: room.hotel_name,
          room_type: room.room_type,
          capacity: room.capacity,
          night_number: nightNumber,
          display_order: index,
        }))

        const { error: insertError } = await supabase
          .from('tour_rooms')
          .insert(newRooms)
        if (insertError) throw insertError

        setContinueFromPrevious(newContinued)
        toast.success(`已複製第 ${sourceNight} 晚的房間設定`)
        loadRooms()
        loadAssignments()
      } catch (error) {
        console.error('續住設定失敗:', error)
        toast.error('續住設定失敗')
      }
    }
  }

  const applyNightConfig = async (nightNumber: number) => {
    const config = getEffectiveConfig(nightNumber)
    if (!config || !config.hotel_name.trim()) {
      toast.error('請輸入飯店名稱')
      return
    }

    try {
      const nightRoomIds = rooms.filter(r => r.night_number === nightNumber).map(r => r.id)
      if (nightRoomIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('tour_rooms')
          .delete()
          .in('id', nightRoomIds)
        if (deleteError) throw deleteError
      }

      const newRooms: Array<{
        tour_id: string
        hotel_name: string
        room_type: string
        capacity: number
        night_number: number
        display_order: number
      }> = []
      let order = 0

      for (let i = 0; i < config.double_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'double',
          capacity: 2,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.triple_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'triple',
          capacity: 3,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.single_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'single',
          capacity: 1,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      for (let i = 0; i < config.quad_count; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: config.hotel_name,
          room_type: 'quad',
          capacity: 4,
          night_number: nightNumber,
          display_order: order++,
        })
      }

      if (newRooms.length > 0) {
        const { error: insertError } = await supabase
          .from('tour_rooms')
          .insert(newRooms)
        if (insertError) throw insertError
      }

      toast.success(`第 ${nightNumber} 晚房間已更新`)
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('套用設定失敗:', error)
      toast.error('套用設定失敗')
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

      toast.success('房間已刪除')
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('刪除房間失敗:', error)
      toast.error('刪除房間失敗')
    }
  }

  const handleAssignMember = async (roomId: string, memberId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room && room.is_full) {
      toast.error('此房間已滿')
      return
    }

    const nightRoomIds = rooms
      .filter(r => r.night_number === room?.night_number)
      .map(r => r.id)
    const existingAssignment = assignments.find(
      a => a.order_member_id === memberId && nightRoomIds.includes(a.room_id)
    )
    if (existingAssignment) {
      toast.error('此團員已分配到這晚的其他房間')
      return
    }

    try {
      console.log('正在分配:', { roomId, memberId })

      const result = await supabase.from('tour_room_assignments').insert({
        room_id: roomId,
        order_member_id: memberId,
      }).select()

      console.log('Supabase 完整回應:', result)

      if (result.error) {
        console.error('Supabase 錯誤詳情:', JSON.stringify(result.error, null, 2))
        if (result.error.code === '23505') {
          toast.error('此團員已分配到這個房間')
        } else {
          toast.error(`分配失敗: ${result.error.message || result.error.code || '未知錯誤'}`)
        }
        return
      }

      if (!result.data || result.data.length === 0) {
        console.error('插入成功但無返回資料')
        // 可能操作成功了，重新載入資料
      }

      toast.success('已分配')
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('分配失敗 (catch):', error)
      const err = error as Error
      toast.error(`分配失敗: ${err.message || '未知錯誤'}`)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('tour_room_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      toast.success('已移除')
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('移除失敗:', error)
      toast.error('移除失敗')
    }
  }

  const getRoomMembers = (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    return roomAssignments.map(a => {
      const member = members.find(m => m.id === a.order_member_id)
      return { assignment: a, member }
    })
  }

  const getUnassignedMembers = (nightNumber: number) => {
    const nightRoomIds = rooms
      .filter(r => r.night_number === nightNumber)
      .map(r => r.id)
    const assignedMemberIds = assignments
      .filter(a => nightRoomIds.includes(a.room_id))
      .map(a => a.order_member_id)
    return members.filter(m => !assignedMemberIds.includes(m.id))
  }

  // 切換是否顯示已分配滿的房間
  const [showFullRooms, setShowFullRooms] = useState(true)
  // 房型篩選（null = 全部）
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null)

  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)
  const unassignedMembers = getUnassignedMembers(selectedNight)
  const isContinued = continueFromPrevious.has(selectedNight)

  const totalAssigned = currentNightRooms.reduce((sum, r) => sum + r.assigned_count, 0)
  const totalCapacity = currentNightRooms.reduce((sum, r) => sum + r.capacity, 0)

  // 新增房間 popover 狀態
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [newRoomHotel, setNewRoomHotel] = useState('')
  const [newRoomType, setNewRoomType] = useState<string>('double')
  const [newRoomCount, setNewRoomCount] = useState(1)

  const handleAddRooms = async () => {
    // 房型名稱是可選的（例如：豪華、標準、海景）
    const roomVariantName = newRoomHotel.trim()

    const roomType = ROOM_TYPES.find(t => t.value === newRoomType)
    if (!roomType) return

    const capacity = newRoomType === 'single' ? 1 : newRoomType === 'double' ? 2 : newRoomType === 'triple' ? 3 : 4

    try {
      const newRooms = []
      const startOrder = currentNightRooms.length
      for (let i = 0; i < newRoomCount; i++) {
        newRooms.push({
          tour_id: tourId,
          hotel_name: roomVariantName, // 儲存房型名稱（可為空）
          room_type: newRoomType,
          capacity,
          night_number: selectedNight,
          display_order: startOrder + i,
        })
      }

      const { error } = await supabase.from('tour_rooms').insert(newRooms)
      if (error) throw error

      const variantLabel = roomVariantName ? `${roomVariantName}` : ''
      toast.success(`已新增 ${newRoomCount} 間${variantLabel}${roomType.label}`)
      setAddRoomOpen(false)
      setNewRoomCount(1)
      setNewRoomHotel('') // 清空房型名稱
      loadRooms()
    } catch (error) {
      console.error('新增房間失敗:', error)
      toast.error('新增房間失敗')
    }
  }

  return (
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

            {/* 新增房間按鈕 */}
            <Popover open={addRoomOpen} onOpenChange={setAddRoomOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm font-normal px-4 py-1.5 rounded-md border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all ml-auto">
                  <Plus className="h-4 w-4" />
                  新增房間
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-morandi-primary">新增房間</div>

                  {/* 房型選擇 */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-morandi-secondary">房型</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ROOM_TYPES.slice(0, 4).map(type => (
                        <button
                          key={type.value}
                          onClick={() => setNewRoomType(type.value)}
                          className={cn(
                            "text-sm px-3 py-2 rounded border transition-all",
                            newRoomType === type.value
                              ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                              : "border-border text-morandi-secondary hover:border-morandi-gold"
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 房型名稱（可選） */}
                  <div className="space-y-1">
                    <span className="text-xs text-morandi-secondary">房型名稱 <span className="text-morandi-muted">（可選）</span></span>
                    <Input
                      value={newRoomHotel}
                      onChange={e => setNewRoomHotel(e.target.value)}
                      placeholder="例如：豪華、標準、海景"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* 數量 */}
                  <div className="space-y-1">
                    <span className="text-xs text-morandi-secondary">數量</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNewRoomCount(Math.max(1, newRoomCount - 1))}
                        className="w-8 h-8 rounded border border-border text-morandi-secondary hover:border-morandi-gold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm text-morandi-primary">{newRoomCount}</span>
                      <button
                        onClick={() => setNewRoomCount(newRoomCount + 1)}
                        className="w-8 h-8 rounded border border-border text-morandi-secondary hover:border-morandi-gold"
                      >
                        +
                      </button>
                      <span className="text-xs text-morandi-muted">間</span>
                    </div>
                  </div>

                  <Button size="sm" className="w-full btn-morandi-primary" onClick={handleAddRooms}>
                    確認新增
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4 mt-4">
          {/* 左側：房間列表 */}
          <div className="col-span-2 flex flex-col min-h-0 bg-morandi-container rounded-lg p-4 border border-border">
            {/* 標題列：續住 + 顯示切換 */}
            <div className="flex items-center gap-2 mb-2">
              <BedDouble className="h-4 w-4 text-morandi-secondary" />
              <h3 className="font-medium text-morandi-primary text-sm">房間列表</h3>
              {selectedNight > 1 && (
                <button
                  onClick={() => toggleContinueFromPrevious(selectedNight)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-all ml-2",
                    isContinued
                      ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                      : "border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold"
                  )}
                >
                  <Copy className="h-3 w-3" />
                  {isContinued ? '續住' : '設為續住'}
                </button>
              )}
              {/* 顯示已滿房間切換 */}
              {currentNightRooms.some(r => r.is_full) && (
                <button
                  onClick={() => setShowFullRooms(!showFullRooms)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded border transition-all",
                    showFullRooms
                      ? "border-border text-morandi-secondary hover:border-morandi-gold"
                      : "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                  )}
                >
                  {showFullRooms ? '隱藏已滿' : '顯示已滿'}
                </button>
              )}
              {currentNightRooms.length > 0 && (
                <span className="ml-auto text-xs px-2 py-1 bg-card rounded text-morandi-secondary border border-border">
                  {currentNightRooms.length} 間 · {totalCapacity} 床
                </span>
              )}
            </div>

            {/* 房型篩選分頁 */}
            {currentNightRooms.length > 0 && (() => {
              // 取得當前晚所有房型+名稱組合
              const roomTypeKeys = new Set<string>()
              const roomTypeCounts: Record<string, number> = {}
              currentNightRooms.forEach(room => {
                const key = room.hotel_name
                  ? `${room.hotel_name}_${room.room_type}`
                  : room.room_type
                roomTypeKeys.add(key)
                roomTypeCounts[key] = (roomTypeCounts[key] || 0) + 1
              })

              // 只有多於一種房型時才顯示分頁
              if (roomTypeKeys.size <= 1) return null

              return (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <button
                    onClick={() => setSelectedRoomType(null)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded border transition-all",
                      selectedRoomType === null
                        ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                        : "border-border text-morandi-secondary hover:border-morandi-gold"
                    )}
                  >
                    全部
                  </button>
                  {[...roomTypeKeys].map(key => {
                    const [hotelName, roomType] = key.includes('_')
                      ? key.split('_')
                      : ['', key]
                    const typeLabel = ROOM_TYPES.find(t => t.value === roomType)?.label || roomType
                    const displayLabel = hotelName ? `${hotelName}${typeLabel}` : typeLabel
                    const count = roomTypeCounts[key]

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedRoomType(key)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded border transition-all",
                          selectedRoomType === key
                            ? "border-morandi-gold bg-morandi-gold/10 text-morandi-gold"
                            : "border-border text-morandi-secondary hover:border-morandi-gold"
                        )}
                      >
                        {displayLabel} ({count})
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {/* 已建立的房間列表 */}
            {currentNightRooms.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    // 計算每種房型+名稱組合的編號
                    const roomCounters: Record<string, number> = {}
                    // 先計算所有房間的編號（包含已滿的）
                    const roomNumbers: Record<string, number> = {}
                    currentNightRooms.forEach(room => {
                      const roomKey = `${room.hotel_name || ''}_${room.room_type}`
                      if (!roomCounters[roomKey]) {
                        roomCounters[roomKey] = 1
                      }
                      roomNumbers[room.id] = roomCounters[roomKey]++
                    })

                    // 過濾要顯示的房間
                    const displayRooms = showFullRooms
                      ? currentNightRooms
                      : currentNightRooms.filter(r => !r.is_full)

                    return displayRooms.map(room => {
                      const roomNumber = roomNumbers[room.id]
                      const typeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label || ''
                      const displayName = room.hotel_name
                        ? `${room.hotel_name}${typeLabel} ${roomNumber}`
                        : `${typeLabel} ${roomNumber}`

                      const roomMembers = getRoomMembers(room.id)
                      return (
                        <div
                          key={room.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            room.is_full ? "border-morandi-green bg-morandi-green/5" : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-morandi-primary">
                              {displayName}
                            </span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs",
                              room.is_full ? "text-morandi-green" : "text-morandi-muted"
                            )}>
                              {room.assigned_count}/{room.capacity}
                              {room.is_full && <Check className="h-3 w-3 inline ml-0.5" />}
                            </span>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-morandi-muted hover:text-morandi-red transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 min-h-[24px]">
                          {roomMembers.map(({ assignment, member }) => (
                            <span
                              key={assignment.id}
                              className="inline-flex items-center gap-1 bg-morandi-container text-morandi-primary text-xs px-2 py-1 rounded"
                            >
                              {member?.chinese_name || '未知'}
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="hover:text-morandi-red"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {room.remaining_beds > 0 && roomMembers.length === 0 && (
                            <span className="text-xs text-morandi-muted">空房</span>
                          )}
                        </div>
                      </div>
                    )
                  })})()}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <BedDouble className="h-12 w-12 text-morandi-muted mb-3" />
                <p className="text-morandi-secondary text-sm">尚未設定房間</p>
                <p className="text-morandi-muted text-xs mt-1">點擊右上角「新增房間」開始設定</p>
              </div>
            )}
          </div>

          {/* 右側：分配團員 */}
          <div className="flex flex-col min-h-0 bg-morandi-container rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3 h-8">
              <Users className="h-4 w-4 text-morandi-secondary" />
              <h3 className="font-medium text-morandi-primary text-sm">待分配團員</h3>
              <span className="ml-auto text-xs px-2 py-1 bg-card rounded text-morandi-secondary border border-border">
                {unassignedMembers.length} 人
              </span>
            </div>

            {currentNightRooms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-morandi-muted">
                <BedDouble className="h-8 w-8 mb-2" />
                <span className="text-xs">請先設定房間</span>
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-1.5">
                {unassignedMembers.map(member => {
                  // 計算每種房型的編號
                  const availableRooms = currentNightRooms.filter(r => !r.is_full)
                  const roomCountByType: Record<string, number> = {}

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-card rounded border border-border hover:border-morandi-gold transition-colors"
                    >
                      <span className="text-sm text-morandi-primary">
                        {member.chinese_name || member.passport_name || '未知'}
                      </span>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                        {availableRooms.map(room => {
                          // 計算此房型+名稱組合的編號
                          const roomKey = `${room.hotel_name || ''}_${room.room_type}`
                          if (!roomCountByType[roomKey]) {
                            roomCountByType[roomKey] = 1
                          }
                          const roomNum = roomCountByType[roomKey]++
                          const typeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label?.slice(0, 2) || ''
                          const prefix = room.hotel_name ? `${room.hotel_name}` : ''

                          return (
                            <button
                              key={room.id}
                              className="text-xs px-1.5 py-0.5 rounded border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all"
                              onClick={() => handleAssignMember(room.id, member.id)}
                              title={`${room.hotel_name ? room.hotel_name : ''}${ROOM_TYPES.find(t => t.value === room.room_type)?.label} ${room.assigned_count}/${room.capacity} 人`}
                            >
                              {prefix}{typeLabel}{roomNum}
                            </button>
                          )
                        })}
                        {availableRooms.length === 0 && (
                          <span className="text-xs text-morandi-muted">房間已滿</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {unassignedMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
                    <Check className="h-6 w-6 mb-1" />
                    <span className="text-xs">全部已分配</span>
                  </div>
                )}
              </div>
            )}

            {currentNightRooms.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-morandi-secondary">
                已分配 {totalAssigned}/{totalCapacity} 人
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
