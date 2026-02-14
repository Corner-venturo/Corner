/**
 * FleetDriverDialog - 司機新增/編輯對話框
 */

'use client'

import { DRIVER_DIALOG_LABELS } from '../constants/labels'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FleetDriverFormData, LicenseType, DriverStatus } from '@/types/fleet.types'
import { DRIVER_STATUS_OPTIONS } from '@/types/fleet.types'

interface FleetDriverDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: FleetDriverFormData
  onFormFieldChange: <K extends keyof FleetDriverFormData>(
    field: K,
    value: FleetDriverFormData[K]
  ) => void
  onSubmit: () => void
}

const LICENSE_TYPE_OPTIONS = [
  { value: 'professional', label: '職業駕照' },
  { value: 'regular', label: '普通駕照' },
]

export const FleetDriverDialog: React.FC<FleetDriverDialogProps> = ({
  isOpen,
  isEditMode,
  onClose,
  formData,
  onFormFieldChange,
  onSubmit,
}) => {
  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯司機' : '新增司機'}
      subtitle="請填寫司機基本資訊"
      onSubmit={onSubmit}
      submitLabel={isEditMode ? '儲存變更' : '新增司機'}
      submitDisabled={!formData.name}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 基本資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{DRIVER_DIALOG_LABELS.BASIC_INFO}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                姓名 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={e => onFormFieldChange('name', e.target.value)}
                placeholder={DRIVER_DIALOG_LABELS.LABEL_5402}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.PHONE}</label>
              <Input
                value={formData.phone}
                onChange={e => onFormFieldChange('phone', e.target.value)}
                placeholder={DRIVER_DIALOG_LABELS.LABEL_8624}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.ID_NUMBER}</label>
              <Input
                value={formData.id_number}
                onChange={e => onFormFieldChange('id_number', e.target.value.toUpperCase())}
                placeholder={DRIVER_DIALOG_LABELS.LABEL_4540}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.STATUS}</label>
              <Select
                value={formData.status}
                onValueChange={value => onFormFieldChange('status', value as DriverStatus)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRIVER_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 駕照資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{DRIVER_DIALOG_LABELS.LICENSE_INFO}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.LICENSE_TYPE}</label>
              <Select
                value={formData.license_type}
                onValueChange={value => onFormFieldChange('license_type', value as LicenseType)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.LICENSE_NUMBER}</label>
              <Input
                value={formData.license_number}
                onChange={e => onFormFieldChange('license_number', e.target.value)}
                placeholder={DRIVER_DIALOG_LABELS.LABEL_8646}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.LICENSE_EXPIRY}</label>
              <Input
                type="date"
                value={formData.license_expiry_date}
                onChange={e => onFormFieldChange('license_expiry_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 職業駕照（大客車） */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{DRIVER_DIALOG_LABELS.PRO_LICENSE}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.PRO_LICENSE_NUMBER}</label>
              <Input
                value={formData.professional_license_number}
                onChange={e => onFormFieldChange('professional_license_number', e.target.value)}
                placeholder={DRIVER_DIALOG_LABELS.LABEL_1727}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.PRO_LICENSE_EXPIRY}</label>
              <Input
                type="date"
                value={formData.professional_license_expiry}
                onChange={e => onFormFieldChange('professional_license_expiry', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 健康檢查 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{DRIVER_DIALOG_LABELS.HEALTH_CHECK}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.HEALTH_CHECK_EXPIRY}</label>
              <Input
                type="date"
                value={formData.health_check_expiry}
                onChange={e => onFormFieldChange('health_check_expiry', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">{DRIVER_DIALOG_LABELS.REMARKS}</label>
          <Textarea
            value={formData.notes}
            onChange={e => onFormFieldChange('notes', e.target.value)}
            placeholder={DRIVER_DIALOG_LABELS.LABEL_2669}
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
