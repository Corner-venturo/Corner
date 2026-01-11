/**
 * 顧客資料驗證對話框
 * 功能：護照圖片檢視、編輯、OCR 辨識、資料比對
 */
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Check,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Crop,
  RefreshCw,
  Save,
  FlipHorizontal,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { Customer, UpdateCustomerData } from '@/types/customer.types'
import { useImageEditor, useOcrRecognition } from '@/hooks'

interface CustomerVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onUpdate: (id: string, data: Partial<UpdateCustomerData>) => Promise<void>
}

export function CustomerVerifyDialog({
  open,
  onOpenChange,
  customer,
  onUpdate,
}: CustomerVerifyDialogProps) {
  // 表單資料
  const [formData, setFormData] = useState<Partial<UpdateCustomerData>>({})
  const [isSaving, setIsSaving] = useState(false)

  // 圖片編輯 Hook
  const imageEditor = useImageEditor()
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // OCR Hook
  const { isRecognizing, recognizePassport } = useOcrRecognition()

  // 重置狀態
  const handleClose = useCallback(() => {
    setFormData({})
    imageEditor.reset()
    onOpenChange(false)
  }, [imageEditor, onOpenChange])

  // 初始化表單（當 customer 改變時）
  const initFormData = useCallback(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        passport_romanization: customer.passport_romanization || '',
        passport_number: customer.passport_number || '',
        passport_expiry_date: customer.passport_expiry_date || '',
        date_of_birth: customer.date_of_birth || '',
        national_id: customer.national_id || '',
      })
    }
  }, [customer])

  // 當對話框打開或 customer 改變時，初始化表單
  useEffect(() => {
    if (open && customer) {
      initFormData()
    }
  }, [open, customer, initFormData])

  // 儲存驗證結果
  const handleSave = async () => {
    if (!customer) return
    setIsSaving(true)
    try {
      await onUpdate(customer.id, {
        ...formData,
        verification_status: 'verified',
      })
      toast.success('顧客資料已驗證')
      handleClose()
    } catch (error) {
      toast.error('驗證失敗')
    } finally {
      setIsSaving(false)
    }
  }

  // OCR 再次辨識
  const handleReOcr = async () => {
    if (!customer?.passport_image_url) return
    try {
      await recognizePassport(customer.passport_image_url, (result) => {
        setFormData(prev => ({
          ...prev,
          ...result,
        }))
      })
    } catch (error) {
      toast.error('OCR 辨識失敗，請稍後再試')
    }
  }

  // 儲存圖片變更
  const handleSaveImageTransform = async () => {
    if (!customer?.passport_image_url) return
    imageEditor.setIsSaving(true)
    try {
      // 創建 canvas 並應用變換
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = customer.passport_image_url!
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context error')

      // 根據旋轉角度設定 canvas 大小
      const isRotated90 = imageEditor.rotation === 90 || imageEditor.rotation === 270
      canvas.width = isRotated90 ? img.height : img.width
      canvas.height = isRotated90 ? img.width : img.height

      // 應用變換
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((imageEditor.rotation * Math.PI) / 180)
      if (imageEditor.flipH) ctx.scale(-1, 1)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      // 上傳到 Supabase
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
      })

      const fileName = `passport_${customer.id}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, blob, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      await onUpdate(customer.id, {
        passport_image_url: urlData.publicUrl,
      })

      imageEditor.reset()
      toast.success('圖片已儲存')
    } catch (error) {
      toast.error('儲存圖片失敗')
    } finally {
      imageEditor.setIsSaving(false)
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {customer.verification_status === 'verified' ? (
              <>
                <Check className="text-status-success" size={20} />
                顧客資料（已驗證）
              </>
            ) : (
              <>
                <AlertTriangle className="text-status-warning" size={20} />
                驗證顧客資料
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
          {/* 左邊：護照照片 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
              {customer.passport_image_url && !imageEditor.isCropMode && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => imageEditor.zoomOut()}
                    className="p-1.5 hover:bg-muted rounded-md"
                    title="縮小"
                  >
                    <ZoomOut size={16} className="text-morandi-secondary" />
                  </button>
                  <span className="text-xs text-morandi-secondary min-w-[3rem] text-center">
                    {Math.round(imageEditor.zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => imageEditor.zoomIn()}
                    className="p-1.5 hover:bg-muted rounded-md"
                    title="放大"
                  >
                    <ZoomIn size={16} className="text-morandi-secondary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => imageEditor.reset()}
                    className="p-1.5 hover:bg-muted rounded-md ml-1"
                    title="重置檢視"
                  >
                    <X size={16} className="text-morandi-secondary" />
                  </button>
                </div>
              )}
            </div>

            {/* 工具列 */}
            {customer.passport_image_url && !imageEditor.isCropMode && (
              <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => imageEditor.rotateLeft()}
                    className="p-2 hover:bg-card rounded-md flex items-center gap-1 text-xs"
                  >
                    <RotateCcw size={16} className="text-morandi-gold" />
                    <span className="text-morandi-secondary hidden sm:inline">左轉</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => imageEditor.rotateRight()}
                    className="p-2 hover:bg-card rounded-md flex items-center gap-1 text-xs"
                  >
                    <RotateCw size={16} className="text-morandi-gold" />
                    <span className="text-morandi-secondary hidden sm:inline">右轉</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => imageEditor.toggleFlipH()}
                    className={`p-2 hover:bg-card rounded-md flex items-center gap-1 text-xs ${imageEditor.flipH ? 'bg-morandi-gold/20' : ''}`}
                  >
                    <FlipHorizontal size={16} className="text-morandi-gold" />
                    <span className="text-morandi-secondary hidden sm:inline">翻轉</span>
                  </button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => imageEditor.startCrop()}
                    className="p-2 hover:bg-card rounded-md flex items-center gap-1 text-xs"
                  >
                    <Crop size={16} className="text-morandi-gold" />
                    <span className="text-morandi-secondary hidden sm:inline">裁剪</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {(imageEditor.rotation !== 0 || imageEditor.flipH) && (
                    <button
                      type="button"
                      onClick={handleSaveImageTransform}
                      disabled={imageEditor.isSaving}
                      className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{imageEditor.isSaving ? '儲存中...' : '儲存圖片'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReOcr}
                    disabled={isRecognizing}
                    className="p-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md flex items-center gap-1 text-xs disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isRecognizing ? 'animate-spin' : ''} />
                    <span>{isRecognizing ? '辨識中...' : '再次辨識'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 圖片容器 */}
            {customer.passport_image_url && (
              <div
                ref={imageContainerRef}
                className={`relative overflow-hidden rounded-lg border bg-muted ${
                  imageEditor.isCropMode
                    ? 'border-morandi-gold cursor-crosshair'
                    : 'cursor-grab active:cursor-grabbing'
                }`}
                style={{ height: '320px' }}
                onWheel={imageEditor.handleWheel}
                onMouseDown={(e) => imageEditor.handleMouseDown(e, imageContainerRef.current)}
                onMouseMove={(e) => imageEditor.handleMouseMove(e, imageContainerRef.current)}
                onMouseUp={imageEditor.handleMouseUp}
                onMouseLeave={(e) => imageEditor.handleMouseLeave(e, imageContainerRef.current)}
              >
                <img
                  src={customer.passport_image_url}
                  alt="護照"
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
                    className="absolute border-2 border-morandi-gold bg-morandi-gold/10"
                    style={{
                      left: imageEditor.cropRect.x,
                      top: imageEditor.cropRect.y,
                      width: imageEditor.cropRect.width,
                      height: imageEditor.cropRect.height,
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* 右邊：表單 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-morandi-primary">客戶資料</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-morandi-primary">中文姓名</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-morandi-primary">護照英文名</label>
                <Input
                  value={formData.passport_romanization || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, passport_romanization: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-morandi-primary">護照號碼</label>
                <Input
                  value={formData.passport_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-morandi-primary">護照效期</label>
                <DatePicker
                  value={formData.passport_expiry_date || ''}
                  onChange={(date) => setFormData(prev => ({ ...prev, passport_expiry_date: date }))}
                  placeholder="選擇日期"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-primary">出生日期</label>
                <DatePicker
                  value={formData.date_of_birth || ''}
                  onChange={(date) => setFormData(prev => ({ ...prev, date_of_birth: date }))}
                  placeholder="選擇日期"
                />
              </div>
              <div>
                <label className="text-xs text-morandi-primary">身分證字號</label>
                <Input
                  value={formData.national_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
            <Check size={16} />
            {isSaving ? '儲存中...' : '確認驗證'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
