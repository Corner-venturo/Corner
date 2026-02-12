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
} from './tour-form'
import { TOUR_FORM } from '../constants'

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
  // 使用自定義 hook 處理航班查詢邏輯
  const {
    loadingOutbound,
    loadingReturn,
    handleSearchOutbound,
    handleSearchReturn,
  } = useTourForm({
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
        level={1}
        className={`${mode === 'edit' ? 'max-w-3xl' : 'max-w-6xl'} w-[90vw] h-[80vh] overflow-hidden`}
        aria-describedby={undefined}
        onInteractOutside={e => {
          const target = e.target as HTMLElement
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
        onPointerDownOutside={e => {
          const target = e.target as HTMLElement
          // 允許點擊下拉選單（Combobox、Select 等）
          if (target.closest('[role="listbox"]') || target.closest('select')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? TOUR_FORM.title_edit
              : isFromProposal
                ? TOUR_FORM.title_convert
                : TOUR_FORM.title_create}
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
              <h3 className="text-lg font-medium text-morandi-primary mb-4">{TOUR_FORM.section_info}</h3>
              <div className="space-y-4">
                <TourBasicInfo
                  newTour={newTour}
                  setNewTour={setNewTour}
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
            {TOUR_FORM.cancel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting ||
              !newTour.name.trim() ||
              !newTour.departure_date ||
              !newTour.return_date ||
              // 如果有填聯絡人（要建訂單），業務必填
              (!!newOrder.contact_person?.trim() && !newOrder.sales_person?.trim())
            }
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {mode === 'edit'
              ? (submitting ? TOUR_FORM.submit_saving : TOUR_FORM.submit_save)
              : isFromProposal
                ? (submitting
                    ? TOUR_FORM.submit_converting
                    : newOrder.contact_person
                      ? TOUR_FORM.submit_convert_with_order
                      : TOUR_FORM.submit_convert)
                : (submitting
                    ? TOUR_FORM.submit_creating
                    : newOrder.contact_person
                      ? TOUR_FORM.submit_create_with_order
                      : TOUR_FORM.submit_create)}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
