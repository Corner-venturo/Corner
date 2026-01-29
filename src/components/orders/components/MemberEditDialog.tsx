/**
 * MemberEditDialog - 成員編輯/驗證對話框
 * 拆分後的主組件（< 300 行）
 *
 * 功能：
 * - 編輯成員資料
 * - 驗證護照資料（OCR 後確認）
 * - 護照圖片編輯（縮放、旋轉、翻轉、裁剪）
 * - 護照重新辨識
 *
 * 模組結構：
 * - MemberInfoForm: 基本資訊表單
 * - PassportSection: 護照圖片編輯區塊
 * - useMemberEdit: 狀態管理 Hook
 */

'use client'

import React, { useState, useCallback } from 'react'
import { AlertTriangle, Pencil, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMemberEdit } from './member-edit/hooks/useMemberEdit'
import { MemberInfoForm } from './member-edit/MemberInfoForm'
import { PassportSection } from './member-edit/PassportSection'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { OrderMember } from '../order-member.types'
import type { EditFormData } from './member-edit/hooks/useMemberEdit'

type EditMode = 'edit' | 'verify'

interface MemberEditDialogProps {
  isOpen: boolean
  editMode: EditMode
  editingMember: OrderMember | null
  editFormData: EditFormData
  isSaving: boolean
  isRecognizing: boolean
  onClose: () => void
  onFormDataChange: (data: EditFormData) => void
  onMemberChange: (member: OrderMember) => void
  onSave: () => void
  onRecognize: (imageUrl: string) => Promise<void>
}

export function MemberEditDialog({
  isOpen,
  editMode,
  editingMember,
  editFormData,
  isSaving,
  isRecognizing,
  onClose,
  onFormDataChange,
  onMemberChange,
  onSave,
  onRecognize,
}: MemberEditDialogProps) {
  const {
    imageEditor,
    handleSaveTransform,
    handleConfirmCrop,
    handleUploadPassport,
    handleRecognize,
  } = useMemberEdit(editingMember, onMemberChange, onRecognize)

  const [isSyncing, setIsSyncing] = useState(false)

  // 從顧客主檔同步資料
  const handleSyncFromCustomer = useCallback(async () => {
    if (!editingMember?.customer_id) {
      toast.error('此成員尚未關聯顧客')
      return
    }

    setIsSyncing(true)
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', editingMember.customer_id)
        .single()

      if (error || !customer) {
        toast.error('找不到關聯的顧客資料')
        return
      }

      // 更新表單資料
      onFormDataChange({
        ...editFormData,
        passport_name: customer.passport_name || editFormData.passport_name,
        passport_number: customer.passport_number || editFormData.passport_number,
        passport_expiry: customer.passport_expiry || editFormData.passport_expiry,
        birth_date: customer.birth_date || editFormData.birth_date,
        id_number: customer.national_id || editFormData.id_number,
        gender: customer.gender || editFormData.gender,
      })

      // 如果顧客有護照照片，也更新成員的護照照片
      if (customer.passport_image_url && customer.passport_image_url !== editingMember.passport_image_url) {
        onMemberChange({
          ...editingMember,
          passport_image_url: customer.passport_image_url,
        })
      }

      toast.success('已從顧客主檔同步資料')
    } catch {
      toast.error('同步失敗')
    } finally {
      setIsSyncing(false)
    }
  }, [editingMember, editFormData, onFormDataChange, onMemberChange])

  // 關閉時重置圖片編輯器
  const handleClose = () => {
    imageEditor.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent nested level={2} className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {editMode === 'verify' ? (
              <>
                <AlertTriangle className="text-status-warning" size={20} />
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
          <PassportSection
            editingMember={editingMember}
            editMode={editMode}
            isRecognizing={isRecognizing}
            imageEditor={imageEditor}
            onSaveTransform={handleSaveTransform}
            onConfirmCrop={handleConfirmCrop}
            onUploadPassport={handleUploadPassport}
            onRecognize={handleRecognize}
          />

          {/* 右邊：表單 */}
          <MemberInfoForm
            formData={editFormData}
            onChange={onFormDataChange}
          />
        </div>

        {/* 按鈕區域 - 固定在底部 */}
        <div className="flex-shrink-0 flex justify-between pt-4 pb-2 border-t bg-card">
          {/* 左邊：從顧客同步按鈕 */}
          <div>
            {editingMember?.customer_id && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-morandi-blue border-morandi-blue/30 hover:bg-morandi-blue/10"
                onClick={handleSyncFromCustomer}
                disabled={isSyncing || isSaving}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                從顧客同步
              </Button>
            )}
          </div>

          {/* 右邊：取消和儲存按鈕 */}
          <div className="flex gap-3">
            <Button variant="outline" className="gap-1" onClick={handleClose} disabled={isSaving}>
              <X size={16} />
              取消
            </Button>
            <Button
            onClick={onSave}
            disabled={isSaving}
            size="lg"
            className={editMode === 'verify'
              ? 'bg-status-success hover:bg-morandi-green text-white px-8 font-medium'
              : 'bg-morandi-gold hover:bg-morandi-gold-hover text-white px-8 font-medium'
            }
          >
            {isSaving ? '儲存中...' : editMode === 'verify' ? '確認驗證' : '儲存變更'}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type { EditFormData }
