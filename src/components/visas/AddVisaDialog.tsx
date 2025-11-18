'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import type { VisaApplicant, VisaContactInfo } from '@/hooks/use-visa-form'

interface AddVisaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactInfo: VisaContactInfo
  setContactInfo: React.Dispatch<React.SetStateAction<VisaContactInfo>>
  applicants: VisaApplicant[]
  updateApplicant: (id: string, field: keyof VisaApplicant, value: unknown) => void
  addApplicant: () => void
  removeApplicant: (id: string) => void
  tourOptions: ComboboxOption[]
  orderOptions: ComboboxOption[]
  calculateFee: (country: string) => number
  handleAddVisa: () => void
}

/**
 * 新增簽證對話框
 * 包含聯絡人資訊和批次辦理人列表
 */
export const AddVisaDialog: React.FC<AddVisaDialogProps> = ({
  open,
  onOpenChange,
  contactInfo,
  setContactInfo,
  applicants,
  updateApplicant,
  addApplicant,
  removeApplicant,
  tourOptions,
  orderOptions,
  calculateFee,
  handleAddVisa,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增簽證</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 上半部：聯絡人資訊 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">選擇團號</label>
                {/* @ts-ignore - Combobox props compatibility */}
                <Combobox
                  value={contactInfo.tour_id}
                  onChange={value => {
                    setContactInfo((prev: typeof contactInfo) => ({ ...prev, tour_id: value, order_id: '' }))
                  }}
                  options={tourOptions}
                  placeholder="請輸入或選擇團號（例如：0810）"
                  className="mt-1"
                  showSearchIcon
                  showClearButton
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">
                  選擇訂單{' '}
                  <span className="text-xs text-morandi-secondary">(選填，未選擇將自動建立)</span>
                </label>
                {/* @ts-ignore - Combobox props compatibility */}
                <Combobox
                  value={contactInfo.order_id}
                  onChange={value => setContactInfo((prev: typeof contactInfo) => ({ ...prev, order_id: value }))}
                  options={orderOptions}
                  placeholder={contactInfo.tour_id ? '請選擇訂單或留空自動建立' : '請先選擇團號'}
                  className="mt-1"
                  disabled={!contactInfo.tour_id}
                  showSearchIcon
                  showClearButton
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
                <Input
                  value={contactInfo.contact_person}
                  onChange={e =>
                    setContactInfo((prev: typeof contactInfo) => ({ ...prev, contact_person: e.target.value }))
                  }
                  className="mt-1"
                  placeholder="請輸入聯絡人"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">申請人</label>
                <Input
                  value={contactInfo.applicant_name}
                  onChange={e =>
                    setContactInfo((prev: typeof contactInfo) => ({ ...prev, applicant_name: e.target.value }))
                  }
                  className="mt-1"
                  placeholder="請輸入申請人姓名"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
                <Input
                  value={contactInfo.contact_phone}
                  onChange={e =>
                    setContactInfo((prev: typeof contactInfo) => ({ ...prev, contact_phone: e.target.value }))
                  }
                  className="mt-1"
                  placeholder="請輸入聯絡電話"
                />
              </div>
            </div>
          </div>

          {/* 分割線 */}
          <div className="border-t border-border"></div>

          {/* 下半部：批次辦理人列表 */}
          <div className="space-y-2">
            {applicants.map((applicant, index) => (
              <div key={applicant.id} className="flex gap-2 items-center">
                <Input
                  value={applicant.name}
                  onChange={e => updateApplicant(applicant.id, 'name', e.target.value)}
                  placeholder={index === 0 ? '辦理人（自動帶入）' : '辦理人'}
                  className="flex-[1.5]"
                />

                <select
                  value={applicant.country}
                  onChange={e => updateApplicant(applicant.id, 'country', e.target.value)}
                  className="flex-[2] p-2 border border-border rounded-md bg-background h-10"
                >
                  <option value="護照 成人">護照 成人</option>
                  <option value="護照 兒童">護照 兒童</option>
                  <option value="護照 成人 遺失件">護照 成人 遺失件</option>
                  <option value="護照 兒童 遺失件">護照 兒童 遺失件</option>
                  <option value="台胞證">台胞證</option>
                  <option value="台胞證 遺失件">台胞證 遺失件</option>
                  <option value="台胞證 首辦">台胞證 首辦</option>
                </select>

                <Input
                  type="date"
                  value={applicant.submission_date}
                  onChange={e => updateApplicant(applicant.id, 'submission_date', e.target.value)}
                  className="flex-1"
                />

                <Input
                  type="date"
                  value={applicant.received_date}
                  readOnly
                  className="flex-1 bg-muted"
                />

                <Input
                  type="number"
                  value={calculateFee(applicant.country)}
                  readOnly
                  className="w-20 bg-muted"
                />

                <Input
                  type="number"
                  value={applicant.cost}
                  onChange={e => updateApplicant(applicant.id, 'cost', Number(e.target.value))}
                  placeholder="成本"
                  className="w-20"
                />

                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={applicant.is_urgent}
                    onChange={e => updateApplicant(applicant.id, 'is_urgent', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm whitespace-nowrap">急件</span>
                </div>

                <Button
                  type="button"
                  onClick={
                    index === applicants.length - 1
                      ? addApplicant
                      : () => removeApplicant(applicant.id)
                  }
                  size="sm"
                  className={
                    index === applicants.length - 1
                      ? 'h-8 w-8 p-0 flex-shrink-0 bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                      : 'h-8 w-8 p-0 flex-shrink-0 text-morandi-red hover:bg-red-50'
                  }
                  variant={index === applicants.length - 1 ? 'default' : 'ghost'}
                >
                  {index === applicants.length - 1 ? '+' : '✕'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleAddVisa}
            disabled={!contactInfo.applicant_name || applicants.every(a => !a.name)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            批次新增簽證
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
