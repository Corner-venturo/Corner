'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Tour } from '@/stores/types'
import { useTourEdit } from './hooks/useTourEdit'
import { BasicInfoSection } from './edit-dialog/BasicInfoSection'
import { FlightInfoSection } from './edit-dialog/FlightInfoSection'
import { ItinerarySyncDialog } from './ItinerarySyncDialog'
import { COMP_TOURS_LABELS } from './constants/labels'

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
    // Sync dialog state
    syncDialogOpen,
    syncInfo,
    handleSync,
    closeSyncDialog,
  } = useTourEdit({ tour, isOpen, onClose, onSuccess })

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
    <>
      <Dialog open={isOpen && !syncDialogOpen} onOpenChange={open => {
        // 只有在 syncDialogOpen 為 false 時，才允許關閉
        // 避免切換到 sync dialog 時誤觸 onClose
        if (!open && !syncDialogOpen) {
          onClose()
        }
      }}>
        <DialogContent
          level={2}
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
            <DialogTitle>{COMP_TOURS_LABELS.EDIT_7182}</DialogTitle>
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
              {COMP_TOURS_LABELS.取消}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim() || !formData.departure_date || !formData.return_date}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {submitting ? COMP_TOURS_LABELS.儲存中 : COMP_TOURS_LABELS.儲存變更}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 行程表同步對話框 */}
      <ItinerarySyncDialog
        open={syncDialogOpen}
        syncInfo={syncInfo}
        onSync={handleSync}
        onClose={closeSyncDialog}
      />
    </>
  )
}
