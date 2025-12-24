'use client'

import React from 'react'
import { UserPlus, Upload, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CustomerMatch {
  name: string
  phone: string
  matchedCustomers: Array<{
    id: string
    name: string
    phone: string | null
    date_of_birth: string | null
    national_id: string | null
  }>
}

interface CustomerMatchDialogProps {
  open: boolean
  currentPerson: CustomerMatch | undefined
  currentIndex: number
  totalCount: number
  onSelectExisting: (customerId: string, customerName: string) => void
  onAddNew: () => void
  onSkipAll: () => void
}

export function CustomerMatchDialog({
  open,
  currentPerson,
  currentIndex,
  totalCount,
  onSelectExisting,
  onAddNew,
  onSkipAll,
}: CustomerMatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onSkipAll()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-morandi-gold" />
            旅客資料比對
            {totalCount > 1 && (
              <span className="text-sm font-normal text-morandi-secondary">
                ({currentIndex + 1} / {totalCount})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentPerson?.matchedCustomers.length ?? 0 > 0
              ? `找到 ${currentPerson?.matchedCustomers.length} 位同名「${currentPerson?.name}」的客戶，請確認是否為同一人`
              : `「${currentPerson?.name}」為新客戶，是否要新增到 CRM？`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* 有同名客戶時，列出供選擇 */}
          {(currentPerson?.matchedCustomers.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {currentPerson?.matchedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border border-border rounded-lg hover:border-morandi-gold/50 hover:bg-morandi-container/20 transition-colors cursor-pointer"
                  onClick={() => onSelectExisting(customer.id, customer.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-morandi-gold/20 flex items-center justify-center text-lg font-medium text-morandi-gold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-morandi-primary">{customer.name}</div>
                        <div className="text-sm text-morandi-secondary space-x-3">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.date_of_birth && (
                            <span>{new Date(customer.date_of_birth).toLocaleDateString('zh-TW')}</span>
                          )}
                          {customer.national_id && <span>{customer.national_id}</span>}
                        </div>
                        {!customer.phone && !customer.date_of_birth && !customer.national_id && (
                          <div className="text-sm text-morandi-secondary/60">尚無詳細資料</div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-morandi-gold border-morandi-gold/50">
                      是此人
                    </Button>
                  </div>
                </div>
              ))}

              {/* 不是以上任何人，新增為新客戶 */}
              <div
                className="p-4 border border-dashed border-border rounded-lg hover:border-morandi-green/50 hover:bg-morandi-green/5 transition-colors cursor-pointer"
                onClick={onAddNew}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-morandi-green/20 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-morandi-green" />
                    </div>
                    <div>
                      <div className="font-medium text-morandi-primary">都不是，新增為新客戶</div>
                      <div className="text-sm text-morandi-secondary">建立「{currentPerson?.name}」的新資料</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-morandi-green border-morandi-green/50">
                    新增
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* 沒有同名客戶，直接顯示新增選項 */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-morandi-gold/20 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-morandi-gold" />
              </div>
              <div className="text-lg font-medium text-morandi-primary mb-2">
                {currentPerson?.name}
              </div>
              <div className="text-sm text-morandi-secondary mb-4">
                此為新客戶，尚無資料
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {(currentPerson?.matchedCustomers.length ?? 0) === 0 && (
            <Button
              onClick={onAddNew}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              新增到 CRM
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddCustomerFormDialogProps {
  open: boolean
  customerName: string
  formData: {
    name: string
    phone: string
    email: string
    national_id: string
    passport_number: string
    passport_romanization: string
    passport_expiry_date: string
    date_of_birth: string
    gender: string
    notes: string
    passport_image_url: string
  }
  isUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onUpdateField: (field: string, value: string) => void
  onUploadImage: (file: File) => void
  onSave: () => void
  onBack: () => void
}

export function AddCustomerFormDialog({
  open,
  customerName,
  formData,
  isUploading,
  fileInputRef,
  onUpdateField,
  onUploadImage,
  onSave,
  onBack,
}: AddCustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onBack()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-morandi-gold" />
            新增旅客資料
          </DialogTitle>
          <DialogDescription>
            填寫「{customerName}」的資料（所有欄位皆為選填）
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 grid grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto">
          {/* 左側：表單欄位 */}
          <div className="space-y-4">
            {/* 基本資料 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">姓名</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => onUpdateField('name', e.target.value)}
                  className="bg-morandi-container/30 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">電話</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => onUpdateField('phone', e.target.value)}
                  placeholder="選填"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => onUpdateField('email', e.target.value)}
                  placeholder="選填"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">身分證字號</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => onUpdateField('national_id', e.target.value)}
                  placeholder="選填"
                  className="h-9"
                />
              </div>
            </div>

            {/* 護照資訊 */}
            <div className="border-t border-border pt-3">
              <p className="text-xs text-morandi-secondary mb-2">護照資訊</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">護照號碼</Label>
                  <Input
                    value={formData.passport_number}
                    onChange={(e) => onUpdateField('passport_number', e.target.value)}
                    placeholder="選填"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">護照拼音</Label>
                  <Input
                    value={formData.passport_romanization}
                    onChange={(e) => onUpdateField('passport_romanization', e.target.value.toUpperCase())}
                    placeholder="WANG/XIAOMING"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">護照效期</Label>
                  <DatePicker
                    value={formData.passport_expiry_date}
                    onChange={(date) => onUpdateField('passport_expiry_date', date)}
                    className="h-9"
                    placeholder="選擇日期"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">出生日期</Label>
                  <DatePicker
                    value={formData.date_of_birth}
                    onChange={(date) => onUpdateField('date_of_birth', date)}
                    className="h-9"
                    placeholder="選擇日期"
                  />
                </div>
              </div>
            </div>

            {/* 其他資料 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">性別</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => onUpdateField('gender', value)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="選填" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">備註</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => onUpdateField('notes', e.target.value)}
                  placeholder="選填"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* 右側：護照圖片上傳 */}
          <div className="space-y-3">
            <Label className="text-xs">護照掃描檔</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors ${
                formData.passport_image_url
                  ? 'border-morandi-gold/50 bg-morandi-gold/5'
                  : 'border-border hover:border-morandi-gold/50 hover:bg-morandi-container/20'
              }`}
              style={{ minHeight: '280px' }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files?.[0]
                if (file && file.type.startsWith('image/')) {
                  onUploadImage(file)
                }
              }}
            >
              {formData.passport_image_url ? (
                <>
                  <img
                    src={formData.passport_image_url}
                    alt="護照掃描檔"
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: '280px' }}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateField('passport_image_url', '')}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    title="移除圖片"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                  {isUploading ? (
                    <Loader2 size={32} className="text-morandi-gold animate-spin" />
                  ) : (
                    <>
                      <Upload size={32} className="text-morandi-secondary/50 mb-2" />
                      <span className="text-sm text-morandi-secondary">點擊或拖曳上傳護照掃描檔</span>
                      <span className="text-xs text-morandi-secondary/60 mt-1">支援 JPG、PNG 格式</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onUploadImage(file)
                      }
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-morandi-secondary/60">
              上傳護照掃描檔後，未來可直接調用，不需重新掃描
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onBack}
          >
            返回
          </Button>
          <Button
            onClick={onSave}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
