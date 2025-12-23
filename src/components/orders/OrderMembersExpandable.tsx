'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, X, Hash, Upload, FileImage, Eye, FileText, AlertTriangle, Pencil, Check, ZoomIn, ZoomOut, RotateCcw, RotateCw, FlipHorizontal, Crop, RefreshCw, Save, Printer, Hotel, Bus, Coins, Plane, Settings2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useImageEditor, useOcrRecognition } from '@/hooks'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useCustomerStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { TourRoomManager } from '@/components/tours/tour-room-manager'
import { TourVehicleManager } from '@/components/tours/tour-vehicle-manager'

interface OrderMember {
  id: string
  order_id: string
  customer_id?: string | null
  identity?: string | null
  chinese_name?: string | null
  passport_name?: string | null
  birth_date?: string | null
  age?: number | null
  id_number?: string | null
  gender?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  special_meal?: string | null
  pnr?: string | null
  flight_cost?: number | null
  hotel_1_name?: string | null
  hotel_1_checkin?: string | null
  hotel_1_checkout?: string | null
  hotel_2_name?: string | null
  hotel_2_checkin?: string | null
  hotel_2_checkout?: string | null
  hotel_confirmation?: string | null
  checked_in?: boolean | null
  checked_in_at?: string | null
  transport_cost?: number | null
  misc_cost?: number | null
  total_payable?: number | null
  deposit_amount?: number | null
  balance_amount?: number | null
  deposit_receipt_no?: string | null
  balance_receipt_no?: string | null
  remarks?: string | null
  cost_price?: number | null
  selling_price?: number | null
  profit?: number | null
  passport_image_url?: string | null
  // 關聯的顧客驗證狀態（從 join 查詢取得）
  customer_verification_status?: string | null
  // 團體模式額外欄位
  order_code?: string | null  // 訂單編號（團體模式用）
}

// PDF 轉 JPG 需要的類型
interface ProcessedFile {
  file: File
  preview: string
  originalName: string
  isPdf: boolean
}

interface OrderMembersExpandableProps {
  orderId?: string  // 可選：單一訂單模式
  tourId: string
  workspaceId: string
  onClose?: () => void  // 團體模式時可能不需要關閉按鈕
  mode?: 'order' | 'tour'  // 'order' = 單一訂單, 'tour' = 團體模式（顯示旅遊團所有成員）
}

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
  mode: propMode,
}: OrderMembersExpandableProps) {
  // 自動判斷模式：如果沒有 orderId 就是團體模式
  const mode = propMode || (orderId ? 'order' : 'tour')
  const [members, setMembers] = useState<OrderMember[]>([])
  const [loading, setLoading] = useState(false)
  const [departureDate, setDepartureDate] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [memberCountToAdd, setMemberCountToAdd] = useState<number | ''>(1)
  const [showIdentityColumn, setShowIdentityColumn] = useState(false) // 控制身份欄位顯示
  const [isComposing, setIsComposing] = useState(false) // 追蹤是否正在使用輸入法
  const [isAllEditMode, setIsAllEditMode] = useState(false) // 全部編輯模式
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false) // 匯出對話框
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    identity: false,
    chinese_name: true,
    passport_name: true,
    birth_date: true,
    gender: true,
    id_number: false,
    passport_number: true,
    passport_expiry: true,
    special_meal: true,
    hotel_confirmation: false,
    total_payable: false,
    deposit_amount: false,
    balance: false,
    remarks: false,
  })

  // 顧客搜尋相關狀態
  const { items: customers, fetchAll: fetchCustomers } = useCustomerStore()
  const [showCustomerMatchDialog, setShowCustomerMatchDialog] = useState(false)
  const [matchedCustomers, setMatchedCustomers] = useState<typeof customers>([])
  const [matchType, setMatchType] = useState<'name' | 'id_number'>('name')
  const [pendingMemberIndex, setPendingMemberIndex] = useState<number | null>(null)
  const [pendingMemberData, setPendingMemberData] = useState<Partial<OrderMember> | null>(null)

  // 護照上傳相關狀態
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 照片預覽相關狀態
  const [previewMember, setPreviewMember] = useState<OrderMember | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // 驗證/編輯彈窗相關狀態
  const [editingMember, setEditingMember] = useState<OrderMember | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState<'verify' | 'edit'>('edit')
  const [editFormData, setEditFormData] = useState<Partial<OrderMember>>({})
  const [isSaving, setIsSaving] = useState(false)

  // 圖片編輯 & OCR 辨識 Hooks (共用於顧客管理和成員管理)
  const imageEditor = useImageEditor()
  const { isRecognizing, recognizePassport } = useOcrRecognition()

  // 團體模式：分房分車相關狀態
  const [showRoomManager, setShowRoomManager] = useState(false)
  const [showVehicleManager, setShowVehicleManager] = useState(false)
  const [showRoomColumn, setShowRoomColumn] = useState(false)  // 控制分房欄位顯示
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})
  const [roomSortKeys, setRoomSortKeys] = useState<Record<string, number>>({})  // 成員排序權重（用於分房排序）
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})
  const [returnDate, setReturnDate] = useState<string | null>(null)
  const [orderCount, setOrderCount] = useState(0) // 訂單數量（用於判斷是否顯示訂單編號欄）
  const [tourOrders, setTourOrders] = useState<{ id: string; order_number: string | null }[]>([]) // 團體模式：訂單列表
  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] = useState<string | null>(null) // 團體模式：新增成員時選擇的訂單
  const [showOrderSelectDialog, setShowOrderSelectDialog] = useState(false) // 團體模式：訂單選擇對話框

  // 團體模式：自訂費用欄位
  interface CustomCostField {
    id: string
    name: string
    values: Record<string, string>  // memberId -> value
  }
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([])
  const [showAddCostFieldDialog, setShowAddCostFieldDialog] = useState(false)
  const [newCostFieldName, setNewCostFieldName] = useState('')

  // 團體模式：PNR 欄位
  const [showPnrColumn, setShowPnrColumn] = useState(false)
  const [pnrValues, setPnrValues] = useState<Record<string, string>>({})

  // 定義可編輯欄位的順序（用於方向鍵導航）
  const editableFields = showIdentityColumn
    ? ['identity', 'chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']
    : ['chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']

  // 載入成員資料和出發日期
  useEffect(() => {
    loadMembers()
    loadTourDepartureDate()
    // 載入顧客資料（用於編輯模式搜尋）
    fetchCustomers()
    // 載入分房分車資訊（兩種模式都載入）
    loadRoomAssignments()
    loadVehicleAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tourId, mode])

  const loadTourDepartureDate = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('departure_date, return_date')
        .eq('id', tourId)
        .single()

      if (error) throw error
      setDepartureDate(data?.departure_date || null)
      setReturnDate(data?.return_date || null)
    } catch (error) {
      logger.error('載入出發日期失敗:', error)
    }
  }

  // 團體模式：載入分房資訊
  const loadRoomAssignments = async () => {
    if (!tourId) return
    try {
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_number, room_type, display_order, night_number, hotel_name')
        .eq('tour_id', tourId)
        .order('night_number')
        .order('display_order')

      if (!rooms || rooms.length === 0) {
        setRoomAssignments({})
        setRoomSortKeys({})
        return
      }

      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('order_member_id, room_id')
        .in('room_id', rooms.map(r => r.id))

      if (assignments) {
        const map: Record<string, string> = {}
        const sortKeys: Record<string, number> = {}

        // 只處理第一晚的房間順序（作為主要排序依據）
        const firstNightRooms = rooms.filter(r => r.night_number === 1)

        // 計算每種房型的編號（用於顯示）
        const roomCounters: Record<string, number> = {}
        const roomNumbers: Record<string, number> = {}
        firstNightRooms.forEach(room => {
          const roomKey = `${room.hotel_name || ''}_${room.room_type}`
          if (!roomCounters[roomKey]) {
            roomCounters[roomKey] = 1
          }
          roomNumbers[room.id] = roomCounters[roomKey]++
        })

        // 建立 room_id -> display_order 的映射（用於排序）
        const roomOrderMap: Record<string, number> = {}
        firstNightRooms.forEach((room, index) => {
          roomOrderMap[room.id] = index
        })

        assignments.forEach(a => {
          const room = rooms.find(r => r.id === a.room_id)
          if (room) {
            // 只有第一晚的房間用於顯示和排序
            if (room.night_number === 1) {
              const roomNum = roomNumbers[room.id] || 1
              const typeLabel = room.room_type === 'single' ? '單人房' :
                               room.room_type === 'double' ? '雙人房' :
                               room.room_type === 'triple' ? '三人房' :
                               room.room_type === 'quad' ? '四人房' : room.room_type
              const prefix = room.hotel_name ? `${room.hotel_name} ` : ''
              map[a.order_member_id] = `${prefix}${typeLabel} ${roomNum}`

              // 設定排序權重：房間順序 * 10 + 房間內成員順序
              const roomOrder = roomOrderMap[room.id] ?? 999
              const existingSortKeys = Object.values(sortKeys).filter(v => Math.floor(v / 10) === roomOrder)
              sortKeys[a.order_member_id] = roomOrder * 10 + existingSortKeys.length
            }
          }
        })

        setRoomAssignments(map)
        setRoomSortKeys(sortKeys)
      }
    } catch (error) {
      logger.error('載入分房資訊失敗:', error)
    }
  }

  // 團體模式：載入分車資訊
  const loadVehicleAssignments = async () => {
    if (!tourId) return
    try {
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type')
        .eq('tour_id', tourId)

      if (!vehicles || vehicles.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('order_member_id, vehicle_id')
        .in('vehicle_id', vehicles.map(v => v.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const vehicle = vehicles.find(v => v.id === a.vehicle_id)
          if (vehicle) {
            map[a.order_member_id] = vehicle.vehicle_name || vehicle.vehicle_type || '已分車'
          }
        })
        setVehicleAssignments(map)
      }
    } catch (error) {
      logger.error('載入分車資訊失敗:', error)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      let membersData: OrderMember[] = []
      let orderCodeMap: Record<string, string> = {}

      if (mode === 'tour') {
        // 團體模式：載入旅遊團所有訂單的成員
        // 1. 先查詢該旅遊團的所有訂單
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true })

        if (ordersError) throw ordersError

        if (ordersData && ordersData.length > 0) {
          // 設定訂單數量和訂單列表
          setOrderCount(ordersData.length)
          setTourOrders(ordersData)

          // 建立訂單編號對應表（只取序號部分，如 "01"）
          orderCodeMap = Object.fromEntries(
            ordersData.map(o => {
              const orderNum = o.order_number || ''
              // 從 "CNX250128A-01" 提取 "01"
              const seqMatch = orderNum.match(/-(\d+)$/)
              return [o.id, seqMatch ? seqMatch[1] : orderNum]
            })
          )
          const orderIds = ordersData.map(o => o.id)

          // 2. 載入這些訂單的所有成員
          const { data: allMembersData, error: membersError } = await supabase
            .from('order_members')
            .select('*')
            .in('order_id', orderIds)
            .order('created_at', { ascending: true })

          if (membersError) throw membersError
          membersData = allMembersData || []
        }
      } else if (orderId) {
        // 單一訂單模式
        const { data, error: membersError } = await supabase
          .from('order_members')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })

        if (membersError) throw membersError
        membersData = data || []
      }

      // 收集所有有 customer_id 的成員
      const customerIds = membersData
        .map(m => m.customer_id)
        .filter(Boolean) as string[]

      // 如果有 customer_id，批次查詢顧客驗證狀態
      let customerStatusMap: Record<string, string> = {}
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, verification_status')
          .in('id', customerIds)

        if (customersData) {
          customerStatusMap = Object.fromEntries(
            customersData.map(c => [c.id, c.verification_status || ''])
          )
        }
      }

      // 合併驗證狀態和訂單編號到成員
      const membersWithStatus = membersData.map(m => ({
        ...m,
        customer_verification_status: m.customer_id ? customerStatusMap[m.customer_id] || null : null,
        order_code: mode === 'tour' ? orderCodeMap[m.order_id] || null : null,
      }))

      setMembers(membersWithStatus)

      // 初始化 PNR 值
      const initialPnrValues: Record<string, string> = {}
      membersWithStatus.forEach(m => {
        if (m.pnr) {
          initialPnrValues[m.id] = m.pnr
        }
      })
      setPnrValues(initialPnrValues)
    } catch (error) {
      logger.error('載入成員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 儲存 PNR 值到資料庫
  const handlePnrBlur = async (memberId: string, value: string) => {
    try {
      await supabase
        .from('order_members')
        .update({ pnr: value || null })
        .eq('id', memberId)
    } catch (error) {
      logger.error('儲存 PNR 失敗:', error)
    }
  }

  const handleAddMember = async () => {
    if (mode === 'tour') {
      // 團體模式：需要先選擇訂單
      if (tourOrders.length === 0) {
        await alert('此團尚無訂單，請先建立訂單', 'warning')
        return
      }
      if (tourOrders.length === 1) {
        // 只有一個訂單，直接使用
        setSelectedOrderIdForAdd(tourOrders[0].id)
        setIsAddDialogOpen(true)
      } else {
        // 多個訂單，顯示選擇對話框
        setShowOrderSelectDialog(true)
      }
    } else {
      setIsAddDialogOpen(true)
    }
  }

  const confirmAddMembers = async () => {
    // 如果是空白或無效數字，預設為 1
    const count = typeof memberCountToAdd === 'number' ? memberCountToAdd : 1

    // 團體模式使用選擇的訂單 ID，單一訂單模式使用 prop 的 orderId
    const targetOrderId = mode === 'tour' ? selectedOrderIdForAdd : orderId
    if (!targetOrderId) {
      await alert('請選擇訂單', 'warning')
      return
    }

    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: targetOrderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers as any)
        .select()

      if (error) throw error
      setMembers([...members, ...(data || [])])
      setIsAddDialogOpen(false)
      setMemberCountToAdd(1)
    } catch (error) {
      logger.error('新增成員失敗:', error)
      await alert('新增失敗', 'error')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    // 找到要刪除的成員，顯示名稱讓使用者確認
    const memberToDelete = members.find(m => m.id === memberId)
    const memberName = memberToDelete?.chinese_name || memberToDelete?.passport_name || '此成員'

    const confirmed = await confirm(`確定要刪除「${memberName}」嗎？`, {
      title: '刪除成員',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase.from('order_members').delete().eq('id', memberId)

      if (error) throw error
      setMembers(members.filter(m => m.id !== memberId))
    } catch (error) {
      logger.error('刪除成員失敗:', error)
      await alert('刪除失敗', 'error')
    }
  }

  // 打開編輯/驗證彈窗
  const openEditDialog = (member: OrderMember, mode: 'verify' | 'edit') => {
    setEditingMember(member)
    setEditMode(mode)
    setEditFormData({
      chinese_name: member.chinese_name || '',
      passport_name: member.passport_name || '',
      birth_date: member.birth_date || '',
      gender: member.gender || '',
      id_number: member.id_number || '',
      passport_number: member.passport_number || '',
      passport_expiry: member.passport_expiry || '',
      special_meal: member.special_meal || '',
      remarks: member.remarks || '',
    })
    // 重置圖片編輯狀態
    imageEditor.reset()
    setIsEditDialogOpen(true)
  }

  // 儲存編輯/驗證（同步更新 order_members + customers）
  // 注意：圖片旋轉/翻轉/裁剪現在由工具列即時儲存，此處只處理表單資料
  const handleSaveEdit = async () => {
    if (!editingMember) return
    setIsSaving(true)

    try {
      const customerStore = useCustomerStore.getState()

      // 1. 更新 order_members
      // 空字串轉 null（日期欄位不接受空字串）
      const memberUpdateData: Record<string, unknown> = {
        chinese_name: editFormData.chinese_name || null,
        passport_name: editFormData.passport_name || null,
        birth_date: editFormData.birth_date || null,
        gender: editFormData.gender || null,
        id_number: editFormData.id_number || null,
        passport_number: editFormData.passport_number || null,
        passport_expiry: editFormData.passport_expiry || null,
        special_meal: editFormData.special_meal || null,
        remarks: editFormData.remarks || null,
      }

      const { error: memberError } = await supabase
        .from('order_members')
        .update(memberUpdateData)
        .eq('id', editingMember.id)

      if (memberError) throw memberError

      // 2. 處理顧客資料
      let newCustomerId: string | null = null

      if (editingMember.customer_id) {
        // 2a. 有關聯的顧客，同步更新 customers
        // 空字串轉 null（日期欄位不接受空字串）
        const customerUpdateData: Record<string, unknown> = {
          name: editFormData.chinese_name || null,
          passport_romanization: editFormData.passport_name || null,
          date_of_birth: editFormData.birth_date || null,
          gender: editFormData.gender || null,
          national_id: editFormData.id_number || null,
          passport_number: editFormData.passport_number || null,
          passport_expiry_date: editFormData.passport_expiry || null,
        }

        // 儲存時自動更新驗證狀態為 verified（無論是編輯或驗證模式）
        // 因為使用者已經看過並確認資料了
        customerUpdateData.verification_status = 'verified'

        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', editingMember.customer_id)

        if (customerError) {
          logger.error('更新顧客失敗:', customerError)
        } else {
          // 更新 store
          await customerStore.fetchAll()
        }
      } else if (editFormData.chinese_name || editFormData.passport_number || editFormData.id_number) {
        // 2b. 沒有關聯顧客但有填寫資料，嘗試比對或建立新顧客
        const passportNumber = editFormData.passport_number?.trim() || null
        const idNumber = editFormData.id_number?.trim() || null
        const birthDate = editFormData.birth_date || null
        const cleanChineseName = editFormData.chinese_name?.replace(/\([^)]+\)$/, '').trim() || null

        // 先比對現有顧客
        const existingCustomer = customers.find(c => {
          // 1. 優先用護照號碼比對
          if (passportNumber && c.passport_number === passportNumber) return true
          // 2. 其次用身分證比對
          if (idNumber && c.national_id === idNumber) return true
          // 3. 備用：姓名+生日比對
          if (cleanChineseName && birthDate &&
              c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
              c.date_of_birth === birthDate) return true
          return false
        })

        if (existingCustomer) {
          // 找到現有顧客，關聯到成員
          newCustomerId = existingCustomer.id
          await supabase
            .from('order_members')
            .update({ customer_id: existingCustomer.id })
            .eq('id', editingMember.id)

          // 同時更新顧客資料
          await supabase
            .from('customers')
            .update({
              name: editFormData.chinese_name || existingCustomer.name,
              passport_romanization: editFormData.passport_name || existingCustomer.passport_romanization,
              date_of_birth: editFormData.birth_date || existingCustomer.date_of_birth,
              gender: editFormData.gender || existingCustomer.gender,
              national_id: editFormData.id_number || existingCustomer.national_id,
              passport_number: editFormData.passport_number || existingCustomer.passport_number,
              passport_expiry_date: editFormData.passport_expiry || existingCustomer.passport_expiry_date,
              verification_status: 'verified',
            })
            .eq('id', existingCustomer.id)

          logger.info(`✅ 已關聯現有顧客: ${existingCustomer.name}`)
        } else {
          // 沒找到，建立新顧客
          const newCustomer = await customerStore.create({
            name: editFormData.chinese_name || '',
            passport_romanization: editFormData.passport_name || '',
            passport_number: passportNumber,
            passport_expiry_date: editFormData.passport_expiry || null,
            national_id: idNumber,
            date_of_birth: birthDate,
            gender: editFormData.gender || null,
            phone: '',
            is_vip: false,
            is_active: true,
            total_spent: 0,
            total_orders: 0,
            verification_status: 'verified',
          } as any)

          if (newCustomer) {
            newCustomerId = newCustomer.id
            await supabase
              .from('order_members')
              .update({ customer_id: newCustomer.id })
              .eq('id', editingMember.id)
            logger.info(`✅ 已建立新顧客: ${newCustomer.name}`)
          }
        }

        // 更新 store
        await customerStore.fetchAll()
      }

      // 3. 更新本地狀態（儲存後即為已驗證）
      setMembers(members.map(m =>
        m.id === editingMember.id
          ? {
              ...m,
              ...memberUpdateData,
              customer_id: newCustomerId || editingMember.customer_id,
              customer_verification_status: 'verified',
            }
          : m
      ))

      // 4. 關閉彈窗
      setIsEditDialogOpen(false)
      setEditingMember(null)
      void alert(editMode === 'verify' ? '驗證完成！' : '儲存成功！', 'success')
    } catch (error) {
      logger.error('儲存失敗:', error)
      void alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 全形轉半形工具函式（只轉換全形英數字和標點符號，不影響中文和注音）
  const toHalfWidth = (str: string): string => {
    return str.replace(/[\uFF01-\uFF5E]/g, (s) => {
      // 全形字符範圍 FF01-FF5E 對應半形 21-7E
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    })
  }

  // 更新本地狀態（不立即寫入資料庫，不做任何轉換）
  const updateLocalField = (memberId: string, field: keyof OrderMember, value: string | number) => {
    setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: value } : m)))
  }

  // 鍵盤導航處理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, memberIndex: number, fieldName: string) => {
    // 如果正在使用輸入法（如注音），不處理按鍵事件
    // 避免選字時 Enter 被當成確認/跳行
    if (e.nativeEvent.isComposing || isComposing) {
      return
    }

    const currentFieldIndex = editableFields.indexOf(fieldName)

    // 性別欄位：Enter 切換性別
    if (fieldName === 'gender' && e.key === 'Enter') {
      e.preventDefault()
      const member = members[memberIndex]
      const currentGender = member.gender
      const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : ''
      updateField(member.id, 'gender', newGender)
      return
    }

    // 全部編輯模式下，Enter 處理
    if (isAllEditMode && e.key === 'Enter') {
      e.preventDefault()
      const member = members[memberIndex]

      // 中文姓名欄位：按 Enter 觸發顧客搜尋
      if (fieldName === 'chinese_name' && member) {
        handleEditModeNameEnter(member.id, memberIndex)
        return
      }

      // 其他欄位：觸發 blur 來儲存
      ;(e.target as HTMLInputElement).blur()
      return
    }

    // Enter / 下鍵：移動到下一列同一欄位（非編輯模式）
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextMemberIndex = memberIndex + 1
      if (nextMemberIndex < members.length) {
        const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        nextInput?.focus()
      }
    }
    // 上鍵：移動到上一列同一欄位
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevMemberIndex = memberIndex - 1
      if (prevMemberIndex >= 0) {
        const prevInput = document.querySelector(`input[data-member="${members[prevMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
    // Tab：移動到右邊欄位
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex < editableFields.length - 1) {
        const nextField = editableFields[currentFieldIndex + 1]
        const nextInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement
        nextInput?.focus()
      } else {
        // 最後一欄，移到下一列第一欄
        const nextMemberIndex = memberIndex + 1
        if (nextMemberIndex < members.length) {
          const firstField = editableFields[0]
          const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${firstField}"]`) as HTMLInputElement
          nextInput?.focus()
        }
      }
    }
    // Shift+Tab：移動到左邊欄位
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex > 0) {
        const prevField = editableFields[currentFieldIndex - 1]
        const prevInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${prevField}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
  }

  // 直接更新欄位到資料庫和本地狀態
  const updateField = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    // 先更新本地狀態（即時反應）
    updateLocalField(memberId, field, value)

    // 如果正在使用輸入法，延遲資料庫寫入
    if (isComposing) {
      return
    }

    // 如果是字串，自動轉半形
    let processedValue: string | number | null = value
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value)
    }

    // 如果是空字串，對於日期欄位轉成 null
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null
    }

    try {
      const { error } = await supabase
        .from('order_members')
        .update({ [field]: processedValue })
        .eq('id', memberId)

      if (error) throw error

      // 確保本地狀態同步（使用處理過的值）
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: processedValue } : m)))
    } catch (error) {
      logger.error('更新失敗:', error)
      // 失敗時回滾本地狀態
      loadMembers()
    }
  }

  // 自動格式化日期輸入 (YYYY-MM-DD)
  const handleDateInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 只保留數字
    const numbers = value.replace(/\D/g, '')

    // 如果是空字串，立即更新為 null
    if (numbers.length === 0) {
      updateField(memberId, field, '')
      return
    }

    // 只顯示數字，不加分隔符號（讓使用者看到純數字）
    let formatted = numbers.slice(0, 8) // 最多 8 位數字

    // 只在輸入完整日期（8 位數字）時才格式化並存入資料庫
    if (numbers.length === 8) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8)
      updateField(memberId, field, formatted)

      // 如果是護照效期，檢查是否不足 6 個月
      if (field === 'passport_expiry' && departureDate) {
        checkPassportExpiry(formatted)
      }
    } else {
      // 輸入中途：只更新本地顯示（純數字，無分隔符號）
      setMembers(
        members.map(m => (m.id === memberId ? { ...m, [field]: formatted } : m))
      )
    }
  }

  // 檢查護照效期是否不足 6 個月
  const checkPassportExpiry = (expiryDate: string) => {
    if (!departureDate) return

    const expiry = new Date(expiryDate || '')
    const departure = new Date(departureDate || '')
    const sixMonthsBeforeDeparture = new Date(departure)
    sixMonthsBeforeDeparture.setMonth(sixMonthsBeforeDeparture.getMonth() - 6)

    if (expiry < sixMonthsBeforeDeparture) {
      void alert(
        `護照效期警告\n\n護照效期：${expiryDate}\n出發日期：${departureDate}\n\n護照效期不足出發日 6 個月，請提醒客戶更換護照！`,
        'warning'
      )
    }
  }

  // 根據台灣身分證號碼自動辨識性別
  const handleIdNumberChange = (memberId: string, value: string) => {
    // 先轉大寫和半形
    const processedValue = toHalfWidth(value).toUpperCase()
    updateField(memberId, 'id_number', processedValue)

    // 台灣身分證格式：第一碼英文，第二碼數字（1=男, 2=女）
    const idPattern = /^[A-Z][12]/

    if (idPattern.test(processedValue)) {
      // 自動判斷性別，不彈確認視窗
      const genderCode = processedValue.charAt(1)
      const detectedGender = genderCode === '1' ? 'M' : 'F'
      updateField(memberId, 'gender', detectedGender)
    } else if (processedValue.length >= 2) {
      // 如果格式不符且已輸入至少2個字元，提示手動選擇
      void alert('無法自動辨識性別\n\n請手動點擊性別欄位選擇', 'info')
    }
  }

  // 處理數字輸入（含全形半形轉換）
  const handleNumberInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 全形轉半形並只保留數字
    const processedValue = value
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[^\d.]/g, '')

    updateField(memberId, field, processedValue ? parseFloat(processedValue) : 0)
  }

  // ========== 顧客搜尋相關函數（編輯模式） ==========

  // 根據姓名搜尋顧客（2字以上觸發）
  const checkCustomerMatchByName = (name: string, memberIndex: number, memberData: Partial<OrderMember>) => {
    logger.log('checkCustomerMatchByName called:', { name, memberIndex, customersCount: customers.length })
    if (!name || name.length < 2) {
      logger.log('Name too short, skipping search')
      return
    }

    // 模糊搜尋：顧客姓名包含輸入的字串
    const nameMatches = customers.filter(c =>
      c.name?.includes(name) || name.includes(c.name || '')
    )
    logger.log('Name matches found:', nameMatches.length)

    if (nameMatches.length > 0) {
      setMatchedCustomers(nameMatches)
      setMatchType('name')
      setPendingMemberIndex(memberIndex)
      setPendingMemberData(memberData)
      setShowCustomerMatchDialog(true)
    }
  }

  // 根據身分證字號搜尋顧客（5字以上觸發）
  const checkCustomerMatchByIdNumber = (idNumber: string, memberIndex: number, memberData: Partial<OrderMember>) => {
    if (!idNumber || idNumber.length < 5) {
      return
    }

    // 雙向匹配身分證字號（輸入包含顧客ID 或 顧客ID包含輸入）
    const normalizedInput = idNumber.toUpperCase().trim()
    const idMatches = customers.filter(c => {
      if (!c.national_id) return false
      const normalizedCustomerId = c.national_id.toUpperCase().trim()
      // 前綴匹配或完全匹配
      return normalizedCustomerId.startsWith(normalizedInput) ||
             normalizedInput.startsWith(normalizedCustomerId) ||
             normalizedCustomerId === normalizedInput
    })

    if (idMatches.length > 0) {
      setMatchedCustomers(idMatches)
      setMatchType('id_number')
      setPendingMemberIndex(memberIndex)
      setPendingMemberData(memberData)
      setShowCustomerMatchDialog(true)
    }
  }

  // 選擇顧客後帶入資料
  const handleSelectCustomer = async (customer: typeof customers[0]) => {
    if (pendingMemberIndex === null) return

    const member = members[pendingMemberIndex]
    if (!member) return

    // 更新本地狀態
    const updatedMember = {
      ...member,
      chinese_name: customer.name || member.chinese_name,
      passport_name: customer.passport_romanization || member.passport_name,
      birth_date: customer.date_of_birth || member.birth_date,
      gender: customer.gender || member.gender,
      id_number: customer.national_id || member.id_number,
      passport_number: customer.passport_number || member.passport_number,
      passport_expiry: customer.passport_expiry_date || member.passport_expiry,
      passport_image_url: customer.passport_image_url || member.passport_image_url,
      customer_id: customer.id,
      customer_verification_status: customer.verification_status,
    }

    setMembers(members.map((m, i) => i === pendingMemberIndex ? updatedMember : m))

    // 儲存到資料庫
    try {
      await supabase
        .from('order_members')
        .update({
          chinese_name: updatedMember.chinese_name,
          passport_name: updatedMember.passport_name,
          birth_date: updatedMember.birth_date,
          gender: updatedMember.gender,
          id_number: updatedMember.id_number,
          passport_number: updatedMember.passport_number,
          passport_expiry: updatedMember.passport_expiry,
          passport_image_url: updatedMember.passport_image_url,
          customer_id: updatedMember.customer_id,
        })
        .eq('id', member.id)
    } catch (error) {
      logger.error('更新成員資料失敗:', error)
    }

    // 關閉對話框
    setShowCustomerMatchDialog(false)
    setPendingMemberIndex(null)
    setPendingMemberData(null)
  }

  // 編輯模式下的姓名輸入處理（只更新本地狀態，按 Enter 才搜尋顧客）
  const handleEditModeNameChange = (memberId: string, value: string) => {
    logger.log('handleEditModeNameChange called:', { memberId, value })
    setMembers(members.map(m => m.id === memberId ? { ...m, chinese_name: value } : m))
  }

  // 編輯模式下按 Enter 觸發顧客搜尋
  const handleEditModeNameEnter = (memberId: string, memberIndex: number) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    const name = member.chinese_name?.trim()
    if (name && name.length >= 2) {
      logger.log('Triggering customer search for name:', name)
      checkCustomerMatchByName(name, memberIndex, { ...member })
    }
  }

  // 編輯模式下的身分證輸入處理
  const handleEditModeIdNumberChange = (memberId: string, value: string, memberIndex: number) => {
    // 先轉大寫和半形
    const processedValue = toHalfWidth(value).toUpperCase()
    const member = members.find(m => m.id === memberId)
    if (!member) return

    // 自動判斷性別
    let gender = member.gender
    const idPattern = /^[A-Z][12]/
    if (idPattern.test(processedValue)) {
      const genderCode = processedValue.charAt(1)
      gender = genderCode === '1' ? 'M' : 'F'
    }

    setMembers(members.map(m => m.id === memberId ? { ...m, id_number: processedValue, gender } : m))

    // 5字以上觸發顧客搜尋
    if (processedValue.length >= 5) {
      checkCustomerMatchByIdNumber(processedValue, memberIndex, { ...member, id_number: processedValue })
    }
  }

  // 編輯模式失去焦點時儲存
  const handleEditModeBlur = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    if (isComposing) return

    let processedValue: string | number | null = value
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value)
    }
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null
    }

    try {
      await supabase
        .from('order_members')
        .update({ [field]: processedValue })
        .eq('id', memberId)
    } catch (error) {
      logger.error('儲存失敗:', error)
    }
  }

  // ========== 匯出列印功能 ==========
  const exportColumnLabels: Record<string, string> = {
    identity: '身份',
    chinese_name: '中文姓名',
    passport_name: '護照拼音',
    birth_date: '出生年月日',
    gender: '性別',
    id_number: '身分證號',
    passport_number: '護照號碼',
    passport_expiry: '護照效期',
    special_meal: '飲食禁忌',
    hotel_confirmation: '訂房代號',
    total_payable: '應付金額',
    deposit_amount: '訂金',
    balance: '尾款',
    remarks: '備註',
  }

  const handleExportPrint = () => {
    const selectedCols = Object.entries(exportColumns)
      .filter(([, selected]) => selected)
      .map(([key]) => key)

    if (selectedCols.length === 0) {
      void alert('請至少選擇一個欄位', 'warning')
      return
    }

    // 建立列印內容
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>成員名單</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 15px; text-align: center; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 10px; }
            h1 { font-size: 16px; }
            table { font-size: 11px; }
            th, td { padding: 4px 6px; }
          }
        </style>
      </head>
      <body>
        <h1>成員名單（共 ${members.length} 人）</h1>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">序</th>
              ${selectedCols.map(col => `<th>${exportColumnLabels[col]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${members.map((member, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${selectedCols.map(col => {
                  let value = ''
                  if (col === 'gender') {
                    value = member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'
                  } else if (col === 'balance') {
                    value = ((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()
                  } else if (col === 'total_payable' || col === 'deposit_amount') {
                    const num = member[col as keyof OrderMember] as number
                    value = num ? num.toLocaleString() : '-'
                  } else {
                    value = (member[col as keyof OrderMember] as string) || '-'
                  }
                  const align = ['total_payable', 'deposit_amount', 'balance'].includes(col) ? 'text-right' : ''
                  return `<td class="${align}">${value}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    // 開啟列印視窗
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      // 等待內容載入後列印
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }

    setIsExportDialogOpen(false)
  }

  // ========== PDF 轉 JPG 函數 ==========
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    // 動態載入 PDF.js
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const images: File[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const scale = 2 // 放大 2 倍以獲得更清晰的圖片
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context!,
        viewport: viewport,
      }).promise

      // 轉成 Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      })

      const fileName = `${pdfFile.name.replace('.pdf', '')}_page${i}.jpg`
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' })
      images.push(imageFile)
    }

    return images
  }

  // ========== 護照上傳相關函數 ==========
  const handlePassportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newProcessedFiles: ProcessedFile[] = []

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          // PDF 轉 JPG
          const images = await convertPdfToImages(file)
          for (const img of images) {
            const preview = URL.createObjectURL(img)
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            })
          }
        } else if (file.type.startsWith('image/')) {
          // 圖片直接加入
          const preview = URL.createObjectURL(file)
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          })
        }
      }

      setProcessedFiles(prev => [...prev, ...newProcessedFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newProcessedFiles: ProcessedFile[] = []

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          // PDF 轉 JPG
          const images = await convertPdfToImages(file)
          for (const img of images) {
            const preview = URL.createObjectURL(img)
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            })
          }
        } else if (file.type.startsWith('image/')) {
          // 圖片直接加入
          const preview = URL.createObjectURL(file)
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          })
        }
      }

      setProcessedFiles(prev => [...prev, ...newProcessedFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemovePassportFile = (index: number) => {
    setProcessedFiles(prev => {
      // 清理 preview URL
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  // 壓縮圖片（確保小於 800KB）
  const compressImage = async (file: File, quality = 0.6): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const maxDimension = 1200
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })

                if (compressedFile.size > 800 * 1024 && quality > 0.2) {
                  resolve(await compressImage(file, quality - 0.1))
                } else {
                  resolve(compressedFile)
                }
              } else {
                reject(new Error('壓縮失敗'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // 批次上傳護照並建立成員
  const handleBatchUpload = async () => {
    if (processedFiles.length === 0) return
    if (isUploading) return // 防止重複點擊

    setIsUploading(true)
    try {
      // 壓縮所有圖片
      const compressedFiles = await Promise.all(
        processedFiles.map(async (pf) => {
          return await compressImage(pf.file)
        })
      )

      // 建立 FormData
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('files', file)
      })

      // 呼叫 OCR API
      const response = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await response.json()

      // 統計
      let successCount = 0
      let duplicateCount = 0
      let matchedCustomerCount = 0  // 比對到現有顧客
      let newCustomerCount = 0      // 新建顧客
      const failedItems: string[] = []
      const duplicateItems: string[] = []

      // 載入現有成員（用於重複檢查）
      const targetOrderId = mode === 'tour' ? selectedOrderIdForAdd : orderId
      if (!targetOrderId) {
        throw new Error('需要訂單 ID 才能批次上傳')
      }
      const { data: existingMembers } = await supabase
        .from('order_members')
        .select('passport_number, id_number, chinese_name, birth_date')
        .eq('order_id', targetOrderId)

      const existingPassports = new Set(existingMembers?.map(m => m.passport_number).filter(Boolean) || [])
      const existingIdNumbers = new Set(existingMembers?.map(m => m.id_number).filter(Boolean) || [])
      // 用「中文名+生日」作為備用比對 key（避免護照號碼沒辨識到時漏掉）
      const existingNameBirthKeys = new Set(
        existingMembers
          ?.filter(m => m.chinese_name && m.birth_date)
          .map(m => `${m.chinese_name}|${m.birth_date}`) || []
      )

      // 載入顧客資料（用於同步比對）- 強制重新載入確保資料最新
      await useCustomerStore.getState().fetchAll()
      // 取得最新的 items（fetchAll 後 store 會更新）
      const freshCustomers = useCustomerStore.getState().items

      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i]
        if (item.success && item.customer) {
          const passportNumber = item.customer.passport_number || ''
          const idNumber = item.customer.national_id || ''
          const birthDate = item.customer.date_of_birth || null
          const chineseName = item.customer.name || ''
          // 移除括號內的拼音（例如「朱仔(CHU/WENYU)」→「朱仔」）
          const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()
          const nameBirthKey = cleanChineseName && birthDate ? `${cleanChineseName}|${birthDate}` : ''

          // 1. 檢查訂單成員是否重複（用護照號碼、身分證、或中文名+生日）
          let isDuplicate = false
          let duplicateReason = ''

          if (passportNumber && existingPassports.has(passportNumber)) {
            isDuplicate = true
            duplicateReason = '護照號碼重複'
          } else if (idNumber && existingIdNumbers.has(idNumber)) {
            isDuplicate = true
            duplicateReason = '身分證號重複'
          } else if (nameBirthKey && existingNameBirthKeys.has(nameBirthKey)) {
            isDuplicate = true
            duplicateReason = '姓名+生日重複'
          }

          if (isDuplicate) {
            duplicateCount++
            duplicateItems.push(`${chineseName || item.fileName} (${duplicateReason})`)
            continue // 跳過重複的
          }

          try {
            // 2. 上傳護照照片到 Supabase Storage
            let passportImageUrl: string | null = null
            if (compressedFiles[i]) {
              const file = compressedFiles[i]
              const timestamp = Date.now()
              const fileExt = file.name.split('.').pop() || 'jpg'
              const fileName = `${workspaceId}/${orderId}/${timestamp}_${i}.${fileExt}`

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('passport-images')
                .upload(fileName, file, {
                  contentType: file.type,
                  upsert: false,
                })

              if (uploadError) {
                logger.error('護照照片上傳失敗:', uploadError)
              } else {
                // 取得公開 URL
                const { data: urlData } = supabase.storage
                  .from('passport-images')
                  .getPublicUrl(fileName)
                passportImageUrl = urlData?.publicUrl || null
              }
            }

            // 3. 建立訂單成員（包含護照照片 URL）
            const memberData = {
              order_id: targetOrderId,
              workspace_id: workspaceId,
              customer_id: null, // 稍後背景同步
              chinese_name: cleanChineseName || '', // 使用清理後的中文名（移除括號內的拼音）
              passport_name: item.customer.passport_romanization || item.customer.english_name || '',
              passport_number: passportNumber,
              passport_expiry: item.customer.passport_expiry_date || null,
              birth_date: birthDate,
              id_number: idNumber,
              gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
              identity: '大人',
              member_type: 'adult',
              passport_image_url: passportImageUrl,
            }

            const { data: newMember, error } = await supabase
              .from('order_members')
              .insert(memberData)
              .select()
              .single()

            if (error) throw error

            // 更新本地快取（避免同一批次重複）
            if (passportNumber) existingPassports.add(passportNumber)
            if (idNumber) existingIdNumbers.add(idNumber)
            if (nameBirthKey) existingNameBirthKeys.add(nameBirthKey)

            successCount++

            // 3. 背景同步顧客（三重比對：護照號碼、身分證、姓名+生日）
            if (newMember && (idNumber || birthDate || passportNumber)) {
              // 查找現有顧客（三重比對）- 使用最新載入的顧客資料
              let existingCustomer = freshCustomers.find(c => {
                // 1. 優先用護照號碼比對
                if (passportNumber && c.passport_number === passportNumber) return true
                // 2. 其次用身分證比對
                if (idNumber && c.national_id === idNumber) return true
                // 3. 備用：姓名+生日比對（移除括號內的拼音）
                if (cleanChineseName && birthDate &&
                    c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
                    c.date_of_birth === birthDate) return true
                return false
              })

              if (existingCustomer) {
                // 找到現有顧客，關聯並補齊缺少的資料
                const updateData: Record<string, unknown> = {
                  customer_id: existingCustomer.id
                }

                // 如果 order_member 的拼音是空的，從現有顧客補上
                if (!newMember.passport_name && existingCustomer.passport_romanization) {
                  updateData.passport_name = existingCustomer.passport_romanization
                }

                await supabase
                  .from('order_members')
                  .update(updateData)
                  .eq('id', newMember.id)

                // 如果現有顧客沒有護照圖片，更新它
                if (passportImageUrl && !existingCustomer.passport_image_url) {
                  await supabase
                    .from('customers')
                    .update({ passport_image_url: passportImageUrl })
                    .eq('id', existingCustomer.id)
                }

                matchedCustomerCount++
                logger.info(`✅ 顧客已存在，已關聯: ${existingCustomer.name}`)
              } else {
                // 沒找到，建立新顧客
                const newCustomer = await useCustomerStore.getState().create({
                  name: item.customer.name || '',
                  english_name: item.customer.english_name || '',
                  passport_number: passportNumber,
                  passport_romanization: item.customer.passport_romanization || '',
                  passport_expiry_date: item.customer.passport_expiry_date || null,
                  passport_image_url: passportImageUrl,
                  national_id: idNumber,
                  date_of_birth: birthDate,
                  gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
                  phone: '',
                  is_vip: false,
                  is_active: true,
                  total_spent: 0,
                  total_orders: 0,
                  verification_status: 'unverified',
                } as any)

                if (newCustomer) {
                  await supabase
                    .from('order_members')
                    .update({ customer_id: newCustomer.id })
                    .eq('id', newMember.id)
                  newCustomerCount++
                  logger.info(`✅ 新建顧客: ${newCustomer.name}`)
                }
              }
            }
          } catch (error) {
            logger.error(`建立成員失敗 (${item.fileName}):`, error)
            failedItems.push(`${item.fileName} (建立失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員`
      if (matchedCustomerCount > 0) {
        message += `\n✅ 已比對 ${matchedCustomerCount} 位現有顧客`
      }
      if (newCustomerCount > 0) {
        message += `\n✅ 已新增 ${newCustomerCount} 位顧客資料`
      }
      if (duplicateCount > 0) {
        message += `\n\n⚠️ 跳過 ${duplicateCount} 位重複成員：\n${duplicateItems.join('\n')}`
      }
      message += `\n\n📋 重要提醒：\n• OCR 資料已標記為「待驗證」\n• 請務必人工檢查護照資訊`
      if (failedItems.length > 0) {
        message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`
      }
      void alert(message, 'success')

      // 清空檔案並重新載入成員
      processedFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
      setProcessedFiles([])
      await loadMembers()
      setIsAddDialogOpen(false)
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      void alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={mode === 'tour' ? '' : 'p-4'}>
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-morandi-blue" />
          <h4 className="font-medium text-morandi-primary">
            {mode === 'tour' ? `團員名單總覽 (${members.length} 人)` : `成員列表 (${members.length})`}
          </h4>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddMember}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={14} />
            新增成員
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAllEditMode(!isAllEditMode)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30",
              isAllEditMode && "bg-morandi-blue/10 text-morandi-blue"
            )}
            title={isAllEditMode ? "關閉全部編輯模式" : "開啟全部編輯模式"}
          >
            <Pencil size={14} />
            {isAllEditMode ? "關閉編輯" : "全部編輯"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowIdentityColumn(!showIdentityColumn)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30",
              showIdentityColumn && "bg-morandi-container/30 text-morandi-primary"
            )}
            title="顯示/隱藏身份欄位"
          >
            身份
          </Button>
          {/* 分房分車、PNR、費用按鈕（兩種模式都顯示） */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRoomColumn(!showRoomColumn)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-amber-50",
              showRoomColumn && "bg-amber-50 text-amber-600"
            )}
            title="顯示/隱藏分房欄位"
          >
            <Hotel size={14} />
            分房
          </Button>
          {showRoomColumn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowRoomManager(true)}
              className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              title="分房管理設定"
            >
              <Settings2 size={14} />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVehicleManager(true)}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-blue-50"
            title="分車管理"
          >
            <Bus size={14} />
            分車
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPnrColumn(!showPnrColumn)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-sky-50",
              showPnrColumn && "bg-sky-50 text-sky-600"
            )}
            title="顯示/隱藏 PNR 欄位"
          >
            <Plane size={14} />
            PNR
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddCostFieldDialog(true)}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-emerald-50"
            title="新增費用欄位"
          >
            <Coins size={14} />
            費用
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExportDialogOpen(true)}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30"
            title="匯出/列印成員名單"
            disabled={members.length === 0}
          >
            <Printer size={14} />
            匯出
          </Button>
          {/* 團體模式時隱藏關閉按鈕 */}
          {mode !== 'tour' && onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30"
            >
              <X size={14} />
              收起
            </Button>
          )}
        </div>
      </div>

      {/* 成員表格 */}
      {loading ? (
        <div className="text-center py-8 text-morandi-secondary">載入中...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-morandi-secondary">尚未新增成員</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40">
                {/* 團體模式：多筆訂單時顯示訂單編號 */}
                {mode === 'tour' && orderCount > 1 && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-[50px]">訂單</th>
                )}
                {showIdentityColumn && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">身份</th>
                )}
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  中文姓名
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照拼音
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  出生年月日
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-[60px]">性別</th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  身分證號
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照號碼
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照效期
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 bg-amber-50/50">
                  飲食禁忌
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  應付金額
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  訂金
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  尾款
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  備註
                </th>
                {/* 分房欄位 */}
                {showRoomColumn && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 bg-amber-50/50">
                    分房
                  </th>
                )}
                {/* PNR 欄位 */}
                {showPnrColumn && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 bg-sky-50/50">
                    PNR
                  </th>
                )}
                {/* 自訂費用欄位 */}
                {customCostFields.map(field => (
                  <th
                    key={field.id}
                    className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 bg-emerald-50/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>{field.name}</span>
                      <button
                        onClick={() => setCustomCostFields(prev => prev.filter(f => f.id !== field.id))}
                        className="text-morandi-secondary/50 hover:text-red-500 transition-colors"
                        title="移除此欄位"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-1.5 text-center font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // 當顯示分房欄位時，按照分房順序排序成員
                const sortedMembers = showRoomColumn && Object.keys(roomSortKeys).length > 0
                  ? [...members].sort((a, b) => {
                      const keyA = roomSortKeys[a.id] ?? 9999
                      const keyB = roomSortKeys[b.id] ?? 9999
                      return keyA - keyB
                    })
                  : members

                return sortedMembers.map((member, memberIndex) => (
                <tr
                  key={member.id}
                  className="group relative hover:bg-morandi-container/20 transition-colors"
                >
                  {/* 團體模式：多筆訂單時顯示訂單序號 */}
                  {mode === 'tour' && orderCount > 1 && (
                    <td className="border border-morandi-gold/20 px-2 py-1 bg-blue-50/50 text-center">
                      <span className="text-xs text-blue-600 font-medium">{member.order_code || '-'}</span>
                    </td>
                  )}
                  {/* 身份（領隊勾選） */}
                  {showIdentityColumn && (
                    <td className={cn("border border-morandi-gold/20 px-2 py-1 text-center", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                      {isAllEditMode ? (
                        <input
                          type="checkbox"
                          checked={member.identity === '領隊'}
                          onChange={e => updateField(member.id, 'identity', e.target.checked ? '領隊' : '大人')}
                          data-member={member.id}
                          data-field="identity"
                          className="w-4 h-4 cursor-pointer accent-morandi-primary"
                          title="勾選設為領隊"
                        />
                      ) : (
                        <span className="text-xs text-morandi-primary">{member.identity === '領隊' ? '✓ 領隊' : '-'}</span>
                      )}
                    </td>
                  )}

                  {/* 中文姓名 */}
                  <td className={cn(
                    "border border-morandi-gold/20 px-2 py-1",
                    isAllEditMode ? 'bg-white' : (member.customer_verification_status === 'unverified' ? 'bg-red-50' : 'bg-gray-50')
                  )}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.chinese_name || ''}
                        onChange={e => handleEditModeNameChange(member.id, e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          const value = e.currentTarget.value
                          setIsComposing(false)
                          setTimeout(() => {
                            handleEditModeNameChange(member.id, value)
                          }, 0)
                        }}
                        onBlur={e => handleEditModeBlur(member.id, 'chinese_name', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'chinese_name')}
                        data-member={member.id}
                        data-field="chinese_name"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="輸入姓名，按 Enter 搜尋"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "flex-1 text-xs",
                            member.customer_verification_status === 'unverified' ? 'text-red-600 font-medium' : 'text-morandi-primary'
                          )}
                          title={member.customer_verification_status === 'unverified' ? '⚠️ 待驗證 - 請點擊編輯按鈕' : ''}
                        >
                          {member.chinese_name || '-'}
                        </span>
                        {member.passport_image_url && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMember(member)
                              setIsPreviewOpen(true)
                            }}
                            className="p-0.5 text-morandi-gold hover:text-morandi-gold/80 transition-colors"
                            title="查看護照照片"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 護照拼音 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_name || ''}
                        onChange={e => updateField(member.id, 'passport_name', e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          const value = e.currentTarget.value
                          setIsComposing(false)
                          setTimeout(() => {
                            updateField(member.id, 'passport_name', value)
                          }, 0)
                        }}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_name')}
                        data-member={member.id}
                        data-field="passport_name"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.passport_name || '-'}</span>
                    )}
                  </td>

                  {/* 出生年月日 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.birth_date || ''}
                        onChange={e => handleDateInput(member.id, 'birth_date', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'birth_date')}
                        data-member={member.id}
                        data-field="birth_date"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="YYYYMMDD"
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.birth_date || '-'}</span>
                    )}
                  </td>

                  {/* 性別 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1 text-xs text-center", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <select
                        value={member.gender || ''}
                        onChange={e => updateField(member.id, 'gender', e.target.value)}
                        data-member={member.id}
                        data-field="gender"
                        className="w-full bg-transparent text-xs text-center border-none outline-none shadow-none"
                      >
                        <option value="">-</option>
                        <option value="M">男</option>
                        <option value="F">女</option>
                      </select>
                    ) : (
                      <span className="text-morandi-primary">
                        {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                      </span>
                    )}
                  </td>

                  {/* 身分證號 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.id_number || ''}
                        onChange={e => handleEditModeIdNumberChange(member.id, e.target.value, memberIndex)}
                        onBlur={e => handleEditModeBlur(member.id, 'id_number', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'id_number')}
                        data-member={member.id}
                        data-field="id_number"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="輸入身分證搜尋..."
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.id_number || '-'}</span>
                    )}
                  </td>

                  {/* 護照號碼 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_number || ''}
                        onChange={e => updateField(member.id, 'passport_number', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_number')}
                        data-member={member.id}
                        data-field="passport_number"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.passport_number || '-'}</span>
                    )}
                  </td>

                  {/* 護照效期 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_expiry || ''}
                        onChange={e => handleDateInput(member.id, 'passport_expiry', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_expiry')}
                        data-member={member.id}
                        data-field="passport_expiry"
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="YYYYMMDD"
                      />
                    ) : (
                      (() => {
                        const expiryInfo = formatPassportExpiryWithStatus(member.passport_expiry, departureDate)
                        return (
                          <span className={cn("text-xs", expiryInfo.className)}>
                            {expiryInfo.text}
                            {expiryInfo.statusLabel && (
                              <span className="ml-1 text-[10px] font-medium">
                                ({expiryInfo.statusLabel})
                              </span>
                            )}
                          </span>
                        )
                      })()
                    )}
                  </td>

                  {/* 飲食禁忌 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-amber-50/50">
                    <input
                      type="text"
                      value={member.special_meal || ''}
                      onChange={e => updateField(member.id, 'special_meal', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        const value = e.currentTarget.value
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'special_meal', value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'special_meal')}
                      data-member={member.id}
                      data-field="special_meal"
                      className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                    />
                  </td>

                  {/* 應付金額 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.total_payable || ''}
                      onChange={e => handleNumberInput(member.id, 'total_payable', e.target.value)}
                      className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                    />
                  </td>

                  {/* 訂金 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.deposit_amount || ''}
                      onChange={e => handleNumberInput(member.id, 'deposit_amount', e.target.value)}
                      className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                    />
                  </td>

                  {/* 尾款 (自動計算: 應付金額 - 訂金) */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-gray-50 text-xs text-center text-morandi-secondary">
                    {((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()}
                  </td>

                  {/* 備註 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.remarks || ''}
                      onChange={e => updateField(member.id, 'remarks', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        const value = e.currentTarget.value
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'remarks', value)
                        }, 0)
                      }}
                      className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                    />
                  </td>

                  {/* 分房欄位 */}
                  {showRoomColumn && (
                    <td className="border border-morandi-gold/20 px-2 py-1 bg-amber-50/50">
                      <span className="text-xs text-amber-700">
                        {roomAssignments[member.id] || '未分房'}
                      </span>
                    </td>
                  )}

                  {/* PNR 欄位 */}
                  {showPnrColumn && (
                    <td className="border border-morandi-gold/20 px-2 py-1 bg-sky-50/50">
                      <input
                        type="text"
                        value={pnrValues[member.id] || ''}
                        onChange={e => setPnrValues(prev => ({ ...prev, [member.id]: e.target.value }))}
                        onBlur={e => handlePnrBlur(member.id, e.target.value)}
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="輸入 PNR"
                      />
                    </td>
                  )}

                  {/* 自訂費用欄位 */}
                  {customCostFields.map(field => (
                    <td
                      key={field.id}
                      className="border border-morandi-gold/20 px-2 py-1 bg-emerald-50/50"
                    >
                      <input
                        type="text"
                        value={field.values[member.id] || ''}
                        onChange={e => {
                          const newValue = e.target.value
                          setCustomCostFields(prev => prev.map(f =>
                            f.id === field.id
                              ? { ...f, values: { ...f.values, [member.id]: newValue } }
                              : f
                          ))
                        }}
                        className="w-full bg-transparent text-xs border-none outline-none shadow-none"
                        placeholder="輸入金額"
                      />
                    </td>
                  ))}

                  {/* 操作 - 警告/編輯/刪除 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* 警告按鈕（待驗證時顯示） */}
                      {member.customer_verification_status === 'unverified' && (
                        <button
                          onClick={() => openEditDialog(member, 'verify')}
                          className="text-amber-500 hover:text-amber-600 transition-colors p-1"
                          title="待驗證 - 點擊驗證"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      )}
                      {/* 編輯按鈕 */}
                      <button
                        onClick={() => openEditDialog(member, 'edit')}
                        className="text-morandi-blue hover:text-morandi-blue/80 transition-colors p-1"
                        title="編輯成員"
                      >
                        <Pencil size={14} />
                      </button>
                      {/* 刪除按鈕 */}
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-morandi-secondary/50 hover:text-red-500 transition-colors p-1"
                        title="刪除成員"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* 團體模式：訂單選擇對話框 */}
      <Dialog open={showOrderSelectDialog} onOpenChange={setShowOrderSelectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>選擇訂單</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              此團有多筆訂單，請選擇要新增成員的訂單：
            </p>
            <div className="space-y-2">
              {tourOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderIdForAdd(order.id)
                    setShowOrderSelectDialog(false)
                    setIsAddDialogOpen(true)
                  }}
                  className="w-full p-3 text-left rounded-lg border border-morandi-gold/30 hover:bg-morandi-gold/10 hover:border-morandi-gold transition-colors"
                >
                  <span className="font-mono text-morandi-primary">{order.order_number || '未命名訂單'}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增成員對話框 - 左右兩半 */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setMemberCountToAdd(1)
          setSelectedOrderIdForAdd(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增成員</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* 左邊：輸入人數 */}
            <div className="space-y-4 border-r border-border pr-6">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Hash size={18} />
                <span>依人數新增</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                快速新增空白成員列，之後手動填寫資料
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">新增數量：</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={memberCountToAdd}
                  onChange={e => {
                    let value = e.target.value
                    value = value.replace(/[\uff10-\uff19]/g, ch =>
                      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
                    )
                    if (value === '') {
                      setMemberCountToAdd('')
                      return
                    }
                    const num = parseInt(value, 10)
                    if (!isNaN(num)) {
                      setMemberCountToAdd(Math.min(50, Math.max(1, num)))
                    }
                  }}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      confirmAddMembers()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  autoFocus
                />
              </div>
              <Button
                onClick={confirmAddMembers}
                className="w-full bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                新增 {memberCountToAdd || 1} 位成員
              </Button>
            </div>

            {/* 右邊：上傳護照 OCR 辨識（和顧客管理一樣） */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Upload size={18} />
                <span>上傳護照辨識</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                上傳護照圖片，自動辨識並建立成員資料
              </p>

              {/* 重要提醒 */}
              <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-primary mb-2">⚠️ 重要提醒</h4>
                <ul className="text-xs text-morandi-secondary space-y-1">
                  <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                  <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                  <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
                </ul>
              </div>

              {/* 拍攝提示 */}
              <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-gold mb-2">📸 拍攝建議</h4>
                <ul className="text-xs text-morandi-gold space-y-1">
                  <li>✓ 確保護照<strong>最下方兩排文字</strong>清晰可見</li>
                  <li>✓ 光線充足，避免反光或陰影</li>
                  <li>✓ 拍攝角度正面，避免傾斜</li>
                </ul>
              </div>

              {/* 上傳區域 */}
              <label
                htmlFor="member-passport-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging
                    ? 'border-morandi-gold bg-morandi-gold/20 scale-105'
                    : isProcessing
                    ? 'border-morandi-blue bg-morandi-blue/10'
                    : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  {isProcessing ? (
                    <>
                      <div className="w-6 h-6 mb-2 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-morandi-primary">處理檔案中...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-morandi-secondary" />
                      <p className="text-sm text-morandi-primary">
                        <span className="font-semibold">點擊上傳</span> 或拖曳檔案
                      </p>
                      <p className="text-xs text-morandi-secondary">支援 JPG, PNG, PDF（可多選）</p>
                    </>
                  )}
                </div>
                <input
                  id="member-passport-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handlePassportFileChange}
                  disabled={isUploading || isProcessing}
                />
              </label>

              {/* 已選檔案列表（含縮圖） */}
              {processedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-morandi-secondary mb-2">
                    已選擇 {processedFiles.length} 張圖片：
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {processedFiles.map((pf, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-morandi-container/20 rounded"
                      >
                        {/* 縮圖 */}
                        <img
                          src={pf.preview}
                          alt={pf.file.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {pf.isPdf ? (
                              <FileText size={12} className="text-morandi-red flex-shrink-0" />
                            ) : (
                              <FileImage size={12} className="text-morandi-gold flex-shrink-0" />
                            )}
                            <span className="text-xs text-morandi-primary truncate">
                              {pf.file.name}
                            </span>
                          </div>
                          <span className="text-xs text-morandi-secondary">
                            {(pf.file.size / 1024).toFixed(1)} KB
                            {pf.isPdf && <span className="ml-1 text-morandi-red">(從 PDF 轉換)</span>}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePassportFile(index)}
                          className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                          disabled={isUploading}
                        >
                          <Trash2 size={12} className="text-morandi-red" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    {isUploading ? '辨識中...' : `辨識並建立 ${processedFiles.length} 位成員`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 護照照片預覽對話框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewMember?.chinese_name || previewMember?.passport_name || '護照照片'}
            </DialogTitle>
          </DialogHeader>
          {previewMember?.passport_image_url && (
            <div className="flex justify-center">
              <img
                src={previewMember.passport_image_url}
                alt="護照照片"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編輯/驗證成員彈窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingMember(null)
          setEditFormData({})
          imageEditor.reset()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {editMode === 'verify' ? (
                <>
                  <AlertTriangle className="text-amber-500" size={20} />
                  驗證成員資料
                </>
              ) : (
                <>
                  <Pencil className="text-morandi-blue" size={20} />
                  編輯成員資料
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
            {/* 左邊：護照照片 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
                {editingMember?.passport_image_url && !imageEditor.isCropMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => imageEditor.zoomOut()}
                      className="p-1.5 hover:bg-gray-100 rounded-md"
                      title="縮小"
                    >
                      <ZoomOut size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                      {Math.round(imageEditor.zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => imageEditor.zoomIn()}
                      className="p-1.5 hover:bg-gray-100 rounded-md"
                      title="放大"
                    >
                      <ZoomIn size={16} className="text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.reset()}
                      className="p-1.5 hover:bg-gray-100 rounded-md ml-1"
                      title="重置檢視"
                    >
                      <X size={16} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* 工具列 */}
              {editingMember?.passport_image_url && !imageEditor.isCropMode && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => imageEditor.rotateLeft()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <RotateCcw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">左轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.rotateRight()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <RotateCw size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">右轉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageEditor.toggleFlipH()}
                      className={`p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs ${imageEditor.flipH ? 'bg-blue-100' : ''}`}
                    >
                      <FlipHorizontal size={16} className="text-blue-600" />
                      <span className="text-gray-600 hidden sm:inline">翻轉</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => imageEditor.startCrop()}
                      className="p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs"
                    >
                      <Crop size={16} className="text-purple-600" />
                      <span className="text-gray-600 hidden sm:inline">裁剪</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {(imageEditor.rotation !== 0 || imageEditor.flipH) && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingMember?.passport_image_url) return
                          imageEditor.setIsSaving(true)
                          try {
                            const transformedImage = await imageEditor.transformImage(
                              editingMember.passport_image_url,
                              imageEditor.rotation,
                              imageEditor.flipH
                            )
                            const response = await fetch(transformedImage)
                            const blob = await response.blob()
                            const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                            const { error: uploadError } = await supabase.storage
                              .from('passport-images')
                              .upload(fileName, blob, { upsert: true })
                            if (uploadError) throw uploadError
                            const { data: urlData } = supabase.storage
                              .from('passport-images')
                              .getPublicUrl(fileName)
                            await supabase
                              .from('order_members')
                              .update({ passport_image_url: urlData.publicUrl })
                              .eq('id', editingMember.id)
                            setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })
                            imageEditor.reset()
                            const { toast } = await import('sonner')
                            toast.success('圖片已儲存')
                          } catch (error) {
                            const { toast } = await import('sonner')
                            toast.error('儲存圖片失敗')
                          } finally {
                            imageEditor.setIsSaving(false)
                          }
                        }}
                        disabled={imageEditor.isSaving}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                      >
                        <Save size={16} />
                        <span>{imageEditor.isSaving ? '儲存中...' : '儲存圖片'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMember?.passport_image_url) return
                        await recognizePassport(editingMember.passport_image_url, (result) => {
                          setEditFormData(prev => ({
                            ...prev,
                            chinese_name: result.name || prev.chinese_name,
                            passport_name: result.passport_romanization || prev.passport_name,
                            birth_date: result.date_of_birth || prev.birth_date,
                            gender: result.gender === '男' ? 'M' : result.gender === '女' ? 'F' : prev.gender,
                            id_number: result.national_id || prev.id_number,
                            passport_number: result.passport_number || prev.passport_number,
                            passport_expiry: result.passport_expiry_date || prev.passport_expiry,
                          }))
                        })
                      }}
                      disabled={isRecognizing}
                      className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={isRecognizing ? 'animate-spin' : ''} />
                      <span>{isRecognizing ? '辨識中...' : '再次辨識'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 裁剪模式工具列 */}
              {editingMember?.passport_image_url && imageEditor.isCropMode && (
                <div className="flex items-center justify-between bg-purple-50 rounded-lg p-2">
                  <span className="text-xs text-purple-700">拖曳框選要保留的區域</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => imageEditor.cancelCrop()}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-white rounded-md"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingMember?.passport_image_url) return
                        try {
                          const croppedImage = await imageEditor.confirmCrop(editingMember.passport_image_url)
                          if (croppedImage) {
                            imageEditor.setIsSaving(true)
                            const response = await fetch(croppedImage)
                            const blob = await response.blob()
                            const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                            const { error: uploadError } = await supabase.storage
                              .from('passport-images')
                              .upload(fileName, blob, { upsert: true })
                            if (uploadError) throw uploadError
                            const { data: urlData } = supabase.storage
                              .from('passport-images')
                              .getPublicUrl(fileName)
                            await supabase
                              .from('order_members')
                              .update({ passport_image_url: urlData.publicUrl })
                              .eq('id', editingMember.id)
                            setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })
                            imageEditor.reset()
                            const { toast } = await import('sonner')
                            toast.success('裁剪完成')
                          }
                        } catch (error) {
                          const { toast } = await import('sonner')
                          toast.error(error instanceof Error ? error.message : '裁剪失敗')
                        } finally {
                          imageEditor.setIsSaving(false)
                        }
                      }}
                      disabled={imageEditor.cropRect.width < 20 || imageEditor.isSaving}
                      className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {imageEditor.isSaving ? '處理中...' : '確認裁剪'}
                    </button>
                  </div>
                </div>
              )}

              {/* 圖片容器 */}
              {editingMember?.passport_image_url ? (
                <div
                  ref={imageEditor.containerRef}
                  className={`relative overflow-hidden rounded-lg border bg-gray-50 ${
                    imageEditor.isCropMode
                      ? 'border-purple-400 cursor-crosshair'
                      : 'cursor-grab active:cursor-grabbing'
                  }`}
                  style={{ height: '320px' }}
                  onWheel={imageEditor.handleWheel}
                  onMouseDown={(e) => imageEditor.handleMouseDown(e, imageEditor.containerRef.current)}
                  onMouseMove={(e) => imageEditor.handleMouseMove(e, imageEditor.containerRef.current)}
                  onMouseUp={imageEditor.handleMouseUp}
                  onMouseLeave={(e) => imageEditor.handleMouseLeave(e, imageEditor.containerRef.current)}
                >
                  <img
                    src={editingMember.passport_image_url}
                    alt="護照照片"
                    className="absolute w-full h-full object-contain transition-transform"
                    style={{
                      transform: `translate(${imageEditor.position.x}px, ${imageEditor.position.y}px) scale(${imageEditor.zoom}) rotate(${imageEditor.rotation}deg) ${imageEditor.flipH ? 'scaleX(-1)' : ''}`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />
                  {/* 裁剪框 */}
                  {imageEditor.isCropMode && imageEditor.cropRect.width > 0 && (
                    <div
                      className="absolute border-2 border-purple-500 bg-purple-500/10"
                      style={{
                        left: imageEditor.cropRect.x,
                        top: imageEditor.cropRect.y,
                        width: imageEditor.cropRect.width,
                        height: imageEditor.cropRect.height,
                      }}
                    />
                  )}
                </div>
              ) : (
                <label
                  htmlFor="edit-passport-upload"
                  className="w-full h-48 bg-morandi-container/30 rounded-lg flex flex-col items-center justify-center text-morandi-secondary border-2 border-dashed border-morandi-secondary/30 hover:border-morandi-gold hover:bg-morandi-gold/5 cursor-pointer transition-all"
                >
                  <Upload size={32} className="mb-2 opacity-50" />
                  <span className="text-sm">點擊上傳護照照片</span>
                  <span className="text-xs mt-1 opacity-70">支援 JPG、PNG</span>
                  <input
                    id="edit-passport-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !editingMember) return

                      try {
                        // 壓縮圖片
                        const compressedFile = await new Promise<File>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.readAsDataURL(file)
                          reader.onload = (ev) => {
                            const img = new Image()
                            img.src = ev.target?.result as string
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              let { width, height } = img
                              const maxDimension = 1200
                              if (width > maxDimension || height > maxDimension) {
                                if (width > height) {
                                  height = (height / width) * maxDimension
                                  width = maxDimension
                                } else {
                                  width = (width / height) * maxDimension
                                  height = maxDimension
                                }
                              }
                              canvas.width = width
                              canvas.height = height
                              const ctx = canvas.getContext('2d')!
                              ctx.drawImage(img, 0, 0, width, height)
                              canvas.toBlob(
                                (blob) => {
                                  if (blob) {
                                    resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                                  } else {
                                    reject(new Error('壓縮失敗'))
                                  }
                                },
                                'image/jpeg',
                                0.8
                              )
                            }
                            img.onerror = reject
                          }
                          reader.onerror = reject
                        })

                        // 上傳到 Supabase Storage
                        const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`
                        const { error: uploadError } = await supabase.storage
                          .from('passport-images')
                          .upload(fileName, compressedFile, { upsert: true })

                        if (uploadError) throw uploadError

                        const { data: urlData } = supabase.storage
                          .from('passport-images')
                          .getPublicUrl(fileName)

                        // 更新資料庫
                        await supabase
                          .from('order_members')
                          .update({ passport_image_url: urlData.publicUrl })
                          .eq('id', editingMember.id)

                        // 更新本地狀態
                        setEditingMember({ ...editingMember, passport_image_url: urlData.publicUrl })

                        const { toast } = await import('sonner')
                        toast.success('護照照片上傳成功')
                      } catch (error) {
                        logger.error('護照上傳失敗:', error)
                        const { toast } = await import('sonner')
                        toast.error('上傳失敗，請重試')
                      }

                      // 清空 input
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
              {editMode === 'verify' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    請仔細核對護照照片與右邊的資料是否一致。驗證完成後，此成員的資料將被標記為「已驗證」。
                  </p>
                </div>
              )}
            </div>

            {/* 右邊：表單 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-morandi-primary">成員資料</h3>

              {/* 中文姓名 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">中文姓名</label>
                <input
                  type="text"
                  value={editFormData.chinese_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, chinese_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照拼音 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照拼音</label>
                <input
                  type="text"
                  value={editFormData.passport_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 出生年月日 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">出生年月日</label>
                <input
                  type="text"
                  value={editFormData.birth_date || ''}
                  onChange={e => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 性別 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">性別</label>
                <select
                  value={editFormData.gender || ''}
                  onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  <option value="">請選擇</option>
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
              </div>

              {/* 身分證號 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">身分證號</label>
                <input
                  type="text"
                  value={editFormData.id_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, id_number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照號碼 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照號碼</label>
                <input
                  type="text"
                  value={editFormData.passport_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照效期 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照效期</label>
                <input
                  type="text"
                  value={editFormData.passport_expiry || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_expiry: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 特殊餐食 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">特殊餐食</label>
                <input
                  type="text"
                  value={editFormData.special_meal || ''}
                  onChange={e => setEditFormData({ ...editFormData, special_meal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">備註</label>
                <textarea
                  value={editFormData.remarks || ''}
                  onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold resize-none"
                />
              </div>
            </div>
          </div>

          {/* 按鈕區域 - 固定在底部 */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 pb-2 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              size="lg"
              className={editMode === 'verify'
                ? 'bg-green-600 hover:bg-green-700 text-white px-8 font-medium'
                : 'bg-morandi-gold hover:bg-morandi-gold-hover text-white px-8 font-medium'
              }
            >
              {isSaving ? '儲存中...' : editMode === 'verify' ? '確認驗證' : '儲存變更'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 顧客選擇對話框 */}
      <Dialog open={showCustomerMatchDialog} onOpenChange={setShowCustomerMatchDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {matchType === 'name' ? '找到相符的顧客 (姓名)' : '找到相符的顧客 (身分證)'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-morandi-secondary mb-4">
              請選擇要帶入的顧客資料，或點擊「取消」繼續手動輸入
            </p>

            {/* 橫向表格顯示 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-morandi-container/30">
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">姓名</th>
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">英文拼音</th>
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">身分證</th>
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">護照號碼</th>
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">生日</th>
                    <th className="px-3 py-2 text-left font-medium text-morandi-secondary border">性別</th>
                    <th className="px-3 py-2 text-center font-medium text-morandi-secondary border w-20">選擇</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-morandi-container/20 cursor-pointer"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <td className="px-3 py-2 border text-morandi-primary font-medium">
                        {customer.name || '-'}
                      </td>
                      <td className="px-3 py-2 border text-morandi-primary">
                        {customer.passport_romanization || '-'}
                      </td>
                      <td className="px-3 py-2 border text-morandi-primary font-mono">
                        {customer.national_id || '-'}
                      </td>
                      <td className="px-3 py-2 border text-morandi-primary">
                        {customer.passport_number || '-'}
                      </td>
                      <td className="px-3 py-2 border text-morandi-primary">
                        {customer.date_of_birth || '-'}
                      </td>
                      <td className="px-3 py-2 border text-morandi-primary text-center">
                        {customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '-'}
                      </td>
                      <td className="px-3 py-2 border text-center">
                        <Button
                          size="sm"
                          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCustomer(customer)
                          }}
                        >
                          選擇
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomerMatchDialog(false)
                setPendingMemberIndex(null)
                setPendingMemberData(null)
              }}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 匯出對話框 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer size={20} className="text-morandi-gold" />
              匯出成員名單
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-morandi-secondary mb-4">
              選擇要匯出的欄位，然後點擊「列印」
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exportColumnLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-morandi-container/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={exportColumns[key] || false}
                    onChange={e => setExportColumns({
                      ...exportColumns,
                      [key]: e.target.checked
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-morandi-gold focus:ring-morandi-gold"
                  />
                  <span className="text-sm text-morandi-primary">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allSelected = Object.values(exportColumns).every(v => v)
                  const newValue = !allSelected
                  setExportColumns(
                    Object.fromEntries(
                      Object.keys(exportColumns).map(k => [k, newValue])
                    )
                  )
                }}
                className="text-xs"
              >
                {Object.values(exportColumns).every(v => v) ? '取消全選' : '全選'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleExportPrint}
              className="bg-morandi-gold hover:bg-morandi-gold/90 text-white gap-1"
            >
              <Printer size={16} />
              列印
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分房管理對話框 */}
      <TourRoomManager
        tourId={tourId}
        tour={departureDate && returnDate ? {
          id: tourId,
          departure_date: departureDate,
          return_date: returnDate,
        } : undefined}
        members={members.map(m => ({
          id: m.id,
          chinese_name: m.chinese_name ?? null,
          passport_name: m.passport_name ?? null,
        }))}
        open={showRoomManager}
        onOpenChange={(open) => {
          setShowRoomManager(open)
          // 關閉對話框時重新載入分房資訊
          if (!open) {
            loadRoomAssignments()
          }
        }}
      />

      {/* 分車管理對話框 */}
      <TourVehicleManager
        tourId={tourId}
        members={members.map(m => ({
          id: m.id,
          chinese_name: m.chinese_name ?? null,
          passport_name: m.passport_name ?? null,
        }))}
        open={showVehicleManager}
        onOpenChange={setShowVehicleManager}
      />

      {/* 新增費用欄位對話框 */}
      <Dialog open={showAddCostFieldDialog} onOpenChange={setShowAddCostFieldDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增費用欄位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                欄位名稱
              </label>
              <Input
                value={newCostFieldName}
                onChange={(e) => setNewCostFieldName(e.target.value)}
                placeholder="例如：機票、簽證費、保險..."
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCostFieldDialog(false)
                setNewCostFieldName('')
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (newCostFieldName.trim()) {
                  setCustomCostFields(prev => [
                    ...prev,
                    {
                      id: `cost_${Date.now()}`,
                      name: newCostFieldName.trim(),
                      values: {},
                    },
                  ])
                  setNewCostFieldName('')
                  setShowAddCostFieldDialog(false)
                }
              }}
              disabled={!newCostFieldName.trim()}
              className="bg-morandi-gold hover:bg-morandi-gold/90 text-white"
            >
              新增
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
