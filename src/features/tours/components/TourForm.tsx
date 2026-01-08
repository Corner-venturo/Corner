'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, X } from 'lucide-react'
import { NewTourData } from '../types'
import type { OrderFormData } from '@/components/orders/add-order-form'
import { useTourForm } from '../hooks/useTourForm'
import {
  TourBasicInfo,
  TourFlightInfo,
  TourSettings,
  TourOrderSection,
  AddDestinationDialog,
} from './tour-form'

interface TourFormProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
  newOrder: Partial<OrderFormData>
  setNewOrder: React.Dispatch<React.SetStateAction<Partial<OrderFormData>>>
  submitting: boolean
  formError: string | null
  onSubmit: () => void
  /** 是否為從提案轉開團（會顯示不同標題） */
  isFromProposal?: boolean
}

export function TourForm({
  isOpen,
  onClose,
  mode,
  newTour,
  setNewTour,
  newOrder,
  setNewOrder,
  submitting,
  formError,
  onSubmit,
  isFromProposal,
}: TourFormProps) {
  // 使用自定義 hook 處理所有表單邏輯
  const {
    countries,
    destinationsLoading,
    getCitiesByCountry,
    loadingOutbound,
    loadingReturn,
    showAirportCodeDialog,
    setShowAirportCodeDialog,
    newAirportCode,
    setNewAirportCode,
    pendingCity,
    setPendingCity,
    pendingCountry,
    savingDestination,
    handleSearchOutbound,
    handleSearchReturn,
    handleAddDestination,
    openAddDestinationDialog,
  } = useTourForm({
    isOpen,
    mode,
    newTour,
    setNewTour,
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className={`${mode === 'edit' ? 'max-w-3xl' : 'max-w-6xl'} w-[90vw] h-[80vh] overflow-hidden`}
        aria-describedby={undefined}
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? '編輯旅遊團'
              : isFromProposal
                ? '提案轉開團'
                : '新增旅遊團 & 訂單'}
          </DialogTitle>
        </DialogHeader>

        {/* Error message */}
        {formError && (
          <div className="bg-status-danger-bg border border-status-danger text-status-danger px-4 py-3 rounded-md mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="text-sm">{formError}</div>
            </div>
          </div>
        )}

        <div className="flex h-full overflow-hidden">
          {/* Left side - Tour info */}
          <div className={`flex-1 ${mode === 'create' ? 'pr-6 border-r border-border' : ''}`}>
            <div className="h-full overflow-y-auto">
              <h3 className="text-lg font-medium text-morandi-primary mb-4">旅遊團資訊</h3>
              <div className="space-y-4">
                <TourBasicInfo
                  newTour={newTour}
                  setNewTour={setNewTour}
                  countries={countries}
                  destinationsLoading={destinationsLoading}
                  getCitiesByCountry={getCitiesByCountry}
                  openAddDestinationDialog={openAddDestinationDialog}
                />

                <TourFlightInfo
                  newTour={newTour}
                  setNewTour={setNewTour}
                  loadingOutbound={loadingOutbound}
                  loadingReturn={loadingReturn}
                  handleSearchOutbound={handleSearchOutbound}
                  handleSearchReturn={handleSearchReturn}
                />

                <TourSettings newTour={newTour} setNewTour={setNewTour} />
              </div>
            </div>
          </div>

          {/* Right side - Order info (只在新增模式顯示) */}
          {mode === 'create' && (
            <div className="flex-1 pl-6">
              <div className="h-full overflow-y-auto">
                <TourOrderSection newOrder={newOrder} setNewOrder={setNewOrder} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="flex justify-end space-x-2 pt-6 border-t border-border mt-6">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting || !newTour.name.trim() || !newTour.departure_date || !newTour.return_date
            }
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {mode === 'edit'
              ? (submitting ? '儲存中...' : '儲存變更')
              : isFromProposal
                ? (submitting
                    ? '轉開團中...'
                    : newOrder.contact_person
                      ? '確認轉開團並建立訂單'
                      : '確認轉開團')
                : (submitting
                    ? '建立中...'
                    : newOrder.contact_person
                      ? '新增旅遊團 & 訂單'
                      : '新增旅遊團')}
          </Button>
        </div>

        {/* 新增城市機場代碼對話框 */}
        <AddDestinationDialog
          open={showAirportCodeDialog}
          onOpenChange={setShowAirportCodeDialog}
          pendingCountry={pendingCountry}
          pendingCity={pendingCity}
          setPendingCity={setPendingCity}
          newAirportCode={newAirportCode}
          setNewAirportCode={setNewAirportCode}
          savingDestination={savingDestination}
          handleAddDestination={handleAddDestination}
        />
      </DialogContent>
    </Dialog>
  )
}
