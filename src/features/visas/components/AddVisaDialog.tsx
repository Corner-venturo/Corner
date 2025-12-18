'use client'

import { logger } from '@/lib/utils/logger'
import React from 'react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VisaApplicant {
  id: string
  name: string
  country: string
  is_urgent: boolean
  received_date: string // 收件時間
  expected_issue_date: string // 預計下件時間
  fee?: number // 代辦費（可手動修改）
  cost: number
  isAdditional?: boolean // 是否為追加列（同一人的其他簽證）
  parentId?: string // 追加列的父申請人 ID
}

interface ContactInfo {
  tour_id: string
  order_id: string
  contact_person: string
  contact_phone: string
}

interface TourOption {
  value: string
  label: string
}

interface OrderData {
  id: string
  order_number: string
  contact_person: string
  tour_id: string
  created_at: string
}

interface AddVisaDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => Promise<void>
  contact_info: ContactInfo
  setContactInfo: React.Dispatch<React.SetStateAction<ContactInfo>>
  applicants: VisaApplicant[]
  tourOptions: TourOption[]
  calculateFee: (country: string) => number
  addApplicant: () => void
  addApplicantForSame: (parentId: string, parentName: string) => void  // 追加同一人的其他簽證
  removeApplicant: (id: string) => void
  updateApplicant: (id: string, field: keyof VisaApplicant, value: unknown) => void
  canSubmit: boolean
  isSubmitting: boolean
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
  addApplicantForSame,
  removeApplicant,
  updateApplicant,
  canSubmit,
  isSubmitting,
}: AddVisaDialogProps) {
  const [tourOrders, setTourOrders] = React.useState<OrderData[]>([])
  const [hasInitialized, setHasInitialized] = React.useState(false)

  // ✅ 當對話框打開時，載入團號資料並自動選擇簽證專用團
  React.useEffect(() => {
    if (open && !hasInitialized) {
      const init = async () => {
        try {
          const { tourService } = await import('@/features/tours/services/tour.service')
          const { useTourStore } = await import('@/stores')

          // 1. 先載入團號資料
          const tourStore = useTourStore.getState()
          if (tourStore.items.length === 0) {
            await tourStore.fetchAll()
          }

          // 2. 取得或建立簽證專用團
          const visaTour = await tourService.getOrCreateVisaTour()
          if (visaTour && !contact_info.tour_id) {
            setContactInfo((prev) => ({ ...prev, tour_id: visaTour.id }))
            setHasInitialized(true)
          }
        } catch (error: unknown) {
          logger.error('Failed to initialize visa dialog:', error)
        }
      }
      void init()
    }

    // 對話框關閉時重置初始化狀態
    if (!open) {
      setHasInitialized(false)
    }
  }, [open, hasInitialized, contact_info.tour_id, setContactInfo])

  // ✅ 當團號改變時，載入該團的訂單
  React.useEffect(() => {
    if (contact_info.tour_id) {
      const fetchTourOrders = async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('tour_id', contact_info.tour_id)
            .order('created_at', { ascending: false })

          if (!error && data) {
            setTourOrders(data as OrderData[])
          } else {
            setTourOrders([])
          }
        } catch (error: unknown) {
          logger.error('Failed to fetch tour orders:', error)
          setTourOrders([])
        }
      }
      fetchTourOrders()
    } else {
      setTourOrders([])
    }
  }, [contact_info.tour_id])

  // 訂單選項（使用當前團號的訂單 + 新增選項）
  const orderOptions = React.useMemo(() => {
    const options = tourOrders.map(order => ({
      value: order.id,
      label: `${order.order_number} - ${order.contact_person}`,
    }))
    // 加入「新增訂單」選項
    if (contact_info.tour_id) {
      options.push({
        value: '__create_new__',
        label: '+ 新增訂單',
      })
    }
    return options
  }, [tourOrders, contact_info.tour_id])

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title="新增簽證"
      onSubmit={onSubmit}
      onCancel={onClose}
      submitLabel="批次新增簽證"
      submitDisabled={!canSubmit}
      loading={isSubmitting}
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
                setContactInfo((prev) => ({ ...prev, tour_id: value, order_id: '' }))
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
              onChange={value => setContactInfo((prev) => ({ ...prev, order_id: value }))}
              options={orderOptions}
              placeholder={contact_info.tour_id ? '請選擇訂單或留空自動建立' : '請先選擇團號'}
              className="mt-1"
              disabled={!contact_info.tour_id}
              showSearchIcon
              showClearButton
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
            <Input
              value={contact_info.contact_person}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setContactInfo((prev) => ({ ...prev, contact_person: e.target.value }))
              }
              className="mt-1"
              placeholder="請輸入聯絡人"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={contact_info.contact_phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setContactInfo((prev) => ({ ...prev, contact_phone: e.target.value }))
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
        {/* 表頭 */}
        <div className="flex gap-2 items-center text-xs text-morandi-secondary font-medium px-1">
          <div className="w-28">申請人</div>
          <div className="w-28">簽證類型</div>
          <div className="w-12 text-center">急件</div>
          <div className="w-32">收件日期</div>
          <div className="w-32">回件日期</div>
          <div className="w-20">辦理費用</div>
          <div className="w-16">急件費用</div>
          <div className="w-20">應收費用</div>
          <div className="w-24"></div>
        </div>

        {applicants.map((applicant, index) => {
          const baseFee = applicant.fee ?? calculateFee(applicant.country)
          const urgentFee = applicant.is_urgent ? 1000 : 0
          const totalFee = applicant.isAdditional ? null : baseFee + urgentFee

          return (
            <div key={applicant.id} className="flex gap-2 items-center">
              {/* 申請人：追加列顯示「-」 */}
              {applicant.isAdditional ? (
                <div className="w-28 h-10 px-3 flex items-center text-morandi-secondary">
                  -
                </div>
              ) : (
                <Input
                  value={applicant.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateApplicant(applicant.id, 'name', e.target.value)}
                  placeholder="申請人"
                  className="w-28"
                />
              )}

              {/* 簽證類型 */}
              <Select
                value={applicant.country}
                onValueChange={(value) => updateApplicant(applicant.id, 'country', value)}
              >
                <SelectTrigger className="w-28 h-10 text-sm">
                  <SelectValue placeholder="類型" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-morandi-secondary">護照</div>
                  <SelectItem value="護照 成人">護照 成人</SelectItem>
                  <SelectItem value="護照 兒童">護照 兒童</SelectItem>
                  <SelectItem value="護照 成人 遺失件">護照 成人 遺失件</SelectItem>
                  <SelectItem value="護照 兒童 遺失件">護照 兒童 遺失件</SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-morandi-secondary border-t mt-1">台胞證</div>
                  <SelectItem value="台胞證">台胞證</SelectItem>
                  <SelectItem value="台胞證 遺失件">台胞證 遺失件</SelectItem>
                  <SelectItem value="台胞證 首辦">台胞證 首辦</SelectItem>
                  <div className="px-2 py-1.5 text-xs font-semibold text-morandi-secondary border-t mt-1">美國簽證</div>
                  <SelectItem value="美國 ESTA">美國 ESTA</SelectItem>
                </SelectContent>
              </Select>

              {/* 急件 checkbox */}
              <div className="w-12 flex justify-center">
                <input
                  type="checkbox"
                  checked={applicant.is_urgent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateApplicant(applicant.id, 'is_urgent', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>

              {/* 收件日期 */}
              <DatePicker
                value={applicant.received_date}
                onChange={(date) => updateApplicant(applicant.id, 'received_date', date)}
                className="w-32"
                placeholder="收件日期"
              />

              {/* 回件日期 */}
              <DatePicker
                value={applicant.expected_issue_date}
                onChange={(date) => updateApplicant(applicant.id, 'expected_issue_date', date)}
                className="w-32"
                placeholder="回件日期"
              />

              {/* 辦理費用 */}
              <Input
                type="number"
                value={baseFee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateApplicant(applicant.id, 'fee', Number(e.target.value))}
                className="w-20 text-sm"
              />

              {/* 急件費用 */}
              <div className="w-16 h-10 px-2 flex items-center justify-center text-sm text-morandi-secondary">
                {urgentFee > 0 ? urgentFee.toLocaleString() : '0'}
              </div>

              {/* 應收費用：追加列顯示「-」 */}
              <div className="w-20 h-10 px-2 flex items-center justify-center text-sm font-medium">
                {totalFee !== null ? totalFee.toLocaleString() : '-'}
              </div>

              {/* 按鈕區：追加 / 刪除 */}
              <div className="flex gap-1 flex-shrink-0 w-24 justify-end">
                {/* 追加按鈕：只在主列顯示 */}
                {!applicant.isAdditional && (
                  <Button
                    type="button"
                    onClick={() => addApplicantForSame(applicant.id, applicant.name)}
                    size="sm"
                    className="h-8 w-8 p-0 text-morandi-green hover:bg-morandi-green/10"
                    variant="ghost"
                    title="追加同一人的其他簽證"
                  >
                    +
                  </Button>
                )}

                {/* 新增按鈕：只在最後一列且非追加列顯示 */}
                {index === applicants.length - 1 && !applicant.isAdditional && (
                  <Button
                    type="button"
                    onClick={addApplicant}
                    size="sm"
                    className="h-8 w-8 p-0 text-morandi-gold hover:bg-morandi-gold/10"
                    variant="ghost"
                    title="新增辦理人"
                  >
                    +
                  </Button>
                )}

                {/* 刪除按鈕 */}
                <Button
                  type="button"
                  onClick={() => removeApplicant(applicant.id)}
                  size="sm"
                  className="h-8 w-8 p-0 text-morandi-red hover:bg-red-50"
                  variant="ghost"
                  title="刪除"
                >
                  ✕
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </FormDialog>
  )
}
