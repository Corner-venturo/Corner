'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, AlertTriangle, FileImage } from 'lucide-react'
import type { Visa } from '@/stores/types'
import type { MatchedItem } from '../hooks/useBatchPickup'

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
              ? 'border-green-300 bg-green-50/50'
              : 'border-amber-300 bg-amber-50/50'
          }`}
        >
          <div className="flex gap-4">
            {/* 左側：護照圖片預覽 */}
            <div className="flex-shrink-0 w-32">
              {item.ocrResult.imageBase64 ? (
                <img
                  src={item.ocrResult.imageBase64}
                  alt="護照"
                  className="w-full h-24 object-cover rounded border"
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
                  <FileImage size={24} className="text-gray-400" />
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
                      {item.ocrResult.customer.name || '(無法辨識姓名)'}
                    </div>
                    <div className="text-xs text-morandi-secondary">
                      {item.ocrResult.customer.passport_romanization}
                      {item.ocrResult.customer.passport_number && (
                        <span className="ml-2">護照: {item.ocrResult.customer.passport_number}</span>
                      )}
                    </div>
                  </div>

                  {/* 配對狀態 */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.matchedVisa ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Check size={14} />
                        自動配對成功
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle size={14} />
                        請手動選擇
                      </span>
                    )}
                  </div>

                  {/* 簽證選擇下拉 */}
                  <Select
                    value={item.manualVisaId || ''}
                    onValueChange={value => onManualSelect(index, value || null)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="-- 選擇簽證 --" />
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
                            {isSelected && ' (已選)'}
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
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-morandi-secondary">
                        同時更新顧客護照資訊
                      </span>
                    </label>
                  )}
                </>
              ) : (
                <div className="text-sm text-red-600">
                  <AlertTriangle size={16} className="inline mr-1" />
                  辨識失敗：{item.ocrResult.error || '無法解析護照資訊'}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
