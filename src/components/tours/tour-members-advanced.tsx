'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase/client'

 
const supabase = supabaseClient as any
import { Tour } from '@/types/tour.types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical, Printer, Eye, Hotel, Bus } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { TourRoomManager } from './tour-room-manager'
import { TourVehicleManager } from './tour-vehicle-manager'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TourHandoverPrint } from './tour-handover-print'

interface OrderMember {
  id: string
  order_id: string
  customer_id: string | null
  chinese_name: string | null
  passport_name: string | null
  birth_date: string | null
  gender: string | null
  id_number: string | null
  passport_number: string | null
  passport_expiry: string | null
  special_meal: string | null
  pnr: string | null
}

// 飲食禁忌對應表 (customer_id -> dietary_restrictions)
type CustomerDietaryMap = Record<string, string>

// 訂單編號對應表
type OrderCodeMap = Record<string, string>

interface MemberFieldValue {
  [memberId: string]: {
    [fieldName: string]: string
  }
}

interface TourMembersAdvancedProps {
  tour: Tour
}

// 欄位可見性設定類型
interface VisibleColumns {
  passport_name: boolean
  birth_date: boolean
  gender: boolean
  passport_number: boolean
  dietary: boolean
  notes: boolean
  room: boolean
  vehicle: boolean
}

// 房型標籤轉換
const getRoomTypeLabel = (roomType: string): string => {
  const labels: Record<string, string> = {
    single: '單人房',
    double: '雙人房',
    triple: '三人房',
    quad: '四人房',
    suite: '套房',
  }
  return labels[roomType] || roomType
}

// 車型標籤轉換（只取簡短名稱，去掉人數資訊）
const getVehicleTypeLabel = (vehicleType: string | null): string => {
  if (!vehicleType) return ''
  const labels: Record<string, string> = {
    large_bus: '大巴',
    medium_bus: '中巴',
    mini_bus: '小巴',
    van: '商務車',
    car: '轎車',
  }
  return labels[vehicleType] || vehicleType
}

// 拖曳行組件
function SortableRow({
  member,
  index,
  customFields,
  getFieldValue,
  updateFieldValue,
  isDragMode,
  orderCode,
  dietaryRestrictions,
  onDietaryChange,
  visibleColumns,
  roomAssignment,
  vehicleAssignment,
}: {
  member: OrderMember
  index: number
  customFields: string[]
  getFieldValue: (memberId: string, fieldName: string) => string
  updateFieldValue: (memberId: string, fieldName: string, value: string) => void
  isDragMode: boolean
  orderCode: string
  dietaryRestrictions: string
  onDietaryChange: (customerId: string | null, value: string) => void
  visibleColumns: VisibleColumns
  roomAssignment: string
  vehicleAssignment: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-morandi-gold/10 hover:bg-morandi-container/10 ${
        index % 2 === 0 ? 'bg-blue-50/30' : 'bg-green-50/30'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* 拖曳手把 */}
      {isDragMode && (
        <td className="px-2 py-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical size={16} className="text-morandi-text-light" />
        </td>
      )}

      <td className="px-2 py-2 text-xs text-morandi-text-light">
        {index + 1}
      </td>
      <td className="px-2 py-2">{member.chinese_name || '-'}</td>
      {visibleColumns.passport_name && (
        <td className="px-2 py-2">{member.passport_name || '-'}</td>
      )}
      {visibleColumns.birth_date && (
        <td className="px-2 py-2 text-xs">{member.birth_date || '-'}</td>
      )}
      {visibleColumns.gender && (
        <td className="px-2 py-2 text-xs">
          {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
        </td>
      )}
      {visibleColumns.passport_number && (
        <td className="px-2 py-2 text-xs">{member.passport_number || '-'}</td>
      )}
      {/* 飲食禁忌 - 固定欄位，同步到 customers */}
      {visibleColumns.dietary && (
        <td className="px-2 py-2 bg-amber-50/50">
          <input
            type="text"
            value={dietaryRestrictions}
            onChange={e => onDietaryChange(member.customer_id, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none focus:bg-amber-100/50 px-1 py-0.5 rounded"
            placeholder="-"
            disabled={isDragMode}
          />
        </td>
      )}
      {/* 分房資訊 */}
      {visibleColumns.room && (
        <td className="px-2 py-2 text-xs bg-green-50/50">
          <span className={roomAssignment ? 'text-green-700' : 'text-morandi-text-light'}>
            {roomAssignment || '未分房'}
          </span>
        </td>
      )}
      {/* 分車資訊 */}
      {visibleColumns.vehicle && (
        <td className="px-2 py-2 text-xs bg-blue-50/50">
          <span className={vehicleAssignment ? 'text-blue-700' : 'text-morandi-text-light'}>
            {vehicleAssignment || '未分車'}
          </span>
        </td>
      )}
      {customFields.map(field => (
        <td key={field} className="px-2 py-2 bg-white">
          <input
            type="text"
            value={getFieldValue(member.id, field)}
            onChange={e => updateFieldValue(member.id, field, e.target.value)}
            className="w-full bg-transparent text-xs border-none outline-none focus:bg-morandi-container/20 px-1 py-0.5 rounded"
            placeholder="-"
            disabled={isDragMode}
          />
        </td>
      ))}
    </tr>
  )
}

export function TourMembersAdvanced({ tour }: TourMembersAdvancedProps) {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [orderCodes, setOrderCodes] = useState<OrderCodeMap>({})
  const [customFields, setCustomFields] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<MemberFieldValue>({})
  const [loading, setLoading] = useState(true)
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [isDragMode, setIsDragMode] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  // 飲食禁忌狀態
  const [dietaryMap, setDietaryMap] = useState<CustomerDietaryMap>({})
  const [originalDietaryMap, setOriginalDietaryMap] = useState<CustomerDietaryMap>({})
  // 欄位可見性設定
  const [showColumnSettings, setShowColumnSettings] = useState(false)
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
  // 備註欄位狀態 (memberId -> notes)
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  // 分房分車對話框
  const [showRoomManager, setShowRoomManager] = useState(false)
  const [showVehicleManager, setShowVehicleManager] = useState(false)
  // 分房資訊: member_id -> 房間名稱
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})
  // 分車資訊: member_id -> 車輛名稱
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})

  // 拖曳感應器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 載入團員資料
  useEffect(() => {
    loadMembers()
    loadRoomAssignments()
    loadVehicleAssignments()
  }, [tour.id])

  // 載入分房資訊
  const loadRoomAssignments = async () => {
    if (!tour.id) return

    try {
      // 取得這個團的所有房間（按 display_order 排序，確保編號正確）
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_type, hotel_name, room_number, display_order')
        .eq('tour_id', tour.id)
        .order('display_order', { ascending: true })

      if (!rooms || rooms.length === 0) return

      // 取得所有分配記錄
      const roomIds = rooms.map((r: { id: string }) => r.id)
      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('room_id, order_member_id')
        .in('room_id', roomIds)

      if (!assignments || assignments.length === 0) return

      // 建立 room_id -> 房間資訊 的映射
      const roomMap: Record<string, { room_type: string; hotel_name: string | null; room_number: string | null; display_order: number }> = {}
      rooms.forEach((room: { id: string; room_type: string; hotel_name: string | null; room_number: string | null; display_order: number }) => {
        roomMap[room.id] = {
          room_type: room.room_type,
          hotel_name: room.hotel_name,
          room_number: room.room_number,
          display_order: room.display_order,
        }
      })

      // 計算每種房型的編號（按 display_order 排序後計算）
      const roomCounters: Record<string, number> = {}
      const roomNumbers: Record<string, number> = {}
      rooms.forEach((room: { id: string; room_type: string; hotel_name: string | null; display_order: number }) => {
        const roomKey = `${room.hotel_name || ''}_${room.room_type}`
        if (!roomCounters[roomKey]) {
          roomCounters[roomKey] = 1
        }
        roomNumbers[room.id] = roomCounters[roomKey]++
      })

      // 建立 member_id -> 房間名稱 的映射
      const assignmentMap: Record<string, string> = {}
      assignments.forEach((a: { room_id: string; order_member_id: string }) => {
        const room = roomMap[a.room_id]
        if (room) {
          const roomTypeLabel = getRoomTypeLabel(room.room_type)
          const variant = room.hotel_name ? `${room.hotel_name} ` : ''
          const roomNum = roomNumbers[a.room_id] || 1
          assignmentMap[a.order_member_id] = `${variant}${roomTypeLabel} ${roomNum}`
        }
      })

      setRoomAssignments(assignmentMap)
    } catch (err) {
      logger.error('載入房間分配失敗:', err)
    }
  }

  // 載入分車資訊
  const loadVehicleAssignments = async () => {
    if (!tour.id) return

    try {
      // 取得這個團的所有車輛（按 display_order 排序，確保編號正確）
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type, display_order')
        .eq('tour_id', tour.id)
        .order('display_order', { ascending: true })

      if (!vehicles || vehicles.length === 0) return

      // 取得所有分配記錄
      const vehicleIds = vehicles.map((v: { id: string }) => v.id)
      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('vehicle_id, order_member_id')
        .in('vehicle_id', vehicleIds)

      if (!assignments || assignments.length === 0) return

      // 建立 vehicle_id -> 車輛資訊 的映射
      const vehicleMap: Record<string, { vehicle_name: string; vehicle_type: string | null; display_order: number }> = {}
      vehicles.forEach((vehicle: { id: string; vehicle_name: string; vehicle_type: string | null; display_order: number }) => {
        vehicleMap[vehicle.id] = {
          vehicle_name: vehicle.vehicle_name,
          vehicle_type: vehicle.vehicle_type,
          display_order: vehicle.display_order,
        }
      })

      // 計算每種車型的編號（按 display_order 排序後計算）
      const vehicleCounters: Record<string, number> = {}
      const vehicleNumbers: Record<string, number> = {}
      vehicles.forEach((vehicle: { id: string; vehicle_type: string | null; display_order: number }) => {
        const vehicleKey = vehicle.vehicle_type || 'default'
        if (!vehicleCounters[vehicleKey]) {
          vehicleCounters[vehicleKey] = 1
        }
        vehicleNumbers[vehicle.id] = vehicleCounters[vehicleKey]++
      })

      // 建立 member_id -> 車輛名稱 的映射
      const assignmentMap: Record<string, string> = {}
      assignments.forEach((a: { vehicle_id: string; order_member_id: string }) => {
        const vehicle = vehicleMap[a.vehicle_id]
        if (vehicle) {
          // 如果有自定義名稱，優先使用
          if (vehicle.vehicle_name && vehicle.vehicle_name !== getVehicleTypeLabel(vehicle.vehicle_type)) {
            assignmentMap[a.order_member_id] = vehicle.vehicle_name
          } else {
            // 否則使用「車型 編號」格式
            const vehicleTypeLabel = getVehicleTypeLabel(vehicle.vehicle_type)
            const vehicleNum = vehicleNumbers[a.vehicle_id] || 1
            assignmentMap[a.order_member_id] = vehicleTypeLabel ? `${vehicleTypeLabel} ${vehicleNum}` : `車 ${vehicleNum}`
          }
        }
      })

      setVehicleAssignments(assignmentMap)
    } catch (err) {
      logger.error('載入車輛分配失敗:', err)
    }
  }

  const loadMembers = async () => {
    try {
      // 1. 找出所有屬於這個團的訂單（包含 order_number）
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('tour_id', tour.id)

      if (ordersError) throw ordersError

      const orderIds = orders?.map((o: { id: string }) => o.id) || []

      // 建立 order_id -> order_number 對應表
      const codeMap: OrderCodeMap = {}
      orders?.forEach((o: { id: string; order_number: string | null }) => {
        codeMap[o.id] = o.order_number || '-'
      })
      setOrderCodes(codeMap)

      if (orderIds.length === 0) {
        setMembers([])
        setLoading(false)
        return
      }

      // 2. 抓取這些訂單的所有團員
      const { data: membersData, error: membersError } = await supabase
        .from('order_members')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: true })

      if (membersError) throw membersError

      setMembers((membersData || []) as unknown as OrderMember[])

      // 3. 載入飲食禁忌資料 (從 customers 表)
      const customerIds = (membersData || [])
        .filter((m: OrderMember) => m.customer_id)
        .map((m: OrderMember) => m.customer_id) as string[]

      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, dietary_restrictions')
          .in('id', customerIds)

        const dietary: CustomerDietaryMap = {}
        customersData?.forEach((c: { id: string; dietary_restrictions: string | null }) => {
          dietary[c.id] = c.dietary_restrictions || ''
        })
        setDietaryMap(dietary)
        setOriginalDietaryMap(dietary)
      }

      // 4. 載入已建立的動態欄位
      await loadCustomFields()

      // 5. 載入動態欄位的值
      await loadFieldValues()
    } catch (error) {
      logger.error('載入團員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('field_name')
        .eq('tour_id', tour.id)

      if (error) throw error

      // 取得所有不重複的欄位名稱
      const fieldData = data as Array<{ field_name: string }> | null
      const uniqueFields = [...new Set(fieldData?.map(d => d.field_name) || [])]
      setCustomFields(uniqueFields)
    } catch (error) {
      logger.error('載入自訂欄位失敗:', error)
    }
  }

  const loadFieldValues = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_member_fields')
        .select('*')
        .eq('tour_id', tour.id)

      if (error) throw error

      // 組織成 { memberId: { fieldName: value } } 結構
      const values: MemberFieldValue = {}
      const fieldData = data as Array<{
        order_member_id: string
        field_name: string
        field_value: string | null
      }> | null

      fieldData?.forEach(item => {
        if (!values[item.order_member_id]) {
          values[item.order_member_id] = {}
        }
        values[item.order_member_id][item.field_name] = item.field_value || ''
      })

      setFieldValues(values)
    } catch (error) {
      logger.error('載入欄位值失敗:', error)
    }
  }

  // 新增自訂欄位
  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      toast.error('請輸入欄位名稱')
      return
    }

    if (customFields.includes(newFieldName.trim())) {
      toast.error('欄位名稱已存在')
      return
    }

    setCustomFields([...customFields, newFieldName.trim()])
    setNewFieldName('')
    setShowAddFieldDialog(false)
    toast.success(`已新增欄位：${newFieldName.trim()}`)
  }

  // 刪除自訂欄位
  const handleDeleteField = async (fieldName: string) => {
    const confirmed = await confirm(`確定要刪除「${fieldName}」欄位嗎？所有資料將一併刪除。`, {
      title: '刪除欄位',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      // 刪除資料庫中的所有該欄位資料
      const { error } = await supabase
        .from('tour_member_fields')
        .delete()
        .eq('tour_id', tour.id)
        .eq('field_name', fieldName)

      if (error) throw error

      // 更新本地狀態
      setCustomFields(customFields.filter(f => f !== fieldName))

      // 清除欄位值
      const newFieldValues = { ...fieldValues }
      Object.keys(newFieldValues).forEach(memberId => {
        delete newFieldValues[memberId][fieldName]
      })
      setFieldValues(newFieldValues)

      toast.success(`已刪除欄位：${fieldName}`)
    } catch (error) {
      logger.error('刪除欄位失敗:', error)
      toast.error('刪除欄位失敗')
    }
  }

  // 更新動態欄位值
  const updateFieldValue = async (memberId: string, fieldName: string, value: string) => {
    // 立即更新本地狀態
    setFieldValues(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [fieldName]: value
      }
    }))

    try {
      // Upsert 到資料庫
      const { error } = await supabase
        .from('tour_member_fields')
        .upsert({
          tour_id: tour.id,
          order_member_id: memberId,
          field_name: fieldName,
          field_value: value,
          display_order: 0
        }, {
          onConflict: 'tour_id,order_member_id,field_name'
        })

      if (error) throw error
    } catch (error) {
      logger.error('更新欄位值失敗:', error)
      // 失敗時重新載入
      loadFieldValues()
    }
  }

  // 取得欄位值
  const getFieldValue = (memberId: string, fieldName: string): string => {
    return fieldValues[memberId]?.[fieldName] || ''
  }

  // 取得飲食禁忌 (根據 customer_id)
  const getDietaryRestrictions = (customerId: string | null): string => {
    if (!customerId) return ''
    return dietaryMap[customerId] || ''
  }

  // 更新飲食禁忌 (同步到 customers 表)
  const handleDietaryChange = async (customerId: string | null, value: string) => {
    if (!customerId) {
      toast.error('此團員未關聯顧客資料，無法儲存飲食禁忌')
      return
    }

    // 立即更新本地狀態
    setDietaryMap(prev => ({ ...prev, [customerId]: value }))

    try {
      // 同步更新到 customers 表
      const { error } = await supabase
        .from('customers')
        .update({ dietary_restrictions: value || null })
        .eq('id', customerId)

      if (error) throw error

      // 檢查是否與原值不同，提示已更新
      if (originalDietaryMap[customerId] !== value) {
        toast.success('飲食禁忌已同步更新至顧客資料')
        setOriginalDietaryMap(prev => ({ ...prev, [customerId]: value }))
      }
    } catch (error) {
      logger.error('更新飲食禁忌失敗:', error)
      toast.error('更新飲食禁忌失敗')
      // 還原本地狀態
      setDietaryMap(prev => ({ ...prev, [customerId]: originalDietaryMap[customerId] || '' }))
    }
  }

  // 拖曳結束處理
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
      {/* 工具列 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-morandi-gold/20">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-morandi-primary">
            團員名單總覽 ({members.length} 人)
          </h2>
          {isDragMode && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
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
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
            >
              <Eye size={16} className="mr-1" />
              顯示欄位
            </Button>
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-morandi-gold/20 rounded-lg shadow-lg p-3 z-50 min-w-[140px]">
                <div className="text-xs font-medium text-morandi-secondary mb-2">選擇顯示欄位</div>
                {[
                  { key: 'passport_name', label: '護照拼音' },
                  { key: 'birth_date', label: '生日' },
                  { key: 'gender', label: '性別' },
                  { key: 'passport_number', label: '護照號碼' },
                  { key: 'dietary', label: '飲食禁忌' },
                  { key: 'room', label: '分房' },
                  { key: 'vehicle', label: '分車' },
                  { key: 'notes', label: '備註' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-morandi-container/20 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-morandi-gold/40"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
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
            className="bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            <Hotel size={16} className="mr-1" />
            分房管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVehicleManager(true)}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Bus size={16} className="mr-1" />
            分車管理
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

      {/* 團員列表 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-morandi-gold/20 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-morandi-container/30 border-b border-morandi-gold/20">
                  {isDragMode && <th className="w-10"></th>}
                  <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-8">序</th>
                  <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-20">中文姓名</th>
                  {visibleColumns.passport_name && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-40">護照拼音</th>}
                  {visibleColumns.birth_date && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24">生日</th>}
                  {visibleColumns.gender && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-10">性別</th>}
                  {visibleColumns.passport_number && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24">護照號碼</th>}
                  {visibleColumns.dietary && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-amber-50/50">飲食禁忌</th>}
                  {visibleColumns.room && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-green-50/50">分房</th>}
                  {visibleColumns.vehicle && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-24 bg-blue-50/50">分車</th>}
                  {visibleColumns.notes && <th className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs w-48 bg-purple-50/50">備註</th>}
                  {customFields.map(field => (
                    <th key={field} className="px-2 py-2 text-left font-medium text-morandi-secondary text-xs bg-morandi-gold/10 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <span>{field}</span>
                        {!isDragMode && (
                          <button
                            onClick={() => handleDeleteField(field)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                            title="刪除欄位"
                          >
                            <Trash2 size={12} className="text-red-500" />
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
                      onDietaryChange={handleDietaryChange}
                      visibleColumns={visibleColumns}
                      roomAssignment={roomAssignments[member.id] || ''}
                      vehicleAssignment={vehicleAssignments[member.id] || ''}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* 新增欄位 Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增自訂欄位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                欄位名稱
              </label>
              <Input
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                placeholder="例如：分車、分房、分桌"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddField()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddFieldDialog(false)
                  setNewFieldName('')
                }}
              >
                取消
              </Button>
              <Button onClick={handleAddField}>
                確定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 列印預覽 Dialog */}
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
            fieldValues={fieldValues}
          />
        </DialogContent>
      </Dialog>

      {/* 分房管理 */}
      <TourRoomManager
        tourId={tour.id}
        tour={{ id: tour.id, departure_date: tour.departure_date, return_date: tour.return_date }}
        members={members}
        open={showRoomManager}
        onOpenChange={setShowRoomManager}
      />

      {/* 分車管理 */}
      <TourVehicleManager
        tourId={tour.id}
        members={members}
        open={showVehicleManager}
        onOpenChange={setShowVehicleManager}
      />
    </div>
  )
}
