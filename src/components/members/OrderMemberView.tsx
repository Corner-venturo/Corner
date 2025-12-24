'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { DataSheetColumn } from '@/components/shared/react-datasheet-wrapper'
import { MemberTable } from '@/components/members/MemberTable'
import { Button } from '@/components/ui/button'
import { ImageIcon, AlertTriangle, Edit3, Save, Upload } from 'lucide-react'
import { CustomerVerifyDialog } from '@/app/(main)/customers/components/CustomerVerifyDialog'
import { useCustomerStore } from '@/stores'
import { confirm } from '@/lib/ui/alert-dialog'
import { useMemberView } from './hooks/useMemberView'
import { usePassportUpload } from './hooks/usePassportUpload'
import { MemberInfoCard } from './components/MemberInfoCard'
import { MemberDocuments } from './components/MemberDocuments'
import { MemberPayments } from './components/MemberPayments'

interface MemberTableProps {
  order_id: string
  departure_date: string
  member_count: number
}

export interface MemberTableRef {
  addRow: () => void
}

export const OrderMemberView = forwardRef<MemberTableRef, MemberTableProps>(
  ({ order_id, departure_date, member_count }, ref) => {
    const {
      tableMembers,
      customers,
      workspace_id,
      showMatchDialog,
      setShowMatchDialog,
      matchedCustomers,
      matchType,
      pendingMemberIndex,
      setPendingMemberIndex,
      pendingMemberData,
      setPendingMemberData,
      showPassportPreview,
      setShowPassportPreview,
      previewMember,
      showVerifyDialog,
      setShowVerifyDialog,
      verifyCustomer,
      isEditMode,
      setIsEditMode,
      isUploadDialogOpen,
      setIsUploadDialogOpen,
      processedFiles,
      setProcessedFiles,
      isUploading,
      setIsUploading,
      isDragging,
      setIsDragging,
      isProcessing,
      setIsProcessing,
      handleDataUpdate,
      handleEditModeChange,
      handleSelectCustomer,
      handleNameClick,
      addRow,
      autoSaveMember,
      refetchMembers,
      uploadPassportImage,
      createMember,
      updateMember,
      hasExistingData,
      orderMembers,
    } = useMemberView({ order_id, departure_date, member_count })

    const { handlePassportFileChange, handleRemovePassportFile, handleBatchUpload } =
      usePassportUpload({
        order_id,
        workspace_id,
        orderMembers,
        processedFiles,
        setProcessedFiles,
        setIsUploading,
        setIsProcessing,
        setIsUploadDialogOpen,
        refetchMembers,
        createMember,
        updateMember,
        uploadPassportImage,
      })

    // 配置 DataSheet 欄位
    const dataSheetColumns: DataSheetColumn[] = [
      { key: 'index', label: '序號', width: 40, readOnly: true },
      {
        key: 'name',
        label: '姓名',
        width: 100,
        onCellClick: handleNameClick,
        valueRenderer: (cell) => {
          const rowData = cell.rowData as Record<string, unknown> | undefined
          const hasPassport = rowData?.passport_image_url
          const customerId = rowData?.customer_id as string | undefined
          const name = cell.value as string

          const customer = customerId ? customers.find((c) => c.id === customerId) : null
          const needsVerification =
            customer?.passport_image_url && customer?.verification_status !== 'verified'

          if (hasPassport || customer?.passport_image_url) {
            return (
              <span className="flex items-center gap-1 cursor-pointer text-primary hover:underline">
                {needsVerification && (
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                )}
                <ImageIcon size={12} className="text-primary flex-shrink-0" />
                <span className="truncate">{name}</span>
              </span>
            )
          }
          return name || ''
        },
      },
      { key: 'nameEn', label: '英文姓名', width: 100 },
      { key: 'birthday', label: '生日', width: 100 },
      { key: 'age', label: '年齡', width: 60, readOnly: true },
      { key: 'gender', label: '性別', width: 50, readOnly: true },
      { key: 'idNumber', label: '身分證字號', width: 120 },
      { key: 'passportNumber', label: '護照號碼', width: 100 },
      { key: 'passportExpiry', label: '護照效期', width: 100 },
      { key: 'reservationCode', label: '訂位代號', width: 100 },
    ]

    // 暴露addRow函數給父組件
    useImperativeHandle(ref, () => ({
      addRow,
    }))

    return (
      <div className="w-full">
        {/* 編輯模式切換按鈕 */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="text-sm text-muted-foreground">
            共 {tableMembers.length} 位成員
            {hasExistingData && !isEditMode && (
              <span className="ml-2 text-amber-600">
                （已有 {tableMembers.filter((m) => m.name?.trim()).length} 位有資料）
              </span>
            )}
          </div>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={async () => {
              if (!isEditMode && hasExistingData) {
                const confirmed = await confirm(
                  '目前已有成員資料，進入編輯模式後可直接修改所有欄位。確定要進入編輯模式嗎？'
                )
                if (confirmed) {
                  setIsEditMode(true)
                }
              } else {
                setIsEditMode(!isEditMode)
              }
            }}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Save size={16} />
                完成編輯
              </>
            ) : (
              <>
                <Edit3 size={16} />
                全部編輯模式
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
            className="gap-2 ml-2"
          >
            <Upload size={16} />
            批次上傳護照
          </Button>
        </div>

        <MemberTable
          data={tableMembers.map((member, index: number) => {
            const age = 'age' in member ? (member as typeof member & { age: number }).age : 0
            return {
              ...member,
              index: index + 1,
              age: age > 0 ? `${age}歲` : '',
              gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
              passport_image_url: member.passport_image_url || '',
              customer_id: member.customer_id || '',
            }
          })}
          columns={dataSheetColumns}
          isEditMode={isEditMode}
          handleEditModeChange={
            handleEditModeChange as (index: number, field: string, value: string) => void
          }
          handleDataUpdate={handleDataUpdate as (data: unknown[]) => void}
        />

        <div className="text-xs text-morandi-secondary px-6 py-2 space-y-1">
          {isEditMode ? (
            <>
              <p>• 編輯模式：所有欄位都可以直接輸入</p>
              <p>• 輸入姓名 2 字以上會自動搜尋相似顧客</p>
              <p>• 輸入身分證 5 字以上會自動搜尋相同顧客</p>
              <p>• 性別會根據身分證字號自動計算</p>
            </>
          ) : (
            <>
              <p>• 雙擊單元格即可編輯，自動儲存</p>
              <p>• 年齡和性別為自動計算欄位</p>
              <p>• 支援 Excel 式鍵盤導航和複製貼上</p>
              <p>• 身分證號碼會自動計算年齡和性別</p>
              <p>• 輸入姓名時會自動搜尋顧客資料庫，同名時可選擇</p>
              <p>
                • <ImageIcon size={12} className="inline text-primary" />{' '}
                有護照照片的成員，點擊可預覽或驗證
              </p>
              <p>
                • <AlertTriangle size={12} className="inline text-amber-500" />{' '}
                金色驚嘆號表示護照資料待驗證，點擊可進行驗證
              </p>
            </>
          )}
        </div>

        {/* 護照圖片預覽對話框 */}
        <MemberInfoCard
          open={showPassportPreview}
          member={previewMember}
          onClose={() => setShowPassportPreview(false)}
        />

        {/* 顧客選擇對話框 - 橫向表格式 */}
        {showMatchDialog && matchedCustomers.length > 0 && (
          <MemberPayments
            open={showMatchDialog}
            onOpenChange={setShowMatchDialog}
            customers={matchedCustomers}
            matchType={matchType}
            pendingMemberData={pendingMemberData}
            onSelectCustomer={handleSelectCustomer}
            onCancel={() => {
              if (pendingMemberIndex !== null && pendingMemberData) {
                autoSaveMember(pendingMemberData, pendingMemberIndex)
              }
              setShowMatchDialog(false)
              setPendingMemberIndex(null)
              setPendingMemberData(null)
            }}
          />
        )}

        {/* 護照驗證對話框 - 複用顧客管理的驗證組件 */}
        <CustomerVerifyDialog
          open={showVerifyDialog}
          onOpenChange={setShowVerifyDialog}
          customer={verifyCustomer}
          onUpdate={async (id, data) => {
            const customerStore = useCustomerStore.getState()
            await customerStore.update(id, data)
            refetchMembers()
          }}
        />

        {/* 批次上傳護照 Dialog */}
        <MemberDocuments
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          processedFiles={processedFiles}
          isUploading={isUploading}
          isProcessing={isProcessing}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onFileChange={handlePassportFileChange}
          onRemoveFile={handleRemovePassportFile}
          onBatchUpload={handleBatchUpload}
        />
      </div>
    )
  }
)

OrderMemberView.displayName = 'OrderMemberView'
