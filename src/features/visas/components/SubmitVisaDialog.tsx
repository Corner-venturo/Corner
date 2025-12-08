'use client'

import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { useVendorCostStore, useVisaStore } from '@/stores'
import type { Visa } from '@/stores/types'

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
  const [costs, setCosts] = React.useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const vendorCosts = useVendorCostStore(state => state.items)
  const createVendorCost = useVendorCostStore(state => state.create)
  const updateVendorCost = useVendorCostStore(state => state.update)
  const updateVisa = useVisaStore(state => state.update)

  // 載入代辦商成本資料
  React.useEffect(() => {
    useVendorCostStore.getState().fetchAll()
  }, [])

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
      const today = new Date().toISOString().split('T')[0]

      // 1. 更新所有選中的簽證
      for (const visa of selectedVisas) {
        const cost = costs[visa.id] ?? 0
        await updateVisa(visa.id, {
          status: 'submitted',
          actual_submission_date: today,
          vendor,
          cost,
        })

        // 2. 儲存/更新代辦商成本記錄
        const existingCost = vendorCosts.find(
          vc => vc.vendor_name === vendor && vc.visa_type === visa.visa_type
        )

        if (existingCost) {
          // 更新現有記錄
          if (existingCost.cost !== cost) {
            await updateVendorCost(existingCost.id, { cost })
          }
        } else {
          // 建立新記錄
          await createVendorCost({
            vendor_name: vendor,
            visa_type: visa.visa_type,
            cost,
          })
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
      title="送件"
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitLabel="確認送件"
      submitDisabled={!vendor}
      loading={isSubmitting}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* 代辦商選擇 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">代辦商</label>
          <Input
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="請輸入或選擇代辦商"
            className="mt-1"
            list="vendor-list"
          />
          <datalist id="vendor-list">
            {vendorList.map(v => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <p className="text-xs text-morandi-secondary mt-1">
            輸入新的代辦商名稱會自動記住
          </p>
        </div>

        {/* 成本填寫 */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            成本設定（共 {selectedVisas.length} 筆）
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
                      <span className="text-xs text-morandi-green">
                        歷史成本: ${historyCost.cost.toLocaleString()}
                      </span>
                    )}
                    {vendor && !historyCost && (
                      <span className="text-xs text-morandi-gold">
                        新的成本記錄
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
                          placeholder="成本"
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
          <span className="text-sm text-morandi-secondary">總成本</span>
          <span className="text-lg font-semibold text-morandi-primary">
            ${Object.values(costs).reduce((sum, c) => sum + c, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </FormDialog>
  )
}
