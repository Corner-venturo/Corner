'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Tour } from '@/stores/types'
import { useTourEditDialog } from './hooks/useTourEditDialog'
import { BasicInfoSection } from './edit-dialog/BasicInfoSection'
import { FlightInfoSection } from './edit-dialog/FlightInfoSection'

interface TourEditDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  onSuccess?: (updatedTour: Tour) => void
}

export function TourEditDialog({ isOpen, onClose, tour, onSuccess }: TourEditDialogProps) {
  const {
    formData,
    setFormData,
    submitting,
    activeCountries,
    availableCities,
    setAvailableCities,
    loadingOutbound,
    loadingReturn,
    getCitiesByCountryId,
    updateFlightField,
    handleSearchOutbound,
    handleSearchReturn,
    handleSubmit,
  } = useTourEditDialog(tour, isOpen, onClose, onSuccess)

  // 處理欄位變更
  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 處理國家變更
  const handleCountryChange = (countryCode: string) => {
    const selectedCountry = activeCountries.find(c => c.code === countryCode)
    const cities =
      countryCode === '__custom__'
        ? []
        : selectedCountry
          ? getCitiesByCountryId(selectedCountry.id)
          : []
    setAvailableCities(cities)
    setFormData(prev => ({
      ...prev,
      countryCode,
      cityCode: countryCode === '__custom__' ? '__custom__' : '',
    }))
  }

  // 處理出發日期變更（需要同時更新返回日期的最小值）
  const handleDepartureDateChange = (departure_date: string) => {
    setFormData(prev => ({
      ...prev,
      departure_date,
      return_date: prev.return_date && prev.return_date < departure_date
        ? departure_date
        : prev.return_date,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        nested
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>編輯旅遊團基本資料</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 基本資訊區塊 */}
          <BasicInfoSection
            formData={formData}
            activeCountries={activeCountries}
            availableCities={availableCities}
            onFieldChange={handleFieldChange}
            onCountryChange={handleCountryChange}
            onDepartureDateChange={handleDepartureDateChange}
          />

          {/* 航班資訊區塊 */}
          <FlightInfoSection
            outboundFlight={formData.outboundFlight}
            returnFlight={formData.returnFlight}
            loadingOutbound={loadingOutbound}
            loadingReturn={loadingReturn}
            onUpdateFlight={updateFlightField}
            onSearchOutbound={handleSearchOutbound}
            onSearchReturn={handleSearchReturn}
          />
        </div>

        {/* 按鈕 */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="gap-1">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim() || !formData.departure_date || !formData.return_date}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {submitting ? '儲存中...' : '儲存變更'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
