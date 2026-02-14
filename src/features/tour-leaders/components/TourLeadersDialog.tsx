'use client'
/**
 * TourLeadersDialog - 領隊新增/編輯對話框
 */


import React, { useRef, useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, User, X, Loader2 } from 'lucide-react'
import { uploadFileToStorage } from '@/services/storage'
import type { TourLeaderFormData } from '@/types/tour-leader.types'
import { TOUR_LEADERS_LABELS } from '../constants/labels'

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
      title={isEditMode ? TOUR_LEADERS_LABELS.EDIT_LEADER : TOUR_LEADERS_LABELS.ADD_LEADER}
      subtitle={TOUR_LEADERS_LABELS.SUBTITLE}
      onSubmit={onSubmit}
      submitLabel={isEditMode ? TOUR_LEADERS_LABELS.SAVE_CHANGES : TOUR_LEADERS_LABELS.ADD_LEADER}
      submitDisabled={!formData.name}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 基本資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{TOUR_LEADERS_LABELS.BASIC_INFO}</h4>
          <div className="flex gap-4 mb-4">
            {/* 頭像上傳 */}
            <div className="flex-shrink-0">
              <div className="relative">
                {formData.photo ? (
                  <div className="relative">
                    <img
                      src={formData.photo}
                      alt={TOUR_LEADERS_LABELS.LABEL_2837}
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
                  {TOUR_LEADERS_LABELS.UPLOAD_AVATAR}
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
                  placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_CHINESE_NAME}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.ENGLISH_NICKNAME}</label>
                <Input
                  value={formData.english_name}
                  onChange={e => onFormFieldChange('english_name', e.target.value)}
                  placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_ENGLISH_NICKNAME}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.DOMESTIC_PHONE}</label>
              <Input
                value={formData.domestic_phone}
                onChange={e => onFormFieldChange('domestic_phone', e.target.value)}
                placeholder="+886 0912345678"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.INTERNATIONAL_PHONE}</label>
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
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_EMAIL}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.PHONE_OLD}</label>
              <Input
                value={formData.phone}
                onChange={e => onFormFieldChange('phone', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_PHONE}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.ADDRESS}</label>
              <Input
                value={formData.address}
                onChange={e => onFormFieldChange('address', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_ADDRESS}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 證件資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{TOUR_LEADERS_LABELS.DOCUMENT_INFO}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.ID_NUMBER}</label>
              <Input
                value={formData.national_id}
                onChange={e => onFormFieldChange('national_id', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_ID_NUMBER}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.PASSPORT_NUMBER}</label>
              <Input
                value={formData.passport_number}
                onChange={e => onFormFieldChange('passport_number', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_PASSPORT}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.PASSPORT_EXPIRY}</label>
              <DatePicker
                value={formData.passport_expiry}
                onChange={(date) => onFormFieldChange('passport_expiry', date)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_SELECT_DATE}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 專業資料 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{TOUR_LEADERS_LABELS.PROFESSIONAL_INFO}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.LANGUAGES}</label>
              <Input
                value={formData.languages}
                onChange={e => onFormFieldChange('languages', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_LANGUAGES}
                className="mt-1"
              />
              <p className="text-xs text-morandi-muted mt-1">{TOUR_LEADERS_LABELS.LANGUAGES_HINT}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.SPECIALTY_REGIONS}</label>
              <Input
                value={formData.specialties}
                onChange={e => onFormFieldChange('specialties', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_REGIONS}
                className="mt-1"
              />
              <p className="text-xs text-morandi-muted mt-1">{TOUR_LEADERS_LABELS.REGIONS_HINT}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.LICENSE_NUMBER}</label>
              <Input
                value={formData.license_number}
                onChange={e => onFormFieldChange('license_number', e.target.value)}
                placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_LICENSE}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.STATUS}</label>
              <Select
                value={formData.status}
                onValueChange={value => onFormFieldChange('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{TOUR_LEADERS_LABELS.STATUS_ACTIVE}</SelectItem>
                  <SelectItem value="inactive">{TOUR_LEADERS_LABELS.STATUS_INACTIVE}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">{TOUR_LEADERS_LABELS.NOTES}</label>
          <Textarea
            value={formData.notes}
            onChange={e => onFormFieldChange('notes', e.target.value)}
            placeholder={TOUR_LEADERS_LABELS.PLACEHOLDER_NOTES}
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
