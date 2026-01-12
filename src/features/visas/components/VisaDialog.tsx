'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTours, invalidateTours, useVendorCosts, createVisa, updateVisa } from '@/data'
import { logger } from '@/lib/utils/logger'
import type { Visa } from '@/stores/types'

interface VisaDialogProps {
  open: boolean
  onClose: () => void
  visa?: Visa | null // null/undefined = add mode, visa object = edit mode
  onSuccess?: () => void
}

interface VisaFormData {
  applicant_name: string
  contact_person: string
  contact_phone: string
  visa_type: string
  country: string
  status: string
  received_date: string
  expected_issue_date: string
  actual_submission_date: string
  documents_returned_date: string
  pickup_date: string
  vendor: string
  fee: number
  cost: number
  note: string
  tour_id: string
  order_id: string
}

const initialFormData: VisaFormData = {
  applicant_name: '',
  contact_person: '',
  contact_phone: '',
  visa_type: '',
  country: '',
  status: 'pending',
  received_date: '',
  expected_issue_date: '',
  actual_submission_date: '',
  documents_returned_date: '',
  pickup_date: '',
  vendor: '',
  fee: 0,
  cost: 0,
  note: '',
  tour_id: '',
  order_id: '',
}

// 簽證類型費用對照表
const VISA_FEE_MAP: Record<string, number> = {
  '護照 成人': 1800,
  '護照 兒童': 1100,
  '護照 成人 遺失件': 2500,
  '護照 兒童 遺失件': 1600,
  '台胞證': 1800,
  '台胞證 遺失件': 2500,
  '台胞證 首辦': 2000,
  '美國 ESTA': 800,
}

export function VisaDialog({ open, onClose, visa, onSuccess }: VisaDialogProps) {
  const isEditMode = !!visa
  const [formData, setFormData] = React.useState<VisaFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [tourOrders, setTourOrders] = React.useState<{ id: string; order_number: string | null; contact_person: string }[]>([])

  const { items: vendorCosts } = useVendorCosts()
  const { items: tours } = useTours()

  // 取得所有代辦商名稱
  const vendorList = React.useMemo(() => {
    return [...new Set(vendorCosts.map(vc => vc.vendor_name))]
  }, [vendorCosts])

  // 團號選項
  const tourOptions = React.useMemo(() => {
    return tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [tours])

  // 當 visa 或 dialog 狀態改變時，重置表單
  React.useEffect(() => {
    if (open) {
      if (visa) {
        // Edit mode: load visa data
        setFormData({
          applicant_name: visa.applicant_name || '',
          contact_person: visa.contact_person || '',
          contact_phone: visa.contact_phone || '',
          visa_type: visa.visa_type || '',
          country: visa.country || '',
          status: visa.status || 'pending',
          received_date: visa.received_date || '',
          expected_issue_date: visa.expected_issue_date || '',
          actual_submission_date: visa.actual_submission_date || '',
          documents_returned_date: visa.documents_returned_date || '',
          pickup_date: visa.pickup_date || '',
          vendor: visa.vendor || '',
          fee: visa.fee || 0,
          cost: visa.cost || 0,
          note: visa.note || '',
          tour_id: visa.tour_id || '',
          order_id: visa.order_id || '',
        })
      } else {
        // Add mode: reset form and auto-select visa tour
        setFormData(initialFormData)
        initializeForAddMode()
      }
    }
  }, [visa, open])

  // 初始化新增模式
  const initializeForAddMode = async () => {
    try {
      const { tourService } = await import('@/features/tours/services/tour.service')
      const visaTour = await tourService.getOrCreateVisaTour()
      if (visaTour) {
        setFormData(prev => ({ ...prev, tour_id: visaTour.id }))
      }
    } catch (error) {
      logger.error('Failed to initialize visa dialog:', error)
    }
  }

  // 當團號改變時，載入該團的訂單
  React.useEffect(() => {
    if (formData.tour_id) {
      const fetchTourOrders = async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, contact_person')
            .eq('tour_id', formData.tour_id)
            .order('created_at', { ascending: false })

          if (!error && data) {
            setTourOrders(data)
          } else {
            setTourOrders([])
          }
        } catch (error) {
          logger.error('Failed to fetch tour orders:', error)
          setTourOrders([])
        }
      }
      fetchTourOrders()
    } else {
      setTourOrders([])
    }
  }, [formData.tour_id])

  // 訂單選項
  const orderOptions = React.useMemo(() => {
    const options = tourOrders.map(order => ({
      value: order.id,
      label: `${order.order_number || '(無編號)'} - ${order.contact_person}`,
    }))
    if (formData.tour_id) {
      options.push({
        value: '__create_new__',
        label: '+ 新增訂單',
      })
    }
    return options
  }, [tourOrders, formData.tour_id])

  const updateField = <K extends keyof VisaFormData>(field: K, value: VisaFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 當簽證類型改變時，自動設定費用
  const handleVisaTypeChange = (value: string) => {
    updateField('visa_type', value)
    updateField('country', value)
    // 自動設定費用
    const fee = VISA_FEE_MAP[value] || 0
    updateField('fee', fee)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // 將空字串轉換為 null（僅限日期欄位）
      const dateFields = ['received_date', 'expected_issue_date', 'actual_submission_date', 'documents_returned_date', 'pickup_date']
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          dateFields.includes(key) && value === '' ? null : value,
        ])
      ) as Partial<Visa>

      if (isEditMode && visa) {
        await updateVisa(visa.id, cleanedData)
      } else {
        await createVisa(cleanedData as Omit<Visa, 'id' | 'created_at' | 'updated_at'>)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      logger.error(isEditMode ? '更新簽證失敗:' : '新增簽證失敗:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = formData.applicant_name && formData.visa_type

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={isEditMode ? '編輯簽證' : '新增簽證'}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel={isEditMode ? '儲存' : '新增'}
      submitDisabled={!canSubmit}
      loading={isSubmitting}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* 關聯資訊（新增模式顯示） */}
        {!isEditMode && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">選擇團號</label>
              <Combobox
                value={formData.tour_id}
                onChange={value => {
                  updateField('tour_id', value)
                  updateField('order_id', '')
                }}
                options={tourOptions}
                placeholder="請輸入或選擇團號"
                className="mt-1"
                showSearchIcon
                showClearButton
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">
                選擇訂單{' '}
                <span className="text-xs text-morandi-secondary">(選填)</span>
              </label>
              <Combobox
                value={formData.order_id}
                onChange={value => updateField('order_id', value)}
                options={orderOptions}
                placeholder={formData.tour_id ? '請選擇訂單或留空' : '請先選擇團號'}
                className="mt-1"
                disabled={!formData.tour_id}
                showSearchIcon
                showClearButton
              />
            </div>
          </div>
        )}

        {/* 申請人資訊 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">申請人 *</label>
            <Input
              value={formData.applicant_name}
              onChange={e => updateField('applicant_name', e.target.value)}
              className="mt-1"
              placeholder="請輸入申請人姓名"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
            <Input
              value={formData.contact_person}
              onChange={e => updateField('contact_person', e.target.value)}
              className="mt-1"
              placeholder="請輸入聯絡人"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={formData.contact_phone}
              onChange={e => updateField('contact_phone', e.target.value)}
              className="mt-1"
              placeholder="請輸入聯絡電話"
            />
          </div>
        </div>

        {/* 簽證資訊 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">簽證類型 *</label>
            <Select
              value={formData.visa_type}
              onValueChange={handleVisaTypeChange}
            >
              <SelectTrigger className="w-full mt-1 h-10">
                <SelectValue placeholder="選擇簽證類型" />
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
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">狀態</label>
            <Select
              value={formData.status}
              onValueChange={value => updateField('status', value)}
            >
              <SelectTrigger className="w-full mt-1 h-10">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待送件</SelectItem>
                <SelectItem value="submitted">已送件</SelectItem>
                <SelectItem value="collected">已取件</SelectItem>
                <SelectItem value="returned">已歸還</SelectItem>
                <SelectItem value="rejected">退件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 日期資訊 */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">日期資訊</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-morandi-primary">收件時間</label>
              <DatePicker
                value={formData.received_date}
                onChange={date => updateField('received_date', date || '')}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">預計下件</label>
              <DatePicker
                value={formData.expected_issue_date}
                onChange={date => updateField('expected_issue_date', date || '')}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">送件時間</label>
              <DatePicker
                value={formData.actual_submission_date}
                onChange={date => updateField('actual_submission_date', date || '')}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">證件歸還</label>
              <DatePicker
                value={formData.documents_returned_date}
                onChange={date => updateField('documents_returned_date', date || '')}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">取件時間</label>
              <DatePicker
                value={formData.pickup_date}
                onChange={date => updateField('pickup_date', date || '')}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
          </div>
        </div>

        {/* 送件單位與費用 */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">費用資訊</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-morandi-primary">送件單位</label>
              <Input
                value={formData.vendor}
                onChange={e => updateField('vendor', e.target.value)}
                className="mt-1"
                list="vendor-list"
                placeholder="輸入或選擇"
              />
              <datalist id="vendor-list">
                {vendorList.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">代辦費</label>
              <Input
                type="number"
                value={formData.fee}
                onChange={e => updateField('fee', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">成本</label>
              <Input
                type="number"
                value={formData.cost}
                onChange={e => updateField('cost', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">備註</label>
          <textarea
            value={formData.note}
            onChange={e => updateField('note', e.target.value)}
            className="w-full mt-1 p-2 border border-border rounded-md bg-card text-sm min-h-[80px]"
            placeholder="輸入備註..."
          />
        </div>
      </div>
    </FormDialog>
  )
}
