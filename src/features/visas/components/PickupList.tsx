'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, AlertTriangle, FileImage } from 'lucide-react'
import type { Visa } from '@/stores/types'
import type { MatchedItem } from '../hooks/useBatchPickup'
import { PICKUP_LIST_LABELS as L } from '../constants/labels'

interface PickupListProps {
  matchedItems: MatchedItem[]
  pendingVisas: Visa[]
  selectedVisaIds: string[]
  onManualSelect: (index: number, visaId: string | null) => void
  onToggleUpdateCustomer: (index: number) => void
}

export function PickupList({
  matchedItems,
  pendingVisas,
  selectedVisaIds,
  onManualSelect,
  onToggleUpdateCustomer,
}: PickupListProps) {
  return (
    <div className="space-y-3">
      {matchedItems.map((item, index) => (
        <div
          key={index}
          className={`p-4 border rounded-lg ${
            item.manualVisaId
              ? 'border-morandi-green/30 bg-status-success-bg/50'
              : 'border-status-warning/30 bg-status-warning-bg'
          }`}
        >
          <div className="flex gap-4">
            {/* 左側：護照圖片預覽 */}
            <div className="flex-shrink-0 w-32">
              {item.ocrResult.imageBase64 ? (
                <img
                  src={item.ocrResult.imageBase64}
                  alt={L.alt_passport}
                  className="w-full h-24 object-cover rounded border"
                />
              ) : (
                <div className="w-full h-24 bg-muted rounded border flex items-center justify-center">
                  <FileImage size={24} className="text-morandi-muted" />
                </div>
              )}
              <p className="text-xs text-morandi-secondary mt-1 truncate">
                {item.ocrResult.fileName}
              </p>
            </div>

            {/* 右側：OCR 結果與配對 */}
            <div className="flex-1 min-w-0">
              {item.ocrResult.success && item.ocrResult.customer ? (
                <>
                  {/* OCR 辨識結果 */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-morandi-primary">
                      {item.ocrResult.customer.name || L.no_name}
                    </div>
                    <div className="text-xs text-morandi-secondary">
                      {item.ocrResult.customer.passport_name}
                      {item.ocrResult.customer.passport_number && (
                        <span className="ml-2">{L.passport_label} {item.ocrResult.customer.passport_number}</span>
                      )}
                    </div>
                  </div>

                  {/* 配對狀態 */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.matchedVisa ? (
                      <span className="flex items-center gap-1 text-xs text-status-success">
                        <Check size={14} />
                        {L.auto_matched}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-status-warning">
                        <AlertTriangle size={14} />
                        {L.manual_select}
                      </span>
                    )}
                  </div>

                  {/* 簽證選擇下拉 */}
                  <Select
                    value={item.manualVisaId || ''}
                    onValueChange={value => onManualSelect(index, value || null)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder={L.placeholder_select} />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingVisas.map(visa => {
                        const isSelected = selectedVisaIds.includes(visa.id) && visa.id !== item.manualVisaId
                        return (
                          <SelectItem
                            key={visa.id}
                            value={visa.id}
                            disabled={isSelected}
                          >
                            {visa.applicant_name} - {visa.country}
                            {visa.order_number && ` (${visa.order_number})`}
                            {isSelected && ` ${L.already_selected}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* 更新顧客資訊選項 */}
                  {item.manualVisaId && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.updateCustomer}
                        onChange={() => onToggleUpdateCustomer(index)}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-morandi-secondary">
                        {L.update_customer}
                      </span>
                    </label>
                  )}
                </>
              ) : (
                <div className="text-sm text-status-danger">
                  <AlertTriangle size={16} className="inline mr-1" />
                  {L.ocr_failed_prefix}{item.ocrResult.error || L.ocr_failed_default}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
