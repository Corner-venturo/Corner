/**
 * OrderMembersExpandable - 訂單成員管理主組件（完全重構版）
 *
 * 已整合：
 * - 6個 Hooks: useOrderMembersData, useRoomVehicleAssignments, useCustomerMatch, useMemberExport, useMemberEditDialog, usePassportUpload
 * - 9個組件: MemberRow, AddMemberDialog, MemberEditDialog, ExportDialog, PassportUploadZone, OrderSelectDialog, CustomerMatchDialog, CustomCostFieldsSection, MemberTableHeader
 *
 * 行數：< 300 行
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Plus, Printer, Hotel, Bus, Coins, Settings, Pencil, Plane } from 'lucide-react'
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
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { useOcrRecognition } from '@/hooks'
import { useCustomerStore } from '@/stores'
import { TourRoomManager } from '@/components/tours/tour-room-manager'
import { TourVehicleManager } from '@/components/tours/tour-vehicle-manager'
import {
  useOrderMembersData,
  useRoomVehicleAssignments,
  useCustomerMatch,
  useMemberExport,
  useMemberEditDialog,
  usePassportUpload,
} from './hooks'
import {
  MemberRow,
  AddMemberDialog,
  MemberEditDialog,
  ExportDialog,
  OrderSelectDialog,
  CustomerMatchDialog,
  CustomCostFieldsSection,
  MemberTableHeader,
  PnrMatchDialog,
} from './components'
import { TourPrintDialog } from '@/components/tours/TourPrintDialog'
import type { OrderMember, OrderMembersExpandableProps, CustomCostField } from './order-member.types'
import type { EditFormData } from './components/member-edit/hooks/useMemberEdit'

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
  ticket_number: false,
  ticketing_deadline: false,
}

// 欄位標籤對照
const columnLabels: Record<keyof ColumnVisibility, string> = {
  passport_name: '護照拼音',
  birth_date: '出生年月日',
  gender: '性別',
  id_number: '身分證號',
  passport_number: '護照號碼',
  passport_expiry: '護照效期',
  special_meal: '飲食禁忌',
  total_payable: '應付金額',
  deposit_amount: '訂金',
  balance: '尾款',
  remarks: '備註',
  pnr: 'PNR',
  ticket_number: '機票號碼',
  ticketing_deadline: '開票期限',
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
}: OrderMembersExpandableProps & { onChildDialogChange?: (hasOpen: boolean) => void }) {
  const mode = propMode || (orderId ? 'order' : 'tour')

  // Hooks
  const { items: customers } = useCustomerStore()
  const membersData = useOrderMembersData({ orderId, tourId, workspaceId, mode })
  const roomVehicle = useRoomVehicleAssignments({ tourId })
  const customerMatch = useCustomerMatch(customers, membersData.members, membersData.setMembers)
  const memberExport = useMemberExport(membersData.members)
  const memberEdit = useMemberEditDialog({ members: membersData.members, setMembers: membersData.setMembers })
  const passportUpload = usePassportUpload({ orderId, workspaceId, onSuccess: membersData.loadMembers })
  const { isRecognizing, recognizePassport } = useOcrRecognition()

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
  const [isComposing, setIsComposing] = useState(false)
  const [previewMember, setPreviewMember] = useState<OrderMember | null>(null)
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([])
  const [pnrValues, setPnrValues] = useState<Record<string, string>>({})
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(getInitialColumnVisibility)
  const [showPnrMatchDialog, setShowPnrMatchDialog] = useState(false)

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

  // 通知父組件有子 Dialog 開啟（避免多重遮罩）
  const hasChildDialogOpen = showPnrMatchDialog || roomVehicle.showRoomManager || roomVehicle.showVehicleManager ||
    memberEdit.isEditDialogOpen || memberExport.isExportDialogOpen || membersData.isAddDialogOpen ||
    membersData.showOrderSelectDialog || customerMatch.showCustomerMatchDialog || !!previewMember

  useEffect(() => {
    onChildDialogChange?.(hasChildDialogOpen)
  }, [hasChildDialogOpen, onChildDialogChange])

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

  // Handlers
  const handleUpdateField = useCallback(async (memberId: string, field: keyof OrderMember, value: string | number | null) => {
    membersData.setMembers(membersData.members.map(m => m.id === memberId ? { ...m, [field]: value } : m))
    try {
      await supabase.from('order_members').update({ [field]: value }).eq('id', memberId)
    } catch (error) {
      logger.error('更新欄位失敗:', error)
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
    if (roomVehicle.showRoomColumn && Object.keys(roomVehicle.roomSortKeys).length > 0) {
      return [...membersData.members].sort((a, b) => {
        const aKey = roomVehicle.roomSortKeys[a.id] ?? 9999
        const bKey = roomVehicle.roomSortKeys[b.id] ?? 9999
        return aKey - bKey
      })
    }
    return membersData.members
  }, [membersData.members, roomVehicle.showRoomColumn, roomVehicle.roomSortKeys])

  return (
    <div className={`flex flex-col h-full overflow-hidden ${embedded ? '' : 'border border-border rounded-xl bg-card'}`}>
      {/* 區塊標題行 */}
      <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2 ${embedded ? '' : 'bg-morandi-container/50 border-b border-border/60'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-morandi-primary">團員名單</span>
          <span className="text-sm text-morandi-secondary">({sortedMembers.length} 人)</span>
        </div>
        <div className="flex items-center gap-1">
          {mode === 'tour' && (
            <>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowPnrMatchDialog(true)}>
                <Plane size={14} className="mr-1" />PNR 配對
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => roomVehicle.setShowRoomManager(true)}>
                <Hotel size={14} className="mr-1" />分房
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => roomVehicle.setShowVehicleManager(true)}>
                <Bus size={14} className="mr-1" />分車
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 gap-1 ${isAllEditMode ? 'bg-morandi-gold/10 text-morandi-gold' : ''}`}
            onClick={() => setIsAllEditMode(!isAllEditMode)}
            title={isAllEditMode ? '關閉全部編輯模式' : '開啟全部編輯模式'}
          >
            <Pencil size={14} />
            {isAllEditMode ? '關閉編輯' : '全部編輯'}
          </Button>
          <Button variant="ghost" size="sm" className={`h-8 px-2 ${showIdentityColumn ? 'text-morandi-gold' : ''}`} onClick={() => setShowIdentityColumn(!showIdentityColumn)}>
            身份
          </Button>
          {mode === 'tour' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                const name = prompt('輸入費用欄位名稱（例如：簽證費、小費）')
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
              <DropdownMenuLabel className="text-xs">顯示欄位</DropdownMenuLabel>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="h-8 px-3" onClick={membersData.handleAddMember}>
            <Plus size={14} className="mr-1" />新增
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <MemberTableHeader
            mode={mode}
            orderCount={membersData.orderCount}
            showIdentityColumn={showIdentityColumn}
            showPnrColumn={columnVisibility.pnr}
            showRoomColumn={roomVehicle.showRoomColumn}
            showVehicleColumn={roomVehicle.showVehicleColumn}
            customCostFields={customCostFields}
            columnVisibility={columnVisibility}
          />
          <tbody>
            {sortedMembers.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                index={index}
                isEditMode={isAllEditMode}
                showIdentityColumn={showIdentityColumn}
                showPnrColumn={columnVisibility.pnr}
                showRoomColumn={roomVehicle.showRoomColumn}
                showVehicleColumn={roomVehicle.showVehicleColumn}
                showOrderCode={mode === 'tour' && membersData.orderCount > 1}
                departureDate={membersData.departureDate}
                roomAssignment={roomVehicle.roomAssignments[member.id]}
                vehicleAssignment={roomVehicle.vehicleAssignments[member.id]}
                pnrValue={pnrValues[member.id]}
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
        </table>
      </div>

      {/* Dialogs */}
      {/* 護照照片預覽 */}
      <Dialog open={!!previewMember} onOpenChange={(open) => !open && setPreviewMember(null)}>
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
        onSuccess={() => {
          membersData.loadMembers()
          // PNR 配對成功後自動顯示 PNR 欄位
          setColumnVisibility(prev => ({ ...prev, pnr: true }))
        }}
      />
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
      {tour ? (
        <TourPrintDialog
          isOpen={memberExport.isExportDialogOpen}
          tour={tour}
          members={membersData.members}
          onClose={() => memberExport.setIsExportDialogOpen(false)}
        />
      ) : (
        <ExportDialog
          isOpen={memberExport.isExportDialogOpen}
          columns={memberExport.exportColumns as unknown as import('./order-member.types').ExportColumnsConfig}
          members={membersData.members}
          departureDate={membersData.departureDate}
          onClose={() => memberExport.setIsExportDialogOpen(false)}
          onColumnsChange={(cols) => memberExport.setExportColumns(cols as unknown as typeof memberExport.exportColumns)}
        />
      )}
      <TourRoomManager
        tourId={tourId}
        tour={membersData.departureDate && membersData.returnDate ? {
          id: tourId,
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
          if (!open) roomVehicle.loadRoomAssignments()
        }}
      />
      <TourVehicleManager
        tourId={tourId}
        members={membersData.members.map(m => ({
          id: m.id,
          chinese_name: m.chinese_name ?? null,
          passport_name: m.passport_name ?? null,
        }))}
        open={roomVehicle.showVehicleManager}
        onOpenChange={(open) => {
          roomVehicle.setShowVehicleManager(open)
          if (!open) roomVehicle.loadVehicleAssignments()
        }}
      />
    </div>
  )
}
