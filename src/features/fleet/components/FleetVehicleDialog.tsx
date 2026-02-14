/**
 * FleetVehicleDialog - 車輛新增/編輯對話框
 */

'use client'

import { VEHICLE_DIALOG_LABELS } from '../constants/labels'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FleetVehicleFormData, FleetDriver, VehicleType, VehicleStatus } from '@/types/fleet.types'
import { VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from '@/types/fleet.types'

interface FleetVehicleDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: FleetVehicleFormData
  onFormFieldChange: <K extends keyof FleetVehicleFormData>(
    field: K,
    value: FleetVehicleFormData[K]
  ) => void
  onSubmit: () => void
  drivers: FleetDriver[]
}

export const FleetVehicleDialog: React.FC<FleetVehicleDialogProps> = ({
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
      title={isEditMode ? '編輯車輛' : '新增車輛'}
      subtitle="請填寫車輛基本資訊"
      onSubmit={onSubmit}
      submitLabel={isEditMode ? '儲存變更' : '新增車輛'}
      submitDisabled={!formData.license_plate}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 基本資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{VEHICLE_DIALOG_LABELS.BASIC_INFO}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                車牌號碼 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={formData.license_plate}
                onChange={e => onFormFieldChange('license_plate', e.target.value.toUpperCase())}
                placeholder="例如：ABC-1234"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.VEHICLE_NAME}</label>
              <Input
                value={formData.vehicle_name}
                onChange={e => onFormFieldChange('vehicle_name', e.target.value)}
                placeholder="例如：1號車、A車"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.VEHICLE_STATUS}</label>
              <Select
                value={formData.status}
                onValueChange={value => onFormFieldChange('status', value as VehicleStatus)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 車輛規格 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{VEHICLE_DIALOG_LABELS.VEHICLE_SPECS}</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.VEHICLE_TYPE}</label>
              <Select
                value={formData.vehicle_type}
                onValueChange={value => onFormFieldChange('vehicle_type', value as VehicleType)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.SEATS}</label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={e => onFormFieldChange('capacity', parseInt(e.target.value) || 0)}
                placeholder="座位數"
                className="mt-1"
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.BRAND}</label>
              <Input
                value={formData.brand}
                onChange={e => onFormFieldChange('brand', e.target.value)}
                placeholder="例如：Toyota"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.MODEL}</label>
              <Input
                value={formData.model}
                onChange={e => onFormFieldChange('model', e.target.value)}
                placeholder="例如：Coaster"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.MANUFACTURE_YEAR}</label>
              <Input
                type="number"
                value={formData.year || ''}
                onChange={e => onFormFieldChange('year', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="例如：2020"
                className="mt-1"
                min={1990}
                max={2030}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.VIN}</label>
              <Input
                value={formData.vin}
                onChange={e => onFormFieldChange('vin', e.target.value.toUpperCase())}
                placeholder="車身號碼"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.CURRENT_MILEAGE}</label>
              <Input
                type="number"
                value={formData.current_mileage}
                onChange={e => onFormFieldChange('current_mileage', parseInt(e.target.value) || 0)}
                placeholder="公里數"
                className="mt-1"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* 重要日期 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{VEHICLE_DIALOG_LABELS.IMPORTANT_DATES}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.REGISTRATION_DATE}</label>
              <Input
                type="date"
                value={formData.registration_date}
                onChange={e => onFormFieldChange('registration_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.INSPECTION_EXPIRY}</label>
              <Input
                type="date"
                value={formData.inspection_due_date}
                onChange={e => onFormFieldChange('inspection_due_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{VEHICLE_DIALOG_LABELS.INSURANCE_EXPIRY}</label>
              <Input
                type="date"
                value={formData.insurance_due_date}
                onChange={e => onFormFieldChange('insurance_due_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">下次保養日</label>
              <Input
                type="date"
                value={formData.next_maintenance_date}
                onChange={e => onFormFieldChange('next_maintenance_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">下次保養里程</label>
              <Input
                type="number"
                value={formData.next_maintenance_km || ''}
                onChange={e => onFormFieldChange('next_maintenance_km', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="公里數"
                className="mt-1"
                min={0}
              />
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
