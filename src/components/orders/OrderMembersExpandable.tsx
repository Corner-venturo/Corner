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

import React, { useState, useCallback, useMemo } from 'react'
import { Users, Plus, Printer, Hotel, Bus, Hash, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from './components'
import type { OrderMember, OrderMembersExpandableProps, CustomCostField } from './order-member.types'
import type { EditFormData } from './components/member-edit/hooks/useMemberEdit'

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
  mode: propMode,
}: OrderMembersExpandableProps) {
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

  // UI State
  const [showIdentityColumn, setShowIdentityColumn] = useState(false)
  const [showPnrColumn, setShowPnrColumn] = useState(false)
  const [isAllEditMode, setIsAllEditMode] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([])
  const [pnrValues, setPnrValues] = useState<Record<string, string>>({})

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-morandi-bg">
        <div className="flex items-center gap-2">
          <Users className="text-morandi-gold" size={20} />
          <h3 className="font-medium text-morandi-primary">
            {mode === 'tour' ? '團體成員名單' : '訂單成員名單'} ({sortedMembers.length}人)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'tour' && (
            <>
              <Button variant="outline" size="sm" onClick={() => roomVehicle.setShowRoomManager(true)}>
                <Hotel size={14} className="mr-1" />分房管理
              </Button>
              <Button variant="outline" size="sm" onClick={() => roomVehicle.setShowVehicleManager(true)}>
                <Bus size={14} className="mr-1" />分車管理
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPnrColumn(!showPnrColumn)}>
                <Plane size={14} className="mr-1" />PNR {showPnrColumn ? '✓' : ''}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowIdentityColumn(!showIdentityColumn)}>
            <Hash size={14} className="mr-1" />身份 {showIdentityColumn ? '✓' : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={() => memberExport.setIsExportDialogOpen(true)}>
            <Printer size={14} className="mr-1" />列印
          </Button>
          <Button variant="default" size="sm" onClick={membersData.handleAddMember}>
            <Plus size={14} className="mr-1" />新增成員
          </Button>
        </div>
      </div>

      {/* Custom Cost Fields Control */}
      {mode === 'tour' && (
        <div className="flex-shrink-0 px-4 py-2 border-b bg-morandi-container/10">
          <CustomCostFieldsSection
            fields={customCostFields}
            onAddField={(name) => setCustomCostFields([...customCostFields, { id: `cost_${Date.now()}`, name, values: {} }])}
            onRemoveField={(id) => setCustomCostFields(customCostFields.filter(f => f.id !== id))}
          />
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <MemberTableHeader
            mode={mode}
            orderCount={membersData.orderCount}
            showIdentityColumn={showIdentityColumn}
            showPnrColumn={showPnrColumn}
            showRoomColumn={roomVehicle.showRoomColumn}
            customCostFields={customCostFields}
          />
          <tbody>
            {sortedMembers.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                index={index}
                isEditMode={isAllEditMode}
                showIdentityColumn={showIdentityColumn}
                showPnrColumn={showPnrColumn}
                showOrderCode={mode === 'tour' && membersData.orderCount > 1}
                departureDate={membersData.departureDate}
                roomAssignment={roomVehicle.roomAssignments[member.id]}
                vehicleAssignment={roomVehicle.vehicleAssignments[member.id]}
                pnrValue={pnrValues[member.id]}
                customCostFields={customCostFields}
                mode={mode}
                onUpdateField={handleUpdateField}
                onDelete={membersData.handleDeleteMember}
                onEdit={memberEdit.openEditDialog}
                onPreview={() => {}}
                onPnrChange={(id, val) => setPnrValues({ ...pnrValues, [id]: val })}
                onCustomCostChange={(fId, mId, val) => setCustomCostFields(customCostFields.map(f => f.id === fId ? { ...f, values: { ...f.values, [mId]: val } } : f))}
                onKeyDown={handleKeyDown}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
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
      <ExportDialog
        isOpen={memberExport.isExportDialogOpen}
        columns={memberExport.exportColumns as unknown as import('./order-member.types').ExportColumnsConfig}
        members={membersData.members}
        departureDate={membersData.departureDate}
        onClose={() => memberExport.setIsExportDialogOpen(false)}
        onColumnsChange={(cols) => memberExport.setExportColumns(cols as unknown as typeof memberExport.exportColumns)}
      />
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
