'use client'

/**
 * ItemEditDialog - 項目編輯對話框
 *
 * 用於新增/編輯出團確認表的各項目
 * 根據分類顯示不同的欄位
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Save, Plus, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  TourConfirmationItem,
  ConfirmationItemCategory,
  CreateConfirmationItem,
  BookingStatus,
} from '@/types/tour-confirmation-sheet.types'

interface ItemEditDialogProps {
  open: boolean
  category: ConfirmationItemCategory
  item: TourConfirmationItem | null
  sheetId: string
  workspaceId: string
  onClose: () => void
  onSave: (data: CreateConfirmationItem) => Promise<void>
}

const categoryLabels: Record<ConfirmationItemCategory, string> = {
  transport: '交通',
  meal: '餐食',
  accommodation: '住宿',
  activity: '活動',
  other: '其他',
}

const bookingStatusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: '待處理' },
  { value: 'requested', label: '已發需求' },
  { value: 'confirmed', label: '已確認' },
  { value: 'cancelled', label: '已取消' },
  { value: 'pending_change', label: '待變更' },
]

export function ItemEditDialog({
  open,
  category,
  item,
  sheetId,
  workspaceId,
  onClose,
  onSave,
}: ItemEditDialogProps) {
  const isEdit = !!item

  // 表單狀態
  const [formData, setFormData] = useState<Partial<CreateConfirmationItem>>({})
  const [saving, setSaving] = useState(false)
  const [receiptImages, setReceiptImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化表單
  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          sheet_id: item.sheet_id,
          category: item.category,
          service_date: item.service_date,
          service_date_end: item.service_date_end || undefined,
          day_label: item.day_label || undefined,
          supplier_name: item.supplier_name,
          supplier_id: item.supplier_id || undefined,
          title: item.title,
          description: item.description || undefined,
          unit_price: item.unit_price || undefined,
          currency: item.currency,
          quantity: item.quantity || undefined,
          subtotal: item.subtotal || undefined,
          expected_cost: item.expected_cost || undefined,
          actual_cost: item.actual_cost || undefined,
          contact_info: item.contact_info || undefined,
          booking_reference: item.booking_reference || undefined,
          booking_status: item.booking_status,
          type_data: item.type_data || undefined,
          sort_order: item.sort_order,
          notes: item.notes || undefined,
          workspace_id: item.workspace_id,
          // 領隊記帳欄位
          leader_expense: item.leader_expense || undefined,
          leader_expense_note: item.leader_expense_note || undefined,
        })
        // 設定收據照片
        setReceiptImages(item.receipt_images || [])
      } else {
        setFormData({
          sheet_id: sheetId,
          category,
          service_date: '',
          supplier_name: '',
          title: '',
          currency: 'TWD',
          quantity: 1,
          booking_status: 'pending',
          sort_order: 0,
          workspace_id: workspaceId,
        })
      }
    }
  }, [open, item, category, sheetId, workspaceId])

  // 計算小計
  const subtotal = useMemo(() => {
    const price = formData.unit_price || 0
    const qty = formData.quantity || 1
    return price * qty
  }, [formData.unit_price, formData.quantity])

  // 更新表單欄位
  const updateField = <K extends keyof CreateConfirmationItem>(
    key: K,
    value: CreateConfirmationItem[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // 上傳收據照片
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !item?.id) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${item.id}/${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('tour-documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        logger.error('上傳收據失敗:', uploadError)
        return
      }

      const { data: urlData } = supabase.storage
        .from('tour-documents')
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        setReceiptImages(prev => [...prev, urlData.publicUrl])
      }
    } catch (err) {
      logger.error('上傳收據失敗:', err)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 刪除收據照片
  const handleRemoveImage = (index: number) => {
    setReceiptImages(prev => prev.filter((_, i) => i !== index))
  }

  // 儲存
  const handleSave = async () => {
    if (!formData.service_date || !formData.supplier_name || !formData.title) {
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...formData,
        sheet_id: sheetId,
        category,
        subtotal,
        expected_cost: formData.expected_cost ?? subtotal,
        workspace_id: workspaceId,
        receipt_images: receiptImages,
      } as CreateConfirmationItem)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent level={1} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '編輯' : '新增'}{categoryLabels[category]}項目
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>服務日期 *</Label>
              <Input
                type="date"
                value={formData.service_date || ''}
                onChange={(e) => updateField('service_date', e.target.value)}
                className="mt-1"
              />
            </div>
            {category === 'accommodation' && (
              <div>
                <Label>退房日期</Label>
                <Input
                  type="date"
                  value={formData.service_date_end || ''}
                  onChange={(e) => updateField('service_date_end', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label>日期標籤</Label>
              <Input
                placeholder="Day 1"
                value={formData.day_label || ''}
                onChange={(e) => updateField('day_label', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* 供應商/標題 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                {category === 'transport' ? '接駁公司' :
                 category === 'meal' ? '餐廳名稱' :
                 category === 'accommodation' ? '飯店名稱' :
                 category === 'activity' ? '場地名稱' : '供應商'} *
              </Label>
              <Input
                value={formData.supplier_name || ''}
                onChange={(e) => updateField('supplier_name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>
                {category === 'transport' ? '接駁地點' :
                 category === 'accommodation' ? '房型' : '項目名稱'} *
              </Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <Label>描述/備註</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="詳細說明..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* 金額 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>單價</Label>
              <Input
                type="number"
                value={formData.unit_price ?? ''}
                onChange={(e) => updateField('unit_price', parseFloat(e.target.value) || null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>數量</Label>
              <Input
                type="number"
                value={formData.quantity ?? 1}
                onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                className="mt-1"
                min={1}
              />
            </div>
            <div>
              <Label>小計</Label>
              <Input
                type="number"
                value={subtotal}
                disabled
                className="mt-1 bg-morandi-container/30"
              />
            </div>
            <div>
              <Label>幣別</Label>
              <Select
                value={formData.currency || 'TWD'}
                onValueChange={(v) => updateField('currency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 預計/實際支出 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>預計支出</Label>
              <Input
                type="number"
                value={formData.expected_cost ?? subtotal}
                onChange={(e) => updateField('expected_cost', parseFloat(e.target.value) || null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>實際支出</Label>
              <Input
                type="number"
                value={formData.actual_cost ?? ''}
                onChange={(e) => updateField('actual_cost', parseFloat(e.target.value) || null)}
                className="mt-1"
                placeholder="完成後填寫"
              />
            </div>
          </div>

          {/* 預訂狀態 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>預訂編號</Label>
              <Input
                value={formData.booking_reference || ''}
                onChange={(e) => updateField('booking_reference', e.target.value)}
                className="mt-1"
                placeholder="預約確認碼"
              />
            </div>
            <div>
              <Label>預訂狀態</Label>
              <Select
                value={formData.booking_status || 'pending'}
                onValueChange={(v) => updateField('booking_status', v as BookingStatus)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bookingStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 領隊記帳區 - 僅編輯模式顯示 */}
          {isEdit && (
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium text-morandi-primary mb-3 flex items-center gap-2">
                📝 領隊記帳
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>領隊實際支出</Label>
                  <Input
                    type="number"
                    value={formData.leader_expense ?? ''}
                    onChange={(e) => updateField('leader_expense', parseFloat(e.target.value) || null)}
                    className="mt-1"
                    placeholder="領隊支付金額"
                  />
                </div>
                <div>
                  <Label>支出備註</Label>
                  <Input
                    value={formData.leader_expense_note || ''}
                    onChange={(e) => updateField('leader_expense_note', e.target.value)}
                    className="mt-1"
                    placeholder="領隊備註"
                  />
                </div>
              </div>
              <p className="text-xs text-morandi-secondary mt-2">
                * 領隊可在 Online App 中填寫實際支出並上傳收據
              </p>

              {/* 收據照片區 */}
              <div className="mt-4">
                <Label className="flex items-center gap-2">
                  <ImageIcon size={14} />
                  收據照片
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {receiptImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`收據 ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-morandi-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {/* 上傳按鈕 */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-20 h-20 border-2 border-dashed border-morandi-container rounded-lg flex flex-col items-center justify-center text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-colors"
                  >
                    {uploadingImage ? (
                      <span className="text-xs">上傳中...</span>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-xs mt-1">上傳</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 備註 */}
          <div>
            <Label>備註</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="內部備註..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving} className="gap-1">
            <X size={14} />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.service_date || !formData.supplier_name || !formData.title}
            className="bg-morandi-gold hover:bg-morandi-gold-hover gap-1"
          >
            {isEdit ? <Save size={14} /> : <Plus size={14} />}
            {isEdit ? '儲存' : '新增'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
