/**
 * CreateDisbursementDialog
 * 新增出納單對話框
 *
 * 參考 cornerERP 設計：
 * - 上方：出帳日期、出納單號、狀態篩選
 * - 中間：請款編號列表，可搜尋、可勾選
 * - 下方：建立出納單按鈕
 */

'use client'

import { useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { PaymentRequest } from '@/stores/types'
import { useCreateDisbursement } from '../hooks/useCreateDisbursement'
import { DisbursementForm } from './create-dialog/DisbursementForm'
import { DisbursementItemList } from './create-dialog/DisbursementItemList'

interface CreateDisbursementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingRequests: PaymentRequest[]
  onSuccess: () => void
}

export function CreateDisbursementDialog({
  open,
  onOpenChange,
  pendingRequests,
  onSuccess,
}: CreateDisbursementDialogProps) {
  // 使用自定義 Hook 管理狀態和邏輯
  const {
    disbursementDate,
    selectedRequestIds,
    searchTerm,
    dateFilter,
    statusFilter,
    isSubmitting,
    filteredRequests,
    selectedAmount,
    setDisbursementDate,
    setSearchTerm,
    setDateFilter,
    setStatusFilter,
    toggleSelect,
    toggleSelectAll,
    setToday,
    clearFilters,
    handleCreate,
    resetForm,
  } = useCreateDisbursement({ pendingRequests, onSuccess })

  // 關閉時重置
  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }, [onOpenChange, resetForm])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">新增出納單</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* 表單區塊 */}
          <DisbursementForm
            disbursementDate={disbursementDate}
            statusFilter={statusFilter}
            onDateChange={setDisbursementDate}
            onStatusChange={setStatusFilter}
          />

          {/* 項目列表區塊 */}
          <DisbursementItemList
            filteredRequests={filteredRequests}
            selectedRequestIds={selectedRequestIds}
            selectedAmount={selectedAmount}
            searchTerm={searchTerm}
            dateFilter={dateFilter}
            onSearchChange={setSearchTerm}
            onDateFilterChange={setDateFilter}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onSetToday={setToday}
            onClearFilters={clearFilters}
          />
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => handleClose(false)} className="gap-1">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedRequestIds.length === 0 || isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {isSubmitting ? '建立中...' : `建立出納單（${selectedRequestIds.length} 筆）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
