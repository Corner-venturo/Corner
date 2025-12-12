/**
 * 新增顧客對話框
 * 功能：手動輸入 + 護照 OCR 上傳
 */
'use client'

import { useState } from 'react'
import { Edit, Upload, FileImage, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // 護照上傳 Hook
  const passportUpload = usePassportUpload({
    onSuccess: async (customers) => {
      await onAddFromOcr(customers)
      handleClose()
    },
  })

  const handleClose = () => {
    setNewCustomer(INITIAL_CUSTOMER)
    passportUpload.clearFiles()
    onOpenChange(false)
  }

  const handleAddManually = async () => {
    await onAddCustomer(newCustomer)
    setNewCustomer(INITIAL_CUSTOMER)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增顧客</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* 左邊：手動輸入表單 */}
          <div className="space-y-4 border-r border-border pr-6">
            <div className="flex items-center gap-2 text-morandi-primary font-medium">
              <Edit size={18} />
              <span>手動輸入</span>
            </div>
            <p className="text-sm text-morandi-secondary">
              手動填寫顧客基本資訊與護照資料
            </p>

            {/* 基本資訊 */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-morandi-primary">姓名 *</label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="輸入顧客姓名"
                  className="mt-1 h-8 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-primary">電話 *</label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="輸入聯絡電話"
                  className="mt-1 h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-morandi-primary">Email</label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-morandi-primary">身份證字號</label>
                  <Input
                    value={newCustomer.national_id}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, national_id: e.target.value }))}
                    placeholder="身份證字號"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-primary">護照拼音</label>
                <Input
                  value={newCustomer.passport_romanization}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      passport_romanization: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="例如：WANG/XIAOMING"
                  className="mt-1 h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-morandi-primary">護照號碼</label>
                  <Input
                    value={newCustomer.passport_number}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, passport_number: e.target.value }))}
                    placeholder="護照號碼"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-morandi-primary">護照效期</label>
                  <Input
                    type="date"
                    value={newCustomer.passport_expiry_date}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, passport_expiry_date: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-morandi-primary">出生日期</label>
                <Input
                  type="date"
                  value={newCustomer.date_of_birth}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleAddManually}
              disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
              className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              手動新增顧客
            </Button>
          </div>

          {/* 右邊：上傳護照 OCR 辨識 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-morandi-primary font-medium">
              <Upload size={18} />
              <span>上傳護照辨識</span>
            </div>
            <p className="text-sm text-morandi-secondary">
              上傳護照圖片，自動辨識並建立顧客資料
            </p>

            {/* 重要提醒 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-blue-900 mb-2">⚠️ 重要提醒</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
              </ul>
            </div>

            {/* 拍攝提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-amber-900 mb-2">📸 拍攝建議</h4>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>✓ 確保護照<strong>最下方兩排文字</strong>清晰可見</li>
                <li>✓ 光線充足，避免反光或陰影</li>
                <li>✓ 拍攝角度正面，避免傾斜</li>
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
                        className="h-6 w-6 p-0 flex items-center justify-center hover:bg-red-100 rounded transition-colors"
                        disabled={passportUpload.isUploading}
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={passportUpload.processFiles}
                  disabled={passportUpload.isUploading}
                  className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  {passportUpload.isUploading
                    ? '辨識中...'
                    : `辨識並建立 ${passportUpload.files.length} 位顧客`}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
