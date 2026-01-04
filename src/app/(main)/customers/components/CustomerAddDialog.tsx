/**
 * 新增顧客對話框
 * 功能：手動輸入 + 護照 OCR 上傳
 *
 * 使用 ManagedDialog 進行生命週期管理：
 * - 自動追蹤 dirty 狀態
 * - 關閉前確認（如有未保存的修改）
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Edit, Upload, FileImage, Trash2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { FormField } from '@/components/ui/form-field'
import { ManagedDialog, useDirtyState } from '@/components/dialog'
import type { Customer } from '@/types/customer.types'
import { usePassportUpload } from '../hooks/usePassportUpload'

interface NewCustomerData {
  name: string
  email: string
  phone: string
  address: string
  passport_number: string
  passport_romanization: string
  passport_expiry_date: string
  national_id: string
  date_of_birth: string
}

const INITIAL_CUSTOMER: NewCustomerData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  passport_number: '',
  passport_romanization: '',
  passport_expiry_date: '',
  national_id: '',
  date_of_birth: '',
}

interface CustomerAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCustomer: (data: NewCustomerData) => Promise<void>
  onAddFromOcr: (customers: Partial<Customer>[]) => Promise<void>
}

export function CustomerAddDialog({
  open,
  onOpenChange,
  onAddCustomer,
  onAddFromOcr,
}: CustomerAddDialogProps) {
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>(INITIAL_CUSTOMER)

  // 使用 useDirtyState 追蹤表單變更
  const { isDirty, resetDirty, setOriginalData, checkDirty } = useDirtyState()

  // 當 Dialog 開啟時，設置原始數據
  useEffect(() => {
    if (open) {
      setOriginalData(INITIAL_CUSTOMER)
      resetDirty()
    }
  }, [open, setOriginalData, resetDirty])

  // 護照上傳 Hook
  const passportUpload = usePassportUpload({
    onSuccess: async (customers) => {
      await onAddFromOcr(customers)
      handleClose()
    },
  })

  // 更新欄位並追蹤 dirty 狀態
  const updateField = useCallback(
    <K extends keyof NewCustomerData>(field: K, value: NewCustomerData[K]) => {
      setNewCustomer((prev) => {
        const updated = { ...prev, [field]: value }
        // 檢查是否與原始數據不同
        checkDirty(updated)
        return updated
      })
    },
    [checkDirty]
  )

  const handleClose = useCallback(() => {
    setNewCustomer(INITIAL_CUSTOMER)
    passportUpload.clearFiles()
    resetDirty()
    onOpenChange(false)
  }, [passportUpload, resetDirty, onOpenChange])

  const handleAddManually = async () => {
    await onAddCustomer(newCustomer)
    setNewCustomer(INITIAL_CUSTOMER)
    resetDirty()
    onOpenChange(false)
  }

  return (
    <ManagedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="新增顧客"
      maxWidth="4xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
      showFooter={false}
      confirmOnDirtyClose
      confirmCloseTitle="放棄新增？"
      confirmCloseMessage="已輸入的顧客資料尚未保存，確定要關閉嗎？"
      confirmCloseLabel="放棄"
      cancelCloseLabel="繼續填寫"
      externalDirty={isDirty || passportUpload.files.length > 0}
      onAfterClose={() => {
        setNewCustomer(INITIAL_CUSTOMER)
        passportUpload.clearFiles()
      }}
    >
      <div className="grid grid-cols-2 gap-6 py-4">
        {/* 左邊：手動輸入表單 */}
        <div className="space-y-4 border-r border-border pr-6">
          <div className="flex items-center gap-2 text-morandi-primary font-medium">
            <Edit size={18} />
            <span>手動輸入</span>
          </div>
          <p className="text-sm text-morandi-secondary">手動填寫顧客基本資訊與護照資料</p>

          {/* 基本資訊 - 使用 FormField 組件 */}
          <div className="space-y-3">
            <FormField label="姓名" required labelClassName="text-xs">
              <Input
                value={newCustomer.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="輸入顧客姓名"
                className="h-8 text-sm"
              />
            </FormField>

            <FormField label="電話" required labelClassName="text-xs">
              <Input
                value={newCustomer.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="輸入聯絡電話"
                className="h-8 text-sm"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField label="Email" labelClassName="text-xs">
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Email"
                  className="h-8 text-sm"
                />
              </FormField>
              <FormField label="身份證字號" labelClassName="text-xs">
                <Input
                  value={newCustomer.national_id}
                  onChange={(e) => updateField('national_id', e.target.value)}
                  placeholder="身份證字號"
                  className="h-8 text-sm"
                />
              </FormField>
            </div>

            <FormField label="護照拼音" labelClassName="text-xs">
              <Input
                value={newCustomer.passport_romanization}
                onChange={(e) => updateField('passport_romanization', e.target.value.toUpperCase())}
                placeholder="例如：WANG/XIAOMING"
                className="h-8 text-sm"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField label="護照號碼" labelClassName="text-xs">
                <Input
                  value={newCustomer.passport_number}
                  onChange={(e) => updateField('passport_number', e.target.value)}
                  placeholder="護照號碼"
                  className="h-8 text-sm"
                />
              </FormField>
              <FormField label="護照效期" labelClassName="text-xs">
                <DatePicker
                  value={newCustomer.passport_expiry_date}
                  onChange={(date) => updateField('passport_expiry_date', date)}
                  className="h-8 text-sm"
                  placeholder="選擇日期"
                />
              </FormField>
            </div>

            <FormField label="出生日期" labelClassName="text-xs">
              <DatePicker
                value={newCustomer.date_of_birth}
                onChange={(date) => updateField('date_of_birth', date)}
                className="h-8 text-sm"
                placeholder="選擇日期"
              />
            </FormField>
          </div>

          <Button
            onClick={handleAddManually}
            disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
            className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Plus size={16} />
            手動新增顧客
          </Button>
        </div>

        {/* 右邊：上傳護照 OCR 辨識 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-morandi-primary font-medium">
            <Upload size={18} />
            <span>上傳護照辨識</span>
          </div>
          <p className="text-sm text-morandi-secondary">上傳護照圖片，自動辨識並建立顧客資料</p>

          {/* 重要提醒 */}
          <div className="bg-status-info-bg border border-status-info/30 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-morandi-primary mb-2">重要提醒</h4>
            <ul className="text-xs text-morandi-secondary space-y-1">
              <li>
                OCR 辨識的資料會自動標記為<strong>「待驗證」</strong>
              </li>
              <li>
                請務必<strong>人工檢查護照資訊</strong>
              </li>
              <li>支援所有國家護照（TWN、USA、JPN 等）</li>
            </ul>
          </div>

          {/* 拍攝提示 */}
          <div className="bg-status-warning-bg border border-status-warning/30 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-morandi-primary mb-2">拍攝建議</h4>
            <ul className="text-xs text-morandi-secondary space-y-1">
              <li>
                確保護照<strong>最下方兩排文字</strong>清晰可見
              </li>
              <li>光線充足，避免反光或陰影</li>
              <li>拍攝角度正面，避免傾斜</li>
            </ul>
          </div>

          {/* 上傳區域 */}
          <label
            htmlFor="passport-upload"
            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              passportUpload.isDragging
                ? 'border-morandi-gold bg-morandi-gold/20 scale-105'
                : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
            }`}
            onDragOver={passportUpload.handleDragOver}
            onDragLeave={passportUpload.handleDragLeave}
            onDrop={passportUpload.handleDrop}
          >
            <div className="flex flex-col items-center justify-center py-4">
              <Upload className="w-6 h-6 mb-2 text-morandi-secondary" />
              <p className="text-sm text-morandi-primary">
                <span className="font-semibold">點擊上傳</span> 或拖曳檔案
              </p>
              <p className="text-xs text-morandi-secondary">支援 JPG, PNG, PDF（可多選）</p>
            </div>
            <input
              id="passport-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={passportUpload.handleFileChange}
              disabled={passportUpload.isUploading}
            />
          </label>

          {/* 已選檔案列表 */}
          {passportUpload.files.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-morandi-secondary mb-2">
                已選擇 {passportUpload.files.length} 個檔案：
              </div>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {passportUpload.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-morandi-container/20 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileImage size={14} className="text-morandi-gold flex-shrink-0" />
                      <span className="text-xs text-morandi-primary truncate">{file.name}</span>
                      <span className="text-xs text-morandi-secondary flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        passportUpload.removeFile(index)
                      }}
                      className="h-6 w-6 p-0 flex items-center justify-center hover:bg-status-danger-bg rounded transition-colors"
                      disabled={passportUpload.isUploading}
                    >
                      <Trash2 size={12} className="text-status-danger" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={passportUpload.processFiles}
                disabled={passportUpload.isUploading}
                className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
              >
                <Upload size={16} />
                {passportUpload.isUploading
                  ? '辨識中...'
                  : `辨識並建立 ${passportUpload.files.length} 位顧客`}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button variant="outline" onClick={handleClose} className="gap-2">
          <X size={16} />
          取消
        </Button>
      </div>
    </ManagedDialog>
  )
}
