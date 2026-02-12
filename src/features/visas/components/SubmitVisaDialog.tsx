'use client'

import { getTodayString } from '@/lib/utils/format-date'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyCell } from '@/components/table-cells'
import { useVendorCosts, createVendorCost, updateVendorCost, updateVisa } from '@/data'
import { logger } from '@/lib/utils/logger'
import type { Visa } from '@/stores/types'
import { SUBMIT_DIALOG_LABELS as L } from '../constants/labels'

interface SubmitVisaDialogProps {
  open: boolean
  onClose: () => void
  selectedVisas: Visa[]
  onSubmitComplete: () => void
}

export function SubmitVisaDialog({
  open,
  onClose,
  selectedVisas,
  onSubmitComplete,
}: SubmitVisaDialogProps) {
  const [vendor, setVendor] = React.useState('')
  const [submitDate, setSubmitDate] = React.useState(getTodayString())
  const [costs, setCosts] = React.useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { items: vendorCosts } = useVendorCosts()

  // 取得所有代辦商名稱（從歷史記錄）
  const vendorList = React.useMemo(() => {
    return [...new Set(vendorCosts.map(vc => vc.vendor_name))]
  }, [vendorCosts])

  // 當代辦商改變時，自動帶入對應的成本
  React.useEffect(() => {
    if (!vendor) return

    const newCosts: Record<string, number> = {}
    selectedVisas.forEach(visa => {
      // 找出該代辦商 + 簽證類型的歷史成本
      const historyCost = vendorCosts.find(
        vc => vc.vendor_name === vendor && vc.visa_type === visa.visa_type
      )
      // 如果有歷史成本就帶入，否則保留原本的成本或 0
      newCosts[visa.id] = historyCost?.cost ?? visa.cost ?? 0
    })
    setCosts(newCosts)
  }, [vendor, selectedVisas, vendorCosts])

  // 重置表單
  React.useEffect(() => {
    if (open) {
      setVendor('')
      setSubmitDate(getTodayString())
      setCosts({})
    }
  }, [open])

  // 更新單筆成本
  const updateCost = (visaId: string, cost: number) => {
    setCosts(prev => ({ ...prev, [visaId]: cost }))
  }

  // 送件
  const handleSubmit = async () => {
    if (!vendor) return
    setIsSubmitting(true)

    try {
      // 先收集需要建立/更新的代辦商成本（按簽證類型去重）
      const costByType = new Map<string, number>()
      for (const visa of selectedVisas) {
        const cost = costs[visa.id] ?? 0
        // 如果同類型有多筆，取最後一筆的成本
        costByType.set(visa.visa_type, cost)
      }

      // 1. 更新所有選中的簽證
      for (const visa of selectedVisas) {
        const cost = costs[visa.id] ?? 0
        await updateVisa(visa.id, {
          status: 'submitted',
          actual_submission_date: submitDate,
          vendor,
          cost,
        })
      }

      // 2. 儲存/更新代辦商成本記錄（按簽證類型，不重複）
      for (const [visaType, cost] of costByType) {
        const existingCost = vendorCosts.find(
          vc => vc.vendor_name === vendor && vc.visa_type === visaType
        )

        if (existingCost) {
          // 更新現有記錄
          if (existingCost.cost !== cost) {
            await updateVendorCost(existingCost.id, { cost })
          }
        } else {
          // 建立新記錄
          try {
            await createVendorCost({
              vendor_name: vendor,
              visa_type: visaType,
              cost,
            } as Parameters<typeof createVendorCost>[0])
          } catch (err) {
            logger.error('代辦商成本建立失敗:', err)
          }
        }
      }

      onSubmitComplete()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // 依簽證類型分組
  const groupedVisas = React.useMemo(() => {
    const groups: Record<string, Visa[]> = {}
    selectedVisas.forEach(visa => {
      if (!groups[visa.visa_type]) {
        groups[visa.visa_type] = []
      }
      groups[visa.visa_type].push(visa)
    })
    return groups
  }, [selectedVisas])

  return (
    <FormDialog
      open={open}
      onOpenChange={open => !open && onClose()}
      title={L.title}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel={L.submit_label}
      submitDisabled={!vendor}
      loading={isSubmitting}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* 送件日期與代辦商 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">{L.label_date}</label>
            <DatePicker
              value={submitDate}
              onChange={(date) => setSubmitDate(date)}
              className="mt-1"
              placeholder={L.placeholder_date}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">{L.label_vendor}</label>
            <Input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder={L.placeholder_vendor}
              className="mt-1"
              list="vendor-list-submit"
            />
            <datalist id="vendor-list-submit">
              {vendorList.map(v => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
        </div>

        {/* 成本填寫 */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            {L.cost_section(selectedVisas.length)}
          </label>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {Object.entries(groupedVisas).map(([visaType, visas]) => {
              // 檢查這個類型是否有歷史成本
              const historyCost = vendor
                ? vendorCosts.find(vc => vc.vendor_name === vendor && vc.visa_type === visaType)
                : null

              return (
                <div key={visaType} className="bg-morandi-container/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-morandi-primary">
                      {visaType}
                      <span className="text-morandi-secondary ml-2">× {visas.length}</span>
                    </span>
                    {historyCost && (
                      <span className="text-xs text-morandi-green flex items-center gap-1">
                        {L.history_cost} <CurrencyCell amount={historyCost.cost} className="text-xs text-morandi-green" />
                      </span>
                    )}
                    {vendor && !historyCost && (
                      <span className="text-xs text-morandi-gold">
                        {L.new_cost_record}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {visas.map(visa => (
                      <div key={visa.id} className="flex items-center gap-3">
                        <span className="text-sm text-morandi-secondary w-24 truncate">
                          {visa.applicant_name}
                        </span>
                        <Input
                          type="number"
                          value={costs[visa.id] ?? 0}
                          onChange={e => updateCost(visa.id, Number(e.target.value))}
                          className="w-28"
                          placeholder={L.placeholder_cost}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 總計 */}
        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="text-sm text-morandi-secondary">{L.total_cost}</span>
          <CurrencyCell amount={Object.values(costs).reduce((sum, c) => sum + c, 0)} className="text-lg font-semibold text-morandi-primary" />
        </div>
      </div>
    </FormDialog>
  )
}
