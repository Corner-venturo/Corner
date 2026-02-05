/**
 * TourLeadersDialog - 領隊新增/編輯對話框
 */

'use client'

import React, { useRef, useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, User, X, Loader2 } from 'lucide-react'
import { uploadFileToStorage } from '@/services/storage'
import type { TourLeaderFormData } from '@/types/tour-leader.types'

interface TourLeadersDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: TourLeaderFormData
  onFormFieldChange: <K extends keyof TourLeaderFormData>(
    field: K,
    value: TourLeaderFormData[K]
  ) => void
  onSubmit: () => void
}

export const TourLeadersDialog: React.FC<TourLeadersDialogProps> = ({
  isOpen,
  isEditMode,
  onClose,
  formData,
  onFormFieldChange,
  onSubmit,
}) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    setIsUploadingPhoto(true)
    try {
      const result = await uploadFileToStorage(file, {
        bucket: 'workspace-files',
        folder: 'leader-photos',
      })
      onFormFieldChange('photo', result.publicUrl)
    } catch (error) {
      console.error('Failed to upload photo:', error)
    } finally {
      setIsUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯領隊' : '新增領隊'}
      subtitle="請填寫領隊基本資訊"
      onSubmit={onSubmit}
      submitLabel={isEditMode ? '儲存變更' : '新增領隊'}
      submitDisabled={!formData.name}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 基本資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">基本資料</h4>
          <div className="flex gap-4 mb-4">
            {/* 頭像上傳 */}
            <div className="flex-shrink-0">
              <div className="relative">
                {formData.photo ? (
                  <div className="relative">
                    <img
                      src={formData.photo}
                      alt="領隊頭像"
                      className="w-20 h-20 rounded-full object-cover border-2 border-morandi-container"
                    />
                    <button
                      type="button"
                      onClick={() => onFormFieldChange('photo', '')}
                      className="absolute -top-1 -right-1 p-1 bg-morandi-red text-white rounded-full hover:bg-morandi-red/80 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-full bg-morandi-container/50 flex items-center justify-center cursor-pointer hover:bg-morandi-container transition-colors border-2 border-dashed border-morandi-container"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 size={24} className="text-morandi-secondary animate-spin" />
                    ) : (
                      <User size={24} className="text-morandi-secondary" />
                    )}
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              {!formData.photo && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="mt-2 flex items-center gap-1 text-xs text-morandi-secondary hover:text-morandi-primary transition-colors"
                >
                  <Upload size={12} />
                  上傳頭像
                </button>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">
                  中文姓名 <span className="text-morandi-red">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={e => onFormFieldChange('name', e.target.value)}
                  placeholder="輸入中文姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">英文暱稱</label>
                <Input
                  value={formData.english_name}
                  onChange={e => onFormFieldChange('english_name', e.target.value)}
                  placeholder="輸入英文暱稱"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">國內電話</label>
              <Input
                value={formData.domestic_phone}
                onChange={e => onFormFieldChange('domestic_phone', e.target.value)}
                placeholder="+886 0912345678"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">國外電話</label>
              <Input
                value={formData.overseas_phone}
                onChange={e => onFormFieldChange('overseas_phone', e.target.value)}
                placeholder="+81 08012345678"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => onFormFieldChange('email', e.target.value)}
                placeholder="輸入 Email"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">電話（舊）</label>
              <Input
                value={formData.phone}
                onChange={e => onFormFieldChange('phone', e.target.value)}
                placeholder="輸入電話號碼"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-morandi-primary">地址</label>
              <Input
                value={formData.address}
                onChange={e => onFormFieldChange('address', e.target.value)}
                placeholder="輸入地址"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 證件資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">證件資料</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">身分證號</label>
              <Input
                value={formData.national_id}
                onChange={e => onFormFieldChange('national_id', e.target.value)}
                placeholder="輸入身分證號"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">護照號碼</label>
              <Input
                value={formData.passport_number}
                onChange={e => onFormFieldChange('passport_number', e.target.value)}
                placeholder="輸入護照號碼"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">護照效期</label>
              <DatePicker
                value={formData.passport_expiry}
                onChange={(date) => onFormFieldChange('passport_expiry', date)}
                placeholder="選擇日期"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 專業資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">專業資料</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">語言能力</label>
              <Input
                value={formData.languages}
                onChange={e => onFormFieldChange('languages', e.target.value)}
                placeholder="例如：中文, 英文, 日文（用逗號分隔）"
                className="mt-1"
              />
              <p className="text-xs text-morandi-muted mt-1">多個語言請用逗號分隔</p>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">專長地區/路線</label>
              <Input
                value={formData.specialties}
                onChange={e => onFormFieldChange('specialties', e.target.value)}
                placeholder="例如：日本, 韓國, 東南亞（用逗號分隔）"
                className="mt-1"
              />
              <p className="text-xs text-morandi-muted mt-1">多個地區請用逗號分隔</p>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">領隊證號碼</label>
              <Input
                value={formData.license_number}
                onChange={e => onFormFieldChange('license_number', e.target.value)}
                placeholder="輸入領隊證號碼"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">狀態</label>
              <Select
                value={formData.status}
                onValueChange={value => onFormFieldChange('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">合作中</SelectItem>
                  <SelectItem value="inactive">停止合作</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">備註</label>
          <Textarea
            value={formData.notes}
            onChange={e => onFormFieldChange('notes', e.target.value)}
            placeholder="其他備註資訊（選填）"
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
