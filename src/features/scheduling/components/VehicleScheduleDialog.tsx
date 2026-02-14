/**
 * VehicleScheduleDialog - 車輛調度新增/編輯對話框
 */

'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FleetScheduleFormData, FleetVehicle } from '@/types/fleet.types'
import { getVehicleTypeLabel } from '@/types/fleet.types'
import { SCHEDULING_LABELS } from '../constants/labels'

interface VehicleScheduleDialogProps {
  isOpen: boolean
  isEditMode: boolean
  onClose: () => void
  formData: FleetScheduleFormData
  vehicles: FleetVehicle[]
  onFormFieldChange: <K extends keyof FleetScheduleFormData>(
    field: K,
    value: FleetScheduleFormData[K]
  ) => void
  onSubmit: () => void
}

export const VehicleScheduleDialog: React.FC<VehicleScheduleDialogProps> = ({
  isOpen,
  isEditMode,
  onClose,
  formData,
  vehicles,
  onFormFieldChange,
  onSubmit,
}) => {
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id)

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? SCHEDULING_LABELS.編輯車輛調度 : SCHEDULING_LABELS.新增車輛調度}
      subtitle={selectedVehicle ? `${selectedVehicle.license_plate} - ${getVehicleTypeLabel(selectedVehicle.vehicle_type)}` : SCHEDULING_LABELS.選擇車輛}
      onSubmit={onSubmit}
      submitLabel={isEditMode ? SCHEDULING_LABELS.儲存變更 : SCHEDULING_LABELS.新增調度}
      submitDisabled={!formData.vehicle_id || !formData.start_date || !formData.end_date}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* 車輛選擇 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{SCHEDULING_LABELS.車輛資訊}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                {SCHEDULING_LABELS.選擇車輛} <span className="text-morandi-red">*</span>
              </label>
              <Select
                value={formData.vehicle_id}
                onValueChange={value => {
                  onFormFieldChange('vehicle_id', value)
                  // 帶入車輛預設司機
                  const vehicle = vehicles.find(v => v.id === value)
                  if (vehicle) {
                    onFormFieldChange('driver_name', vehicle.driver_name || '')
                    onFormFieldChange('driver_phone', vehicle.driver_phone || '')
                  }
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder={SCHEDULING_LABELS.選擇車輛} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === 'available').map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.vehicle_name || getVehicleTypeLabel(vehicle.vehicle_type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 日期範圍 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{SCHEDULING_LABELS.調度日期}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                {SCHEDULING_LABELS.開始日期} <span className="text-morandi-red">*</span>
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={date => onFormFieldChange('start_date', date)}
                placeholder={SCHEDULING_LABELS.選擇開始日期}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                {SCHEDULING_LABELS.結束日期} <span className="text-morandi-red">*</span>
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={date => onFormFieldChange('end_date', date)}
                placeholder={SCHEDULING_LABELS.選擇結束日期}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 客戶/團資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{SCHEDULING_LABELS.客戶團資訊}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.客戶名稱}</label>
              <Input
                value={formData.client_name}
                onChange={e => onFormFieldChange('client_name', e.target.value)}
                placeholder={SCHEDULING_LABELS.例如旅行社}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.團號}</label>
              <Input
                value={formData.tour_code}
                onChange={e => onFormFieldChange('tour_code', e.target.value)}
                placeholder={SCHEDULING_LABELS.例如團號}
                className="mt-1 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.行程名稱}</label>
              <Input
                value={formData.tour_name}
                onChange={e => onFormFieldChange('tour_name', e.target.value)}
                placeholder={SCHEDULING_LABELS.例如行程}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.聯絡人}</label>
              <Input
                value={formData.contact_person}
                onChange={e => onFormFieldChange('contact_person', e.target.value)}
                placeholder={SCHEDULING_LABELS.輸入聯絡人姓名}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.聯絡電話}</label>
              <Input
                value={formData.contact_phone}
                onChange={e => onFormFieldChange('contact_phone', e.target.value)}
                placeholder={SCHEDULING_LABELS.輸入聯絡電話}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 司機資訊 */}
        <div>
          <h4 className="text-sm font-semibold text-morandi-primary mb-3">{SCHEDULING_LABELS.司機資訊}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.司機姓名}</label>
              <Input
                value={formData.driver_name}
                onChange={e => onFormFieldChange('driver_name', e.target.value)}
                placeholder={SCHEDULING_LABELS.輸入司機姓名}
                className="mt-1"
              />
              <p className="text-xs text-morandi-secondary mt-1">{SCHEDULING_LABELS.留空則使用車輛預設司機}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.司機電話}</label>
              <Input
                value={formData.driver_phone}
                onChange={e => onFormFieldChange('driver_phone', e.target.value)}
                placeholder={SCHEDULING_LABELS.輸入司機電話}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">{SCHEDULING_LABELS.備註}</label>
          <Textarea
            value={formData.notes}
            onChange={e => onFormFieldChange('notes', e.target.value)}
            placeholder={SCHEDULING_LABELS.其他備註資訊選填}
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
