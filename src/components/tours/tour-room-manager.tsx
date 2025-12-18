'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

 
const supabase = supabaseClient as any
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Trash2, Users, Hotel, X, Check, BedDouble, Copy, Plus, UserMinus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { ROOM_TYPES } from '@/types/room-vehicle.types'
import type { TourRoomStatus, TourRoomAssignment } from '@/types/room-vehicle.types'
import { cn } from '@/lib/utils'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// Helper: Generate UUID with fallback for older browsers
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return generateUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
  const [isSorting, setIsSorting] = useState(false)

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
        const { error } = await supabase.from('tour_rooms').upsert(allUpdates)
        if (error) {
          console.error('Supabase upsert error:', error)
          throw error
        };
      }

      toast.success("房間順序已儲存")
      onOpenChange(false)
    } catch (error) {
      console.error("排序失敗:", error)
      toast.error("儲存排序失敗")
    } finally {
      setIsSorting(false)
    }
  }

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

      // 重置房型篩選，避免篩選到不存在的類別
      setSelectedRoomType(null)
      toast.success('房間已刪除')
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('刪除房間失敗:', error)
      toast.error('刪除房間失敗')
    }
  }

  const handleClearRoom = async (roomId: string) => {
    const roomAssignments = assignments.filter(a => a.room_id === roomId)
    if (roomAssignments.length === 0) {
      toast.info('此房間沒有分配任何團員')
      return
    }

    try {
      const { error } = await supabase
        .from('tour_room_assignments')
        .delete()
        .eq('room_id', roomId)

      if (error) throw error

      toast.success('已清空房間')
      loadRooms()
      loadAssignments()
    } catch (error) {
      console.error('清空房間失敗:', error)
      toast.error('清空房間失敗')
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
  // 團員篩選
  const [memberFilter, setMemberFilter] = useState('')

  const currentNightRooms = rooms.filter(r => r.night_number === selectedNight)
  const unassignedMembers = getUnassignedMembers(selectedNight)
  const filteredUnassignedMembers = unassignedMembers.filter(m => {
    if (!memberFilter.trim()) return true
    const name = m.chinese_name || m.passport_name || ''
    return name.toLowerCase().includes(memberFilter.toLowerCase())
  })
  const isContinued = continueFromPrevious.has(selectedNight)

  const totalAssigned = currentNightRooms.reduce((sum, r) => sum + r.assigned_count, 0)
  const totalCapacity = currentNightRooms.reduce((sum, r) => sum + r.capacity, 0)

  // 新增房間 popover 狀態
  const [addRoomOpen, setAddRoomOpen] = useState(false)

  // 批次新增房間的列表
  interface NewRoomRow {
    id: string
    roomName: string
    capacity: number
    count: number
    amount: string
    bookingCode: string
    customFields: Record<string, string>
  }

  // 自訂欄位名稱列表
  const [customFieldNames, setCustomFieldNames] = useState<string[]>([])

  // 房間列表
  const [newRoomRows, setNewRoomRows] = useState<NewRoomRow[]>([
    { id: generateUUID(), roomName: '', capacity: 2, count: 1, amount: '', bookingCode: '', customFields: {} }
  ])

  const removeRoomRow = (id: string) => {
    if (newRoomRows.length <= 1) return
    setNewRoomRows(prev => prev.filter(row => row.id !== id))
  }

  const resetRoomRows = () => {
    setNewRoomRows([
      { id: generateUUID(), roomName: '', capacity: 2, count: 1, amount: '', bookingCode: '', customFields: {} }
    ])
    setCustomFieldNames([])
  }

  // 新增自訂欄位
  const addCustomField = () => {
    const fieldName = `欄位${customFieldNames.length + 1}`
    setCustomFieldNames(prev => [...prev, fieldName])
  }

  // 移除自訂欄位
  const removeCustomField = (index: number) => {
    const fieldName = customFieldNames[index]
    setCustomFieldNames(prev => prev.filter((_, i) => i !== index))
    // 移除所有行中該欄位的值
    setNewRoomRows(prev => prev.map(row => {
      const newCustomFields = { ...row.customFields }
      delete newCustomFields[fieldName]
      return { ...row, customFields: newCustomFields }
    }))
  }

  // 更新自訂欄位名稱
  const updateCustomFieldName = (index: number, newName: string) => {
    const oldName = customFieldNames[index]
    setCustomFieldNames(prev => prev.map((name, i) => i === index ? newName : name))
    // 更新所有行中該欄位的 key
    setNewRoomRows(prev => prev.map(row => {
      const newCustomFields = { ...row.customFields }
      if (oldName in newCustomFields) {
        newCustomFields[newName] = newCustomFields[oldName]
        delete newCustomFields[oldName]
      }
      return { ...row, customFields: newCustomFields }
    }))
  }

  const handleAddRooms = async () => {
    // 過濾有效的行（數量 > 0 且入住人數 > 0）
    const validRows = newRoomRows.filter(row => row.count > 0 && row.capacity > 0)
    if (validRows.length === 0) {
      toast.error('請至少新增一間房間')
      return
    }

    // 根據入住人數推算房型
    const getCustomRoomType = (capacity: number): string => {
      if (capacity <= 1) return 'single'
      if (capacity === 2) return 'double'
      if (capacity === 3) return 'triple'
      return 'quad'
    }

    try {
      const newRooms: Array<{
        tour_id: string
        hotel_name: string
        room_type: string
        capacity: number
        night_number: number
        display_order: number
      }> = []
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
          })
        }
      }

      const { error } = await supabase.from('tour_rooms').insert(newRooms)
      if (error) throw error

      const totalCount = validRows.reduce((sum, row) => sum + row.count, 0)
      toast.success(`已新增 ${totalCount} 間房間`)
      setAddRoomOpen(false)
      resetRoomRows()
      loadRooms()
    } catch (error) {
      console.error('新增房間失敗:', error)
      toast.error('新增房間失敗')
    }
  }

  return (
    <>
      <Dialog open={open && !addRoomOpen} onOpenChange={onOpenChange}>
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

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setAddRoomOpen(true)}
                className="flex items-center gap-1.5 text-sm font-normal px-4 py-1.5 rounded-md border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all"
              >
                <Plus className="h-4 w-4" />
                新增房間
              </button>
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
                    let displayRooms = showFullRooms
                      ? currentNightRooms
                      : currentNightRooms.filter(r => !r.is_full)

                    // 套用房型篩選
                    if (selectedRoomType) {
                      displayRooms = displayRooms.filter(r => {
                        const roomKey = r.hotel_name
                          ? `${r.hotel_name}_${r.room_type}`
                          : r.room_type
                        return roomKey === selectedRoomType
                      })
                    }

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
                            {room.assigned_count > 0 && (
                              <button
                                onClick={() => handleClearRoom(room.id)}
                                className="text-morandi-muted hover:text-morandi-gold transition-colors"
                                title="清空房間"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-morandi-muted hover:text-morandi-red transition-colors"
                              title="刪除房間"
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
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-morandi-secondary" />
              <h3 className="font-medium text-morandi-primary text-sm">待分配團員</h3>
              <span className="text-xs px-2 py-1 bg-card rounded text-morandi-secondary border border-border">
                {unassignedMembers.length} 人
              </span>
              <Input
                value={memberFilter}
                onChange={e => setMemberFilter(e.target.value)}
                placeholder="搜尋..."
                className="h-7 w-24 text-xs ml-auto"
              />
            </div>

            {currentNightRooms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-morandi-muted">
                <BedDouble className="h-8 w-8 mb-2" />
                <span className="text-xs">請先設定房間</span>
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-1.5">
                {(() => {
                  // 先計算所有房間的實際編號（包含已滿的）
                  const allRoomNumbers: Record<string, number> = {}
                  const roomCounters: Record<string, number> = {}
                  currentNightRooms.forEach(room => {
                    const roomKey = `${room.hotel_name || ''}_${room.room_type}`
                    if (!roomCounters[roomKey]) {
                      roomCounters[roomKey] = 1
                    }
                    allRoomNumbers[room.id] = roomCounters[roomKey]++
                  })

                  const availableRooms = currentNightRooms.filter(r => !r.is_full)

                  return filteredUnassignedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-card rounded border border-border hover:border-morandi-gold transition-colors"
                    >
                      <span className="text-sm text-morandi-primary">
                        {member.chinese_name || member.passport_name || '未知'}
                      </span>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                        {availableRooms.map(room => {
                          const roomNum = allRoomNumbers[room.id]
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
                  ))
                })()}
                {filteredUnassignedMembers.length === 0 && unassignedMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
                    <Check className="h-6 w-6 mb-1" />
                    <span className="text-xs">全部已分配</span>
                  </div>
                )}
                {filteredUnassignedMembers.length === 0 && unassignedMembers.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
                    <span className="text-xs">無符合的團員</span>
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

    {/* 新增房間 Dialog */}
    <Dialog open={addRoomOpen} onOpenChange={(open) => { setAddRoomOpen(open); if (!open) resetRoomRows(); }}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-morandi-gold" />
            批次新增房間 - 第 {selectedNight} 晚
            {tour?.departure_date && (
              <span className="text-sm font-normal text-morandi-muted ml-2">
                {getNightDate(selectedNight)}
              </span>
            )}
            <label className="flex items-center gap-1.5 ml-4 cursor-pointer">
              <input
                type="checkbox"
                checked={continueFromPrevious.has(selectedNight)}
                onChange={() => toggleContinueFromPrevious(selectedNight)}
                disabled={selectedNight <= 1}
                className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold"
              />
              <span className={`text-sm ${selectedNight <= 1 ? 'text-morandi-muted' : 'text-morandi-secondary'}`}>
                續住
              </span>
            </label>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* 標題列 */}
          <div className="grid gap-3 px-2 text-sm font-medium text-morandi-secondary items-center" style={{ gridTemplateColumns: `180px 100px 100px 120px 140px ${customFieldNames.map(() => '120px').join(' ')} auto 40px` }}>
            <span>名稱</span>
            <span>入住人數</span>
            <span>間數</span>
            <span>金額</span>
            <span>訂房代號</span>
            {customFieldNames.map((fieldName, fieldIndex) => (
              <div key={fieldIndex} className="flex items-center gap-1">
                <Input
                  value={fieldName}
                  onChange={e => updateCustomFieldName(fieldIndex, e.target.value)}
                  className="h-7 text-xs"
                />
                <button
                  onClick={() => removeCustomField(fieldIndex)}
                  className="text-morandi-muted hover:text-morandi-red flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addCustomField}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-dashed border-morandi-muted text-morandi-muted hover:border-morandi-gold hover:text-morandi-gold transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              新增欄位
            </button>
            <span></span>
          </div>

          {/* 房間列表 */}
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {newRoomRows.map((row, index) => (
              <div key={row.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: `180px 100px 100px 120px 140px ${customFieldNames.map(() => '120px').join(' ')} auto 40px` }}>
                <Input
                  value={row.roomName}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, roomName: e.target.value } : r))}
                  placeholder="豪華、海景..."
                  className="h-10"
                />
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={row.capacity || ''}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, capacity: parseInt(e.target.value) || 0 } : r))}
                  placeholder="2"
                  className="h-10 text-center"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.count || ''}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, count: parseInt(e.target.value) || 0 } : r))}
                  className="h-10 text-center"
                />
                <Input
                  type="number"
                  min="0"
                  value={row.amount}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r))}
                  placeholder="0"
                  className="h-10 text-center"
                />
                <Input
                  value={row.bookingCode}
                  onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? { ...r, bookingCode: e.target.value } : r))}
                  placeholder="訂房代號"
                  className="h-10"
                />
                {customFieldNames.map((fieldName, fieldIndex) => (
                  <Input
                    key={fieldIndex}
                    value={row.customFields[fieldName] || ''}
                    onChange={e => setNewRoomRows(prev => prev.map(r => r.id === row.id ? {
                      ...r,
                      customFields: { ...r.customFields, [fieldName]: e.target.value }
                    } : r))}
                    placeholder={fieldName}
                    className="h-10"
                  />
                ))}
                <div></div>
                {index === 0 ? (
                  <button
                    onClick={() => setNewRoomRows(prev => [{
                      id: generateUUID(),
                      roomName: '',
                      capacity: 2,
                      count: 1,
                      amount: '',
                      bookingCode: '',
                      customFields: {}
                    }, ...prev])}
                    className="w-8 h-8 rounded flex items-center justify-center text-morandi-gold hover:bg-morandi-gold/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeRoomRow(row.id)}
                    className="w-8 h-8 rounded flex items-center justify-center text-morandi-secondary hover:text-morandi-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 統計 + 按鈕 */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm text-morandi-secondary">
                共 <span className="font-medium text-morandi-primary">{newRoomRows.reduce((sum, r) => sum + r.count, 0)}</span> 間房間
              </span>
              <span className="text-sm text-morandi-secondary">
                共 <span className="font-medium text-morandi-primary">{newRoomRows.reduce((sum, r) => sum + r.count * r.capacity, 0)}</span> 床位
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setAddRoomOpen(false); resetRoomRows() }}>
                取消
              </Button>
              <Button
                onClick={handleAddRooms}
                disabled={newRoomRows.reduce((sum, r) => sum + r.count, 0) === 0}
                className="btn-morandi-primary"
              >
                確認新增 ({newRoomRows.reduce((sum, r) => sum + r.count, 0)} 間)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
