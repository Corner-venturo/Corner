'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { useOrderStore } from '@/stores'

interface VisaApplicant {
  id: string
  name: string
  country: string
  is_urgent: boolean
  submission_date: string
  received_date: string
  cost: number
}

interface AddVisaDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => Promise<void>
  contact_info: {
    tour_id: string
    order_id: string
    applicant_name: string
    contact_person: string
    contact_phone: string
  }
  setContactInfo: React.Dispatch<React.SetStateAction<any>>
  applicants: VisaApplicant[]
  tourOptions: any[]
  calculateFee: (country: string) => number
  addApplicant: () => void
  removeApplicant: (id: string) => void
  updateApplicant: (id: string, field: keyof VisaApplicant, value: unknown) => void
  canSubmit: boolean
}

export function AddVisaDialog({
  open,
  onClose,
  onSubmit,
  contact_info,
  setContactInfo,
  applicants,
  tourOptions,
  calculateFee,
  addApplicant,
  removeApplicant,
  updateApplicant,
  canSubmit,
}: AddVisaDialogProps) {
  // 訂單選項（根據選擇的團號過濾）
  const orderOptions = React.useMemo(() => {
    if (!contact_info.tour_id) return []
    const { items: orders } = useOrderStore.getState()
    return orders
      .filter(order => order.tour_id === contact_info.tour_id)
      .map(order => ({
        value: order.id,
        label: `${order.order_number} - ${order.contact_person}`,
      }))
  }, [contact_info.tour_id])

  // 第一個辦理人自動帶入申請人姓名
  useEffect(() => {
    if (applicants.length > 0 && contact_info.applicant_name !== applicants[0].name) {
      updateApplicant(applicants[0].id, 'name', contact_info.applicant_name)
    }
  }, [contact_info.applicant_name, applicants, updateApplicant])

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title="新增簽證"
      onSubmit={onSubmit}
      onCancel={onClose}
      submitLabel="批次新增簽證"
      submitDisabled={!canSubmit}
      maxWidth="6xl"
      contentClassName="max-h-[75vh] overflow-y-auto"
    >
      {/* 上半部：聯絡人資訊 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">選擇團號</label>
            <Combobox
              value={contact_info.tour_id}
              onChange={value => {
                setContactInfo((prev: any) => ({ ...prev, tour_id: value, order_id: '' }))
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
            <Combobox
              value={contact_info.order_id}
              onChange={value => setContactInfo((prev: any) => ({ ...prev, order_id: value }))}
              options={orderOptions}
              placeholder={contact_info.tour_id ? '請選擇訂單或留空自動建立' : '請先選擇團號'}
              className="mt-1"
              disabled={!contact_info.tour_id}
              showSearchIcon
              showClearButton
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
            <Input
              value={contact_info.contact_person}
              onChange={e =>
                setContactInfo((prev: any) => ({ ...prev, contact_person: e.target.value }))
              }
              className="mt-1"
              placeholder="請輸入聯絡人"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">申請人</label>
            <Input
              value={contact_info.applicant_name}
              onChange={e =>
                setContactInfo((prev: any) => ({ ...prev, applicant_name: e.target.value }))
              }
              className="mt-1"
              placeholder="請輸入申請人姓名"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={contact_info.contact_phone}
              onChange={e =>
                setContactInfo((prev: any) => ({ ...prev, contact_phone: e.target.value }))
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
                index === applicants.length - 1 ? addApplicant : () => removeApplicant(applicant.id)
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
    </FormDialog>
  )
}
