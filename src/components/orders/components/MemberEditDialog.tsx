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

import React from 'react'
import { AlertTriangle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMemberEdit } from './member-edit/hooks/useMemberEdit'
import { MemberInfoForm } from './member-edit/MemberInfoForm'
import { PassportSection } from './member-edit/PassportSection'
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

  // 關閉時重置圖片編輯器
  const handleClose = () => {
    imageEditor.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 pb-2 border-t bg-white">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            取消
          </Button>
          <Button
            onClick={onSave}
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
  )
}

export type { EditFormData }
