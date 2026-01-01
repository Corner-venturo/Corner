'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVisaStore, useVendorCostStore } from '@/stores'
import { logger } from '@/lib/utils/logger'
import type { Visa } from '@/stores/types'
import { getVisaStatusLabel } from '@/constants/status-maps'

interface EditVisaDialogProps {
  open: boolean
  onClose: () => void
  visa: Visa | null
}

export function EditVisaDialog({ open, onClose, visa }: EditVisaDialogProps) {
  const [formData, setFormData] = React.useState<Partial<Visa>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const updateVisa = useVisaStore(state => state.update)
  const vendorCosts = useVendorCostStore(state => state.items)

  // 載入代辦商資料
  React.useEffect(() => {
    useVendorCostStore.getState().fetchAll()
  }, [])

  // 取得所有代辦商名稱
  const vendorList = React.useMemo(() => {
    return [...new Set(vendorCosts.map(vc => vc.vendor_name))]
  }, [vendorCosts])

  // 當 visa 改變時，重置表單
  React.useEffect(() => {
    if (visa && open) {
      setFormData({
        applicant_name: visa.applicant_name,
        contact_person: visa.contact_person,
        contact_phone: visa.contact_phone,
        visa_type: visa.visa_type,
        country: visa.country,
        status: visa.status,
        received_date: visa.received_date || '',
        expected_issue_date: visa.expected_issue_date || '',
        actual_submission_date: visa.actual_submission_date || '',
        documents_returned_date: visa.documents_returned_date || '',
        pickup_date: visa.pickup_date || '',
        vendor: visa.vendor || '',
        fee: visa.fee,
        cost: visa.cost,
        note: visa.note || '',
      })
    }
  }, [visa, open])

  const updateField = (field: keyof Visa, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!visa) {
      return
    }
    setIsSubmitting(true)

    try {
      // 將空字串轉換為 null（僅限日期欄位），文字欄位保持空字串
      const dateFields = ['received_date', 'expected_issue_date', 'actual_submission_date', 'documents_returned_date', 'pickup_date']
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          // 只有日期欄位才將空字串轉 null
          dateFields.includes(key) && value === '' ? null : value,
        ])
      )

      // 確保必填欄位不是 null
      if (cleanedData.contact_person === null) {
        cleanedData.contact_person = ''
      }
      if (cleanedData.contact_phone === null) {
        cleanedData.contact_phone = ''
      }

      await updateVisa(visa.id, cleanedData)
      onClose()
    } catch (error) {
      logger.error('更新簽證失敗:', error)
      // 錯誤已在 store 中設置，這裡不需要額外處理
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!visa) return null

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title="編輯簽證"
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel="儲存"
      loading={isSubmitting}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* 申請人資訊 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">申請人</label>
            <Input
              value={formData.applicant_name || ''}
              onChange={e => updateField('applicant_name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
            <Input
              value={formData.contact_person || ''}
              onChange={e => updateField('contact_person', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={formData.contact_phone || ''}
              onChange={e => updateField('contact_phone', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* 簽證資訊 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">簽證類型</label>
            <Select
              value={formData.visa_type || ''}
              onValueChange={value => {
                updateField('visa_type', value)
                updateField('country', value)
              }}
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
              value={formData.status || ''}
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
                value={formData.received_date || ''}
                onChange={(date) => updateField('received_date', date)}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">預計下件</label>
              <DatePicker
                value={formData.expected_issue_date || ''}
                onChange={(date) => updateField('expected_issue_date', date)}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">送件時間</label>
              <DatePicker
                value={formData.actual_submission_date || ''}
                onChange={(date) => updateField('actual_submission_date', date)}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">證件歸還</label>
              <DatePicker
                value={formData.documents_returned_date || ''}
                onChange={(date) => updateField('documents_returned_date', date)}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">取件時間</label>
              <DatePicker
                value={formData.pickup_date || ''}
                onChange={(date) => updateField('pickup_date', date)}
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
                value={formData.vendor || ''}
                onChange={e => updateField('vendor', e.target.value)}
                className="mt-1"
                list="vendor-list-edit"
                placeholder="輸入或選擇"
              />
              <datalist id="vendor-list-edit">
                {vendorList.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-morandi-primary">代辦費</label>
              <Input
                type="number"
                value={formData.fee || 0}
                onChange={e => updateField('fee', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-morandi-primary">成本</label>
              <Input
                type="number"
                value={formData.cost || 0}
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
            value={formData.note || ''}
            onChange={e => updateField('note', e.target.value)}
            className="w-full mt-1 p-2 border border-border rounded-md bg-white text-sm min-h-[80px]"
            placeholder="輸入備註..."
          />
        </div>
      </div>
    </FormDialog>
  )
}
