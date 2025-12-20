/**
 * MemberEditDialog - 成員編輯/驗證對話框
 * 從 OrderMembersExpandable.tsx 拆分出來
 *
 * 功能：
 * - 編輯成員資料
 * - 驗證護照資料（OCR 後確認）
 * - 護照圖片編輯（縮放、旋轉、翻轉、裁剪）
 * - 護照重新辨識
 */

'use client'

import React from 'react'
import {
  AlertTriangle,
  Crop,
  FlipHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useImageEditor } from '@/hooks/useImageEditor'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { OrderMember } from '../order-member.types'

type EditMode = 'edit' | 'verify'

interface EditFormData {
  chinese_name?: string
  passport_name?: string
  birth_date?: string
  gender?: string
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  special_meal?: string
  remarks?: string
}

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

// 圖片壓縮函數
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
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
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('無法取得 canvas context'))
          return
        }
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
  const imageEditor = useImageEditor()

  // 關閉時重置圖片編輯器
  const handleClose = () => {
    imageEditor.reset()
    onClose()
  }

  // 儲存旋轉/翻轉後的圖片
  const handleSaveTransform = async () => {
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

      onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })
      imageEditor.reset()

      const { toast } = await import('sonner')
      toast.success('圖片已儲存')
    } catch (error) {
      logger.error('儲存圖片失敗:', error)
      const { toast } = await import('sonner')
      toast.error('儲存圖片失敗')
    } finally {
      imageEditor.setIsSaving(false)
    }
  }

  // 確認裁剪
  const handleConfirmCrop = async () => {
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

        onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })
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
  }

  // 上傳新護照照片
  const handleUploadPassport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingMember) return

    try {
      const compressedFile = await compressImage(file)
      const fileName = `passport_${editingMember.id}_${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, compressedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      await supabase
        .from('order_members')
        .update({ passport_image_url: urlData.publicUrl })
        .eq('id', editingMember.id)

      onMemberChange({ ...editingMember, passport_image_url: urlData.publicUrl })

      const { toast } = await import('sonner')
      toast.success('護照照片上傳成功')
    } catch (error) {
      logger.error('護照上傳失敗:', error)
      const { toast } = await import('sonner')
      toast.error('上傳失敗，請重試')
    }

    e.target.value = ''
  }

  // 再次辨識護照
  const handleRecognize = async () => {
    if (!editingMember?.passport_image_url) return
    await onRecognize(editingMember.passport_image_url)
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
                    className={`p-2 hover:bg-white rounded-md flex items-center gap-1 text-xs ${
                      imageEditor.flipH ? 'bg-blue-100' : ''
                    }`}
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
                      onClick={handleSaveTransform}
                      disabled={imageEditor.isSaving}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{imageEditor.isSaving ? '儲存中...' : '儲存圖片'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRecognize}
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
                    onClick={handleConfirmCrop}
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
                  onChange={handleUploadPassport}
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
                onChange={e => onFormDataChange({ ...editFormData, chinese_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 護照拼音 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">護照拼音</label>
              <input
                type="text"
                value={editFormData.passport_name || ''}
                onChange={e => onFormDataChange({ ...editFormData, passport_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 出生年月日 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">出生年月日</label>
              <input
                type="text"
                value={editFormData.birth_date || ''}
                onChange={e => onFormDataChange({ ...editFormData, birth_date: e.target.value })}
                placeholder="YYYY-MM-DD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 性別 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">性別</label>
              <select
                value={editFormData.gender || ''}
                onChange={e => onFormDataChange({ ...editFormData, gender: e.target.value })}
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
                onChange={e => onFormDataChange({ ...editFormData, id_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 護照號碼 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">護照號碼</label>
              <input
                type="text"
                value={editFormData.passport_number || ''}
                onChange={e => onFormDataChange({ ...editFormData, passport_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 護照效期 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">護照效期</label>
              <input
                type="text"
                value={editFormData.passport_expiry || ''}
                onChange={e => onFormDataChange({ ...editFormData, passport_expiry: e.target.value })}
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
                onChange={e => onFormDataChange({ ...editFormData, special_meal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              />
            </div>

            {/* 備註 */}
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">備註</label>
              <textarea
                value={editFormData.remarks || ''}
                onChange={e => onFormDataChange({ ...editFormData, remarks: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold resize-none"
              />
            </div>
          </div>
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
