/**
 * FleetDialog - 車輛新增/編輯對話框
 */

'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FleetVehicleFormData, VehicleType, VehicleStatus } from '@/types/fleet.types'
import { VEHICLE_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from '@/types/fleet.types'

interface FleetDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: FleetVehicleFormData
  onFormFieldChange: <K extends keyof FleetVehicleFormData>(
    field: K,
    value: FleetVehicleFormData[K]
  ) => void
  onSubmit: () => void
}

export const FleetDialog: React.FC<FleetDialogProps> = ({
  isOpen,
  isEditMode,
  onClose,
  formData,
  onFormFieldChange,
  onSubmit,
}) => {
  // 當車型變更時，自動更新座位數
  const handleVehicleTypeChange = (type: VehicleType) => {
    onFormFieldChange('vehicle_type', type)
    const option = VEHICLE_TYPE_OPTIONS.find(o => o.value === type)
    if (option) {
      onFormFieldChange('capacity', option.capacity)
    }
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯車輛' : '新增車輛'}
      subtitle="請填寫車輛基本資訊"
      onSubmit={onSubmit}
      submitLabel={isEditMode ? '儲存變更' : '新增車輛'}
      submitDisabled={!formData.license_plate}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* 車輛資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">車輛資訊</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium text-morandi-primary">車輛名稱</label>
              <Input
                value={formData.vehicle_name}
                onChange={e => onFormFieldChange('vehicle_name', e.target.value)}
                placeholder="例如：1號車、A車"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">車型</label>
              <Select
                value={formData.vehicle_type}
                onValueChange={value => handleVehicleTypeChange(value as VehicleType)}
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
              <label className="text-sm font-medium text-morandi-primary">座位數</label>
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
          </div>
        </div>

        {/* 司機資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">預設司機（可選）</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">司機姓名</label>
              <Input
                value={formData.driver_name}
                onChange={e => onFormFieldChange('driver_name', e.target.value)}
                placeholder="輸入司機姓名"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">司機電話</label>
              <Input
                value={formData.driver_phone}
                onChange={e => onFormFieldChange('driver_phone', e.target.value)}
                placeholder="輸入司機電話"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 狀態 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">狀態</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">車輛狀態</label>
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
