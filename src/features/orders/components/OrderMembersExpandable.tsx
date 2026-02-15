'use client'
/**
 * OrderMembersExpandable - 訂單成員管理主組件（完全重構版）
 *
 * 已整合：
 * - 6個 Hooks: useOrderMembersData, useRoomVehicleAssignments, useCustomerMatch, useMemberExport, useMemberEditDialog, usePassportUpload
 * - 9個組件: MemberRow, AddMemberDialog, MemberEditDialog, ExportDialog, PassportUploadZone, OrderSelectDialog, CustomerMatchDialog, CustomCostFieldsSection, MemberTableHeader
 *
 * 行數：< 300 行
 */


import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Plus, Printer, Hotel, Bus, Coins, Settings, Pencil, Plane, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { prompt } from '@/lib/ui/alert-dialog'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// TODO: [品質優化] 進一步將顧客同步的 supabase 操作也搬到 service 層
import { supabase } from '@/lib/supabase/client'
import { updateMembersTicketingDeadline } from '@/features/orders/services/order_member.service'
import { updateMember } from '@/data/entities/members'
import { logger } from '@/lib/utils/logger'
import { useOcrRecognition } from '@/hooks'
import { useCustomers, useTour } from '@/data'
import { TourAssignmentManager } from '@/features/tours/components/TourAssignmentManager'
import {
  useOrderMembersData,
  useRoomVehicleAssignments,
  useCustomerMatch,
  useMemberExport,
  useMemberEditDialog,
  usePassportUpload,
  useColumnWidths,
} from '../hooks'
import {
  MemberRow,
  AddMemberDialog,
  MemberEditDialog,
  OrderSelectDialog,
  CustomerMatchDialog,
  CustomCostFieldsSection,
  MemberTableHeader,
  PnrMatchDialog,
} from './'
import dynamic from 'next/dynamic'
import { PassportConflictDialog } from './PassportConflictDialog'

const TourPrintDialog = dynamic(() => import('@/features/tours/components/TourPrintDialog').then(m => m.TourPrintDialog), { ssr: false })
import type { OrderMember, OrderMembersExpandableProps, CustomCostField } from '../types/order-member.types'
import type { EditFormData } from './MemberEditDialog'
import { COMP_ORDERS_LABELS } from '../constants/labels'
import { computeRowSpans } from '../utils'

// 可切換顯示的欄位定義
export interface ColumnVisibility {
  passport_name: boolean
  birth_date: boolean
  gender: boolean
  id_number: boolean
  passport_number: boolean
  passport_expiry: boolean
  special_meal: boolean
  total_payable: boolean
  deposit_amount: boolean
  balance: boolean
  remarks: boolean
  pnr: boolean
  ticket_number: boolean
  ticketing_deadline: boolean
  flight_cost: boolean  // 機票金額（成本）
  room: boolean  // 分房欄位
  vehicle: boolean  // 分車欄位
}

// 預設欄位顯示設定（訂金/尾款/應付金額 預設關閉）
const defaultColumnVisibility: ColumnVisibility = {
  passport_name: true,
  birth_date: true,
  gender: true,
  id_number: true,
  passport_number: true,
  passport_expiry: true,
  special_meal: true,
  total_payable: false,
  deposit_amount: false,
  balance: false,
  remarks: true,
  pnr: false,
  ticket_number: true,  // 預設顯示機票號碼
  ticketing_deadline: false,
  flight_cost: false,   // 機票金額預設關閉
  room: true,   // 分房欄位預設顯示（有資料時）
  vehicle: true,  // 分車欄位預設顯示（有資料時）
}

// 欄位標籤對照
const columnLabels: Record<keyof ColumnVisibility, string> = {
  passport_name: COMP_ORDERS_LABELS.護照拼音,
  birth_date: COMP_ORDERS_LABELS.出生年月日,
  gender: COMP_ORDERS_LABELS.性別,
  id_number: COMP_ORDERS_LABELS.身分證號,
  passport_number: COMP_ORDERS_LABELS.護照號碼,
  passport_expiry: COMP_ORDERS_LABELS.護照效期,
  special_meal: COMP_ORDERS_LABELS.飲食禁忌,
  total_payable: COMP_ORDERS_LABELS.應付金額,
  deposit_amount: COMP_ORDERS_LABELS.訂金,
  balance: COMP_ORDERS_LABELS.尾款,
  remarks: COMP_ORDERS_LABELS.備註,
  pnr: 'PNR',
  ticket_number: COMP_ORDERS_LABELS.機票號碼,
  ticketing_deadline: COMP_ORDERS_LABELS.開票期限,
  flight_cost: COMP_ORDERS_LABELS.機票金額,
  room: COMP_ORDERS_LABELS.分房,
  vehicle: COMP_ORDERS_LABELS.分車,
}

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
  mode: propMode,
  embedded = false,
  forceShowPnr = false,
  tour,
  onChildDialogChange,
  showPnrMatchDialog: parentShowPnrMatchDialog,
  onPnrMatchDialogChange,
  onPnrMatchSuccess,
}: OrderMembersExpandableProps & { onChildDialogChange?: (hasOpen: boolean) => void }) {
  const mode = propMode || (orderId ? 'order' : 'tour')

  // Hooks
  const { items: customers } = useCustomers()
  // 當沒有傳入 tour prop 時，根據 tourId 自動獲取 tour 資料（用於訂單管理頁的列印功能）
  const { item: fetchedTour } = useTour(tour ? null : tourId)
  const effectiveTour = tour || fetchedTour
  const membersData = useOrderMembersData({ orderId, tourId, workspaceId, mode })
  const roomVehicle = useRoomVehicleAssignments({ tourId, departureDate: membersData.departureDate })
  const customerMatch = useCustomerMatch(customers, membersData.members, membersData.setMembers)
  const memberExport = useMemberExport(membersData.members)
  const memberEdit = useMemberEditDialog({ members: membersData.members, setMembers: membersData.setMembers })
  // 🔧 修復：團體模式下使用選擇的訂單 ID 或第一個訂單的 ID
  const effectiveOrderId = orderId || membersData.selectedOrderIdForAdd || (membersData.tourOrders.length === 1 ? membersData.tourOrders[0]?.id : undefined)
  const passportUpload = usePassportUpload({ orderId: effectiveOrderId, workspaceId, onSuccess: membersData.loadMembers })
  const { isRecognizing, recognizePassport } = useOcrRecognition()
  const { columnWidths, setColumnWidth } = useColumnWidths()

  // DnD Kit sensors for drag-and-drop sorting
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 處理拖曳結束（支援整間房一起移動）
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const draggedId = active.id as string
    const targetId = over.id as string

    // 找出所有同房成員（檢查所有飯店的分房）
    let draggedMembers: string[] = [draggedId]
    if (roomVehicle.showRoomColumn && roomVehicle.hotelColumns.length > 0) {
      // 用第一個飯店的分房來判斷同房關係
      const firstHotel = roomVehicle.hotelColumns[0]
      const hotelAssignments = roomVehicle.roomAssignmentsByHotel[firstHotel.id] || {}
      const draggedRoom = hotelAssignments[draggedId]

      if (draggedRoom) {
        // 找出所有同房的成員 ID（按目前順序）
        draggedMembers = membersData.members
          .filter(m => hotelAssignments[m.id] === draggedRoom)
          .map(m => m.id)
      }
    }

    // 計算新位置
    const targetIndex = membersData.members.findIndex(m => m.id === targetId)
    if (targetIndex === -1) return

    // 移除被拖曳的成員們
    const newMembers = membersData.members.filter(m => !draggedMembers.includes(m.id))

    // 重新計算插入位置（因為移除了成員，index 可能改變）
    let insertIndex = newMembers.findIndex(m => m.id === targetId)

    // 如果目標成員被移除了（是同房成員），找最近的位置
    if (insertIndex === -1) {
      insertIndex = Math.min(targetIndex, newMembers.length)
    }

    // 判斷是往上還是往下移動
    const oldFirstIndex = membersData.members.findIndex(m => m.id === draggedMembers[0])
    const isMovingDown = targetIndex > oldFirstIndex

    // 插入整組成員
    const draggedMemberObjects = draggedMembers
      .map(id => membersData.members.find(m => m.id === id))
      .filter(Boolean) as typeof membersData.members

    if (isMovingDown) {
      // 往下移動：插入到目標後面
      newMembers.splice(insertIndex + 1, 0, ...draggedMemberObjects)
    } else {
      // 往上移動：插入到目標前面
      newMembers.splice(insertIndex, 0, ...draggedMemberObjects)
    }

    membersData.handleReorderMembers(newMembers)

    // 如果有分房，同步更新房間的 display_order
    if (roomVehicle.showRoomColumn && Object.keys(roomVehicle.roomSortKeys).length > 0) {
      roomVehicle.reorderRoomsByMembers(newMembers.map(m => m.id))
    }
  }, [membersData, roomVehicle])

  // 從 localStorage 讀取欄位顯示設定（v2: 2026-01-05 重置預設值）
  const COLUMN_VISIBILITY_KEY = 'memberListColumnVisibility_v2'
  const getInitialColumnVisibility = (): ColumnVisibility => {
    if (typeof window === 'undefined') return defaultColumnVisibility
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 合併預設值，確保新增的欄位也有預設值
        return { ...defaultColumnVisibility, ...parsed }
      }
    } catch {
      // ignore
    }
    return defaultColumnVisibility
  }

  // UI State
  const [showIdentityColumn, setShowIdentityColumn] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('memberListShowIdentity') === 'true'
  })
  const [isAllEditMode, setIsAllEditMode] = useState(false)
  const [isSyncingFromCustomers, setIsSyncingFromCustomers] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [previewMember, setPreviewMember] = useState<OrderMember | null>(null)
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([])
  const [pnrValues, setPnrValues] = useState<Record<string, string>>({})
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(getInitialColumnVisibility)
  // PNR 配對 Dialog：支援父組件控制（避免多重遮罩問題）
  const [internalShowPnrMatchDialog, setInternalShowPnrMatchDialog] = useState(false)
  const isParentControlledPnrDialog = parentShowPnrMatchDialog !== undefined
  const showPnrMatchDialog = isParentControlledPnrDialog ? parentShowPnrMatchDialog : internalShowPnrMatchDialog
  const setShowPnrMatchDialog = isParentControlledPnrDialog
    ? (show: boolean) => onPnrMatchDialogChange?.(show)
    : setInternalShowPnrMatchDialog

  // 切換欄位可見性
  const toggleColumnVisibility = useCallback((column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }))
  }, [])

  // 追蹤是否已初始化（避免初次渲染時觸發 localStorage 保存）
  const isInitialMount = useRef(true)

  // 儲存欄位顯示設定到 localStorage（跳過初次渲染）
  useEffect(() => {
    if (isInitialMount.current) return
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // 儲存身份欄位顯示設定（跳過初次渲染）
  useEffect(() => {
    if (isInitialMount.current) return
    localStorage.setItem('memberListShowIdentity', String(showIdentityColumn))
  }, [showIdentityColumn])

  // 標記初始化完成
  useEffect(() => {
    isInitialMount.current = false
  }, [])

  // PNR 配對成功後自動顯示 PNR 欄位
  useEffect(() => {
    if (forceShowPnr) {
      setColumnVisibility(prev => {
        if (prev.pnr) return prev // 已經是 true，不更新
        return { ...prev, pnr: true }
      })
    }
  }, [forceShowPnr])

  // 當父組件控制的 PNR Dialog 關閉時，重新載入成員資料
  // （因為可能在 Dialog 中新增了成員）
  const prevShowPnrMatchDialog = useRef(showPnrMatchDialog)
  useEffect(() => {
    if (isParentControlledPnrDialog && prevShowPnrMatchDialog.current && !showPnrMatchDialog) {
      // Dialog 從開啟變成關閉，重新載入成員
      membersData.loadMembers()
    }
    prevShowPnrMatchDialog.current = showPnrMatchDialog
  }, [isParentControlledPnrDialog, showPnrMatchDialog, membersData])

  // 注意：已移除 onChildDialogChange 邏輯，改用 Dialog level 系統處理多重遮罩

  // 從 members 資料初始化 pnrValues
  React.useEffect(() => {
    const initialPnrValues: Record<string, string> = {}
    membersData.members.forEach(m => {
      if (m.pnr) {
        initialPnrValues[m.id] = m.pnr
      }
    })
    setPnrValues(initialPnrValues)
  }, [membersData.members])

  // 從顧客主檔批次同步所有成員資料
  const handleBulkSyncFromCustomers = useCallback(async () => {
    // 找出有關聯顧客的成員
    const membersWithCustomer = membersData.members.filter(m => m.customer_id)
    logger.info(`[同步] 找到 ${membersWithCustomer.length} 位有關聯顧客的成員`)

    if (membersWithCustomer.length === 0) {
      toast.info(COMP_ORDERS_LABELS.沒有成員關聯顧客)
      return
    }

    setIsSyncingFromCustomers(true)
    try {
      // 獲取所有關聯的顧客資料
      const customerIds = [...new Set(membersWithCustomer.map(m => m.customer_id).filter((id): id is string => !!id))]
      logger.info(`[同步] 查詢 ${customerIds.length} 位顧客`, customerIds)

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds)

      if (error) {
        logger.error(COMP_ORDERS_LABELS.同步_取得顧客資料失敗, error)
        toast.error(COMP_ORDERS_LABELS.取得顧客資料失敗)
        return
      }

      logger.info(`[同步] 取得 ${customers?.length || 0} 位顧客資料`)

      if (!customers || customers.length === 0) {
        toast.info(COMP_ORDERS_LABELS.找不到關聯的顧客資料)
        return
      }

      // 建立 customerId -> customer 的對照表
      const customerMap = new Map(customers.map(c => [c.id, c]))

      // 批次更新成員資料
      let updatedCount = 0
      let skippedCount = 0
      for (const member of membersWithCustomer) {
        const customer = customerMap.get(member.customer_id!)
        if (!customer) {
          logger.warn(`[同步] 成員 ${member.chinese_name} 的顧客 ${member.customer_id} 不存在`)
          skippedCount++
          continue
        }

        // 準備更新資料（只更新有值的欄位）
        const updateData: Record<string, string | null> = {}
        if (customer.passport_name) updateData.passport_name = customer.passport_name
        if (customer.passport_number) updateData.passport_number = customer.passport_number
        if (customer.passport_expiry) updateData.passport_expiry = customer.passport_expiry
        if (customer.birth_date) updateData.birth_date = customer.birth_date
        if (customer.national_id) updateData.id_number = customer.national_id
        if (customer.gender) updateData.gender = customer.gender
        if (customer.passport_image_url) updateData.passport_image_url = customer.passport_image_url

        logger.info(`[同步] 成員 ${member.chinese_name} 更新資料:`, updateData)

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('order_members')
            .update(updateData)
            .eq('id', member.id)

          if (updateError) {
            logger.error(`[同步] 更新成員 ${member.chinese_name} 失敗:`, updateError)
          } else {
            updatedCount++
          }
        } else {
          logger.info(`[同步] 成員 ${member.chinese_name} 的顧客沒有護照資料`)
          skippedCount++
        }
      }

      logger.info(`[同步] 完成: 更新 ${updatedCount} 位，跳過 ${skippedCount} 位`)

      if (updatedCount > 0) {
        toast.success(`${COMP_ORDERS_LABELS.已同步成員資料}${updatedCount}${COMP_ORDERS_LABELS.位成員資料}`)
        membersData.loadMembers() // 重新載入成員資料
      } else {
        toast.info(COMP_ORDERS_LABELS.顧客主檔沒有額外的護照資料可同步)
      }
    } catch (err) {
      logger.error(COMP_ORDERS_LABELS.同步_發生錯誤, err)
      toast.error(COMP_ORDERS_LABELS.同步失敗)
    } finally {
      setIsSyncingFromCustomers(false)
    }
  }, [membersData])

  // Handlers
  const handleUpdateField = useCallback(async (memberId: string, field: keyof OrderMember, value: string | number | null) => {
    // 對於開票期限，同步更新同 PNR 的所有成員
    if (field === 'ticketing_deadline') {
      const currentMember = membersData.members.find(m => m.id === memberId)
      if (currentMember?.pnr) {
        const samePnrMembers = membersData.members.filter(m => m.pnr === currentMember.pnr)
        const deadlineValue = typeof value === 'string' || value === null ? value : null
        // 更新本地狀態
        membersData.setMembers(membersData.members.map(m =>
          m.pnr === currentMember.pnr ? { ...m, ticketing_deadline: deadlineValue } : m
        ))
        // 更新資料庫中所有同 PNR 的成員
        try {
          const memberIds = samePnrMembers.map(m => m.id)
          await updateMembersTicketingDeadline(memberIds, deadlineValue)
        } catch (error) {
          logger.error(COMP_ORDERS_LABELS.更新欄位失敗, error)
        }
        return
      }
    }

    // 領隊自動排第一：當設為領隊時，把該成員的 sort_order 改成 0
    if (field === 'identity' && value === COMP_ORDERS_LABELS.領隊_2) {
      const currentMember = membersData.members.find(m => m.id === memberId)
      if (currentMember) {
        // 更新本地狀態：領隊排第一，其他人順序不變
        membersData.setMembers(membersData.members.map(m => 
          m.id === memberId 
            ? { ...m, identity: COMP_ORDERS_LABELS.領隊_2, sort_order: 0 } 
            : m
        ))
        // 更新資料庫
        try {
          await updateMember(memberId, { identity: COMP_ORDERS_LABELS.領隊_2, sort_order: 0 } as Parameters<typeof updateMember>[1])
          logger.info(`已將 ${currentMember.chinese_name} 設為領隊並排到第一位`)
        } catch (error) {
          logger.error(COMP_ORDERS_LABELS.設定領隊失敗, error)
        }
        return
      }
    }

    // 一般欄位更新
    membersData.setMembers(membersData.members.map(m => m.id === memberId ? { ...m, [field]: value } : m))
    try {
      await updateMember(memberId, { [field]: value })
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.更新欄位失敗, error)
    }
  }, [membersData])

  const editableFields = showIdentityColumn
    ? ['identity', 'chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']
    : ['chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']

  const handleKeyDown = useCallback((e: React.KeyboardEvent, memberIndex: number, fieldName: string) => {
    if (isComposing) return
    const currentFieldIndex = editableFields.indexOf(fieldName)
    const { members } = membersData
    let nextMemberIndex = memberIndex
    let nextFieldIndex = currentFieldIndex

    const navigate = (mDelta: number, fDelta: number) => {
      nextMemberIndex = (memberIndex + mDelta + members.length) % members.length
      nextFieldIndex = (currentFieldIndex + fDelta + editableFields.length) % editableFields.length
    }

    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); navigate(1, 0) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); navigate(-1, 0) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextFieldIndex = currentFieldIndex + 1; if (nextFieldIndex >= editableFields.length) { nextFieldIndex = 0; navigate(1, 0) } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); nextFieldIndex = currentFieldIndex - 1; if (nextFieldIndex < 0) { nextFieldIndex = editableFields.length - 1; navigate(-1, 0) } }
    else return

    const selector = `input[data-member="${members[nextMemberIndex].id}"][data-field="${editableFields[nextFieldIndex]}"]`
    document.querySelector<HTMLInputElement>(selector)?.focus()
  }, [isComposing, editableFields, membersData])

  const sortedMembers = useMemo(() => {
    // 有分房時按房間排序（同房的人排在一起）
    if (roomVehicle.showRoomColumn && Object.keys(roomVehicle.roomSortKeys).length > 0) {
      return [...membersData.members].sort((a, b) => {
        const aKey = roomVehicle.roomSortKeys[a.id] ?? 9999
        const bKey = roomVehicle.roomSortKeys[b.id] ?? 9999
        return aKey - bKey
      })
    }
    // 沒有分房時按 sort_order 排序
    return [...membersData.members].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
  }, [membersData.members, roomVehicle.showRoomColumn, roomVehicle.roomSortKeys])

  // 計算分房/分車欄位的合併行數（rowSpan）
  const rowSpans = useMemo(() => computeRowSpans({
    sortedMembers,
    roomAssignments: roomVehicle.roomAssignments,
    vehicleAssignments: roomVehicle.vehicleAssignments,
    hotelColumns: roomVehicle.hotelColumns,
    roomAssignmentsByHotel: roomVehicle.roomAssignmentsByHotel,
  }), [sortedMembers, roomVehicle.roomAssignments, roomVehicle.vehicleAssignments, roomVehicle.hotelColumns, roomVehicle.roomAssignmentsByHotel])

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? '' : 'border border-border rounded-xl bg-card'}`}>
      {/* 區塊標題行 */}
      <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2 ${embedded ? '' : 'bg-morandi-container/50 border-b border-border/60'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-morandi-primary">{COMP_ORDERS_LABELS.團員名單}</span>
          <span className="text-sm text-morandi-secondary">({sortedMembers.length} {COMP_ORDERS_LABELS.人})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* PNR 配對按鈕：在 tour 和 order 模式都顯示 */}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowPnrMatchDialog(true)}>
            <Plane size={14} className="mr-1" />{COMP_ORDERS_LABELS.PNR_配對}
          </Button>
          {/* 分配按鈕（分房、分車、分桌）：僅在 tour 模式顯示 */}
          {mode === 'tour' && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => roomVehicle.setShowRoomManager(true)}>
              <Hotel size={14} className="mr-1" />{COMP_ORDERS_LABELS.分配}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 gap-1 ${isAllEditMode ? 'bg-morandi-gold/10 text-morandi-gold' : ''}`}
            onClick={() => setIsAllEditMode(!isAllEditMode)}
            title={isAllEditMode ? COMP_ORDERS_LABELS.關閉全部編輯模式 : COMP_ORDERS_LABELS.開啟全部編輯模式}
          >
            <Pencil size={14} />
            {isAllEditMode ? COMP_ORDERS_LABELS.關閉編輯 : COMP_ORDERS_LABELS.全部編輯}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 gap-1"
            onClick={handleBulkSyncFromCustomers}
            disabled={isSyncingFromCustomers}
            title={COMP_ORDERS_LABELS.從顧客主檔同步所有成員的護照資料}
          >
            <RefreshCw size={14} className={isSyncingFromCustomers ? 'animate-spin' : ''} />
            {isSyncingFromCustomers ? COMP_ORDERS_LABELS.同步中 : COMP_ORDERS_LABELS.從顧客同步}
          </Button>
          <Button variant="ghost" size="sm" className={`h-8 px-2 ${showIdentityColumn ? 'text-morandi-gold' : ''}`} onClick={() => setShowIdentityColumn(!showIdentityColumn)}>
            {COMP_ORDERS_LABELS.身份}
          </Button>
          {mode === 'tour' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={async () => {
                const name = await prompt(COMP_ORDERS_LABELS.輸入費用欄位名稱_例如_簽證費_小費, {
                  title: COMP_ORDERS_LABELS.新增費用欄位,
                  placeholder: COMP_ORDERS_LABELS.例如_簽證費_小費,
                })
                if (name?.trim()) {
                  setCustomCostFields([...customCostFields, { id: `cost_${Date.now()}`, name: name.trim(), values: {} }])
                }
              }}
            >
              <Coins size={14} className={customCostFields.length > 0 ? 'text-morandi-gold' : ''} />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => memberExport.setIsExportDialogOpen(true)}>
            <Printer size={14} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Settings size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">{COMP_ORDERS_LABELS.顯示欄位}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={columnVisibility.passport_name}
                onCheckedChange={() => toggleColumnVisibility('passport_name')}
              >
                {columnLabels.passport_name}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.birth_date}
                onCheckedChange={() => toggleColumnVisibility('birth_date')}
              >
                {columnLabels.birth_date}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.gender}
                onCheckedChange={() => toggleColumnVisibility('gender')}
              >
                {columnLabels.gender}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.id_number}
                onCheckedChange={() => toggleColumnVisibility('id_number')}
              >
                {columnLabels.id_number}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={columnVisibility.passport_number}
                onCheckedChange={() => toggleColumnVisibility('passport_number')}
              >
                {columnLabels.passport_number}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.passport_expiry}
                onCheckedChange={() => toggleColumnVisibility('passport_expiry')}
              >
                {columnLabels.passport_expiry}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={columnVisibility.special_meal}
                onCheckedChange={() => toggleColumnVisibility('special_meal')}
              >
                {columnLabels.special_meal}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.total_payable}
                onCheckedChange={() => toggleColumnVisibility('total_payable')}
              >
                {columnLabels.total_payable}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.deposit_amount}
                onCheckedChange={() => toggleColumnVisibility('deposit_amount')}
              >
                {columnLabels.deposit_amount}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.balance}
                onCheckedChange={() => toggleColumnVisibility('balance')}
              >
                {columnLabels.balance}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.remarks}
                onCheckedChange={() => toggleColumnVisibility('remarks')}
              >
                {columnLabels.remarks}
              </DropdownMenuCheckboxItem>
              {mode === 'tour' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.pnr}
                    onCheckedChange={() => toggleColumnVisibility('pnr')}
                  >
                    {columnLabels.pnr}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.ticket_number}
                    onCheckedChange={() => toggleColumnVisibility('ticket_number')}
                  >
                    {columnLabels.ticket_number}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.ticketing_deadline}
                    onCheckedChange={() => toggleColumnVisibility('ticketing_deadline')}
                  >
                    {columnLabels.ticketing_deadline}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.flight_cost}
                    onCheckedChange={() => toggleColumnVisibility('flight_cost')}
                  >
                    {columnLabels.flight_cost}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.room && roomVehicle.showRoomColumn}
                    onCheckedChange={() => roomVehicle.showRoomColumn && toggleColumnVisibility('room')}
                    className={!roomVehicle.showRoomColumn ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {columnLabels.room} {!roomVehicle.showRoomColumn && COMP_ORDERS_LABELS.無資料}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={columnVisibility.vehicle && roomVehicle.showVehicleColumn}
                    onCheckedChange={() => roomVehicle.showVehicleColumn && toggleColumnVisibility('vehicle')}
                    className={!roomVehicle.showVehicleColumn ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {columnLabels.vehicle} {!roomVehicle.showVehicleColumn && COMP_ORDERS_LABELS.無資料}
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="h-8 px-3" onClick={membersData.handleAddMember}>
            <Plus size={14} className="mr-1" />{COMP_ORDERS_LABELS.新增}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="border-collapse text-sm member-table-inline table-fixed">
            <MemberTableHeader
              mode={mode}
              orderCount={membersData.orderCount}
              showIdentityColumn={showIdentityColumn}
              showPnrColumn={columnVisibility.pnr}
              showRoomColumn={roomVehicle.showRoomColumn && columnVisibility.room}
              showVehicleColumn={roomVehicle.showVehicleColumn && columnVisibility.vehicle}
              hotelColumns={roomVehicle.hotelColumns}
              customCostFields={customCostFields}
              columnVisibility={columnVisibility}
              isEditMode={isAllEditMode}
              columnWidths={columnWidths}
              onColumnResize={setColumnWidth}
            />
            <SortableContext
              items={sortedMembers.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {sortedMembers.map((member, index) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    index={index}
                    isEditMode={isAllEditMode}
                    showIdentityColumn={showIdentityColumn}
                    showPnrColumn={columnVisibility.pnr}
                    showRoomColumn={roomVehicle.showRoomColumn && columnVisibility.room}
                    showVehicleColumn={roomVehicle.showVehicleColumn && columnVisibility.vehicle}
                    showOrderCode={mode === 'tour' && membersData.orderCount > 1}
                    departureDate={membersData.departureDate}
                    roomAssignment={roomVehicle.roomAssignments[member.id]}
                    vehicleAssignment={roomVehicle.vehicleAssignments[member.id]}
                    roomRowSpan={rowSpans.roomSpans[member.id]}
                    vehicleRowSpan={rowSpans.vehicleSpans[member.id]}
                    hotelColumns={roomVehicle.hotelColumns}
                    roomAssignmentsByHotel={roomVehicle.roomAssignmentsByHotel}
                    roomIdByHotelMember={roomVehicle.roomIdByHotelMember}
                    roomMembersByHotelRoom={roomVehicle.roomMembersByHotelRoom}
                    roomOptionsByHotel={roomVehicle.roomOptionsByHotel}
                    roomRowSpansByHotel={rowSpans.roomSpansByHotel}
                    pnrValue={pnrValues[member.id]}
                    onRoomAssign={roomVehicle.assignMemberToRoom}
                    onRemoveMemberFromRoom={roomVehicle.removeMemberFromRoom}
                    customCostFields={customCostFields}
                    mode={mode}
                    columnVisibility={columnVisibility}
                    onUpdateField={handleUpdateField}
                    onDelete={membersData.handleDeleteMember}
                onEdit={memberEdit.openEditDialog}
                onPreview={(member) => setPreviewMember(member)}
                onPnrChange={(id, val) => setPnrValues({ ...pnrValues, [id]: val })}
                onCustomCostChange={(fId, mId, val) => setCustomCostFields(customCostFields.map(f => f.id === fId ? { ...f, values: { ...f.values, [mId]: val } } : f))}
                onKeyDown={handleKeyDown}
                onNameSearch={(memberId, value) => {
                  const memberIndex = membersData.members.findIndex(m => m.id === memberId)
                  if (memberIndex >= 0) {
                    customerMatch.checkCustomerMatchByName(value, memberIndex, membersData.members[memberIndex])
                  }
                }}
                onIdNumberSearch={(memberId, value, memberIndex) => {
                  customerMatch.checkCustomerMatchByIdNumber(value, memberIndex, membersData.members[memberIndex])
                }}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      {/* Dialogs */}
      {/* 護照照片預覽 */}
      <Dialog open={!!previewMember} onOpenChange={(open) => !open && setPreviewMember(null)}>
        <DialogContent nested level={2} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewMember?.chinese_name || previewMember?.passport_name || COMP_ORDERS_LABELS.護照照片}
            </DialogTitle>
          </DialogHeader>
          {previewMember?.passport_image_url && (
            <div className="flex justify-center">
              <img
                src={previewMember.passport_image_url}
                alt={COMP_ORDERS_LABELS.護照照片}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddMemberDialog
        isOpen={membersData.isAddDialogOpen}
        memberCount={membersData.memberCountToAdd}
        processedFiles={passportUpload.processedFiles}
        isUploading={passportUpload.isUploading}
        isDragging={passportUpload.isDragging}
        isProcessing={passportUpload.isProcessing}
        onClose={() => membersData.setIsAddDialogOpen(false)}
        onConfirm={membersData.confirmAddMembers}
        onCountChange={membersData.setMemberCountToAdd}
        onFileChange={passportUpload.handleFileChange}
        onDragOver={passportUpload.handleDragOver}
        onDragLeave={passportUpload.handleDragLeave}
        onDrop={passportUpload.handleDrop}
        onRemoveFile={passportUpload.handleRemoveFile}
        onBatchUpload={passportUpload.handleBatchUpload}
        onUpdateFilePreview={passportUpload.handleUpdateFilePreview}
      />
      <OrderSelectDialog
        isOpen={membersData.showOrderSelectDialog}
        orders={membersData.tourOrders}
        onClose={() => membersData.setShowOrderSelectDialog(false)}
        onSelect={(oid) => { membersData.setSelectedOrderIdForAdd(oid); membersData.setIsAddDialogOpen(true) }}
      />
      <CustomerMatchDialog
        isOpen={customerMatch.showCustomerMatchDialog}
        customers={customerMatch.matchedCustomers}
        matchType={customerMatch.matchType}
        onClose={customerMatch.closeCustomerMatchDialog}
        onSelect={customerMatch.handleSelectCustomer}
      />
      {/* PNR 配對 Dialog：只有在非父組件控制模式下才渲染，否則由父組件渲染（避免多重遮罩） */}
      {!isParentControlledPnrDialog && (
        <PnrMatchDialog
          isOpen={showPnrMatchDialog}
          onClose={() => setShowPnrMatchDialog(false)}
          members={membersData.members.map(m => ({
            id: m.id,
            chinese_name: m.chinese_name ?? null,
            passport_name: m.passport_name ?? null,
            pnr: m.pnr,
          }))}
          orderId={orderId || (membersData.tourOrders.length === 1 ? membersData.tourOrders[0].id : undefined)}
          workspaceId={workspaceId}
          tourId={tourId}
          onSuccess={() => {
            membersData.loadMembers()
            // PNR 配對成功後自動顯示 PNR 欄位
            setColumnVisibility(prev => ({ ...prev, pnr: true }))
            onPnrMatchSuccess?.()
          }}
        />
      )}
      <MemberEditDialog
        isOpen={memberEdit.isEditDialogOpen}
        editMode={memberEdit.editMode}
        editingMember={memberEdit.editingMember}
        editFormData={memberEdit.editFormData as EditFormData}
        isSaving={memberEdit.isSaving}
        isRecognizing={isRecognizing}
        onClose={() => memberEdit.setIsEditDialogOpen(false)}
        onFormDataChange={(data) => memberEdit.setEditFormData(data)}
        onMemberChange={memberEdit.setEditingMember}
        onSave={memberEdit.handleSaveEdit}
        onRecognize={(url) => recognizePassport(url, () => {})}
      />
      {effectiveTour && (
        <TourPrintDialog
          isOpen={memberExport.isExportDialogOpen}
          tour={effectiveTour}
          members={membersData.members}
          onClose={() => memberExport.setIsExportDialogOpen(false)}
        />
      )}
      <PassportConflictDialog
        open={passportUpload.conflictDialogOpen}
        onOpenChange={passportUpload.setConflictDialogOpen}
        conflicts={passportUpload.conflicts}
        passportData={passportUpload.conflictPassportData || {}}
      />
      <TourAssignmentManager
        tourId={tourId}
        tour={membersData.departureDate && membersData.returnDate ? {
          id: tourId,
          code: effectiveTour?.code,
          name: effectiveTour?.name,
          departure_date: membersData.departureDate,
          return_date: membersData.returnDate,
        } : undefined}
        members={membersData.members.map(m => ({
          id: m.id,
          chinese_name: m.chinese_name ?? null,
          passport_name: m.passport_name ?? null,
        }))}
        open={roomVehicle.showRoomManager}
        onOpenChange={(open) => {
          roomVehicle.setShowRoomManager(open)
          if (!open) {
            roomVehicle.loadRoomAssignments()
            roomVehicle.loadVehicleAssignments()
          }
        }}
      />
    </div>
  )
}
