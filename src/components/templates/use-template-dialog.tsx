'use client'

import { useState, useMemo } from 'react'

import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTourStore, useOrderStore } from '@/stores'
import { useTemplateStore } from '@/stores/template-store'
import type { Tour, Order } from '@/stores/types'

import { Template } from '@/types/template'

interface UseTemplateDialogProps {
  template: Template
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'select-data' | 'fill-manual' | 'preview'

export function UseTemplateDialog({ template, open, onOpenChange }: UseTemplateDialogProps) {
  const { items: tours } = useTourStore()
  const { items: orders } = useOrderStore()
  const { addDocument } = useTemplateStore()

  const [step, setStep] = useState<Step>('select-data')
  const [selectedData, setSelectedData] = useState<Record<string, unknown>>({})
  const [manualData, setManualData] = useState<Record<string, unknown>>({})

  // 需要從資料來源選擇的欄位
  const autoFields = useMemo(
    () => template.field_mappings?.filter(f => f.data_source !== 'manual') || [],
    [template]
  )

  // 需要手動輸入的欄位
  const manualFields = useMemo(
    () => template.field_mappings?.filter(f => f.data_source === 'manual') || [],
    [template]
  )

  // 選擇資料來源項目時，自動填充相關欄位
  const handleSelectSource = (source: string, sourceId: string, sourceData: any) => {
    const newData = { ...selectedData }

    // 找出使用這個資料來源的所有欄位
    const fieldsFromSource = autoFields.filter(f => f.data_source === source)

    fieldsFromSource.forEach(field => {
      if (field.source_field) {
        newData[field.field_key] = sourceData[field.source_field]
      }
    })

    setSelectedData(newData)
  }

  const handleGeneratePDF = async () => {
    try {
      // 合併所有資料
      const allData = { ...selectedData, ...manualData }

      // 儲存生成記錄
      await addDocument({
        template_id: template.id,
        template_name: template.name,
        data_used: allData,
        file_type: 'pdf',
        created_by: 'current-user-id', // 使用實際的用戶 ID
      })

      // 實際的 PDF 生成邏輯
      alert('PDF 生成功能即將整合')

      onOpenChange(false)
    } catch (error) {
      alert('生成失敗，請稍後再試')
    }
  }

  const canGoNext = () => {
    if (step === 'select-data') {
      // 檢查所有必填的自動欄位是否都已填寫
      return autoFields.every(field => {
        if (!field.is_required) return true
        return selectedData[field.field_key] !== undefined
      })
    }
    if (step === 'fill-manual') {
      // 檢查所有必填的手動欄位是否都已填寫
      return manualFields.every(field => {
        if (!field.is_required) return true
        return manualData[field.field_key]?.toString().trim()
      })
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>使用模板：{template.name}</DialogTitle>
        </DialogHeader>

        {/* 步驟指示器 */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div
            className={`px-4 py-2 rounded-full text-sm ${step === 'select-data' ? 'bg-morandi-gold text-white' : 'bg-morandi-container/20 text-morandi-muted'}`}
          >
            1. 選擇資料
          </div>
          <ChevronRight size={16} className="text-morandi-muted" />
          <div
            className={`px-4 py-2 rounded-full text-sm ${step === 'fill-manual' ? 'bg-morandi-gold text-white' : 'bg-morandi-container/20 text-morandi-muted'}`}
          >
            2. 填寫資料
          </div>
          <ChevronRight size={16} className="text-morandi-muted" />
          <div
            className={`px-4 py-2 rounded-full text-sm ${step === 'preview' ? 'bg-morandi-gold text-white' : 'bg-morandi-container/20 text-morandi-muted'}`}
          >
            3. 預覽下載
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 步驟 1: 選擇資料來源 */}
          {step === 'select-data' && (
            <div className="space-y-4">
              {autoFields.length === 0 ? (
                <div className="bg-morandi-container/5 rounded-lg p-8 text-center">
                  <p className="text-sm text-morandi-secondary">此模板不需要選擇資料來源</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-morandi-secondary">這個模板需要以下資料，請選擇：</p>

                  {/* 旅遊團選擇 */}
                  {autoFields.some(f => f.data_source === 'tour') && (
                    <div>
                      <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                        選擇旅遊團
                        {autoFields.some(f => f.data_source === 'tour' && f.is_required) && (
                          <span className="text-morandi-red ml-1">*</span>
                        )}
                      </label>
                      <Select
                        onValueChange={tour_id => {
                          const tour = tours.find((t: Tour) => t.id === tour_id)
                          if (tour) handleSelectSource('tour', tour_id, tour)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="請選擇旅遊團" />
                        </SelectTrigger>
                        <SelectContent>
                          {tours.map((tour: Tour) => (
                            <SelectItem key={tour.id} value={tour.id}>
                              {tour.code} - {tour.name} ({tour.departure_date})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 訂單選擇 */}
                  {autoFields.some(f => f.data_source === 'order') && (
                    <div>
                      <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                        選擇訂單
                        {autoFields.some(f => f.data_source === 'order' && f.is_required) && (
                          <span className="text-morandi-red ml-1">*</span>
                        )}
                      </label>
                      <Select
                        onValueChange={order_id => {
                          const order = orders.find((o: Order) => o.id === order_id)
                          if (order) handleSelectSource('order', order_id, order)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="請選擇訂單" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders.map((order: Order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.order_number} - {order.contact_person}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 步驟 2: 填寫手動資料 */}
          {step === 'fill-manual' && (
            <div className="space-y-4">
              {manualFields.length === 0 ? (
                <div className="bg-morandi-container/5 rounded-lg p-8 text-center">
                  <p className="text-sm text-morandi-secondary">此模板不需要手動輸入資料</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-morandi-secondary">請填寫以下資料：</p>

                  {manualFields.map(field => (
                    <div key={field.id}>
                      <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                        {field.display_name}
                        {field.is_required && <span className="text-morandi-red ml-1">*</span>}
                      </label>
                      <Input
                        type={
                          field.field_type === 'number'
                            ? 'number'
                            : field.field_type === 'date'
                              ? 'date'
                              : 'text'
                        }
                        value={manualData[field.field_key] || field.default_value || ''}
                        onChange={e =>
                          setManualData(prev => ({
                            ...prev,
                            [field.field_key]: e.target.value,
                          }))
                        }
                        placeholder={field.default_value}
                      />
                      {field.description && (
                        <p className="text-xs text-morandi-muted mt-1">{field.description}</p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* 步驟 3: 預覽 */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-morandi-container/5 rounded-lg p-8">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-lg font-bold text-morandi-primary mb-2">文件預覽</h3>
                  <p className="text-sm text-morandi-secondary">即將整合 PDF 預覽功能</p>
                </div>

                {/* 顯示將要使用的資料 */}
                <div className="bg-card rounded-lg p-4 border border-morandi-container/20">
                  <h4 className="text-sm font-bold text-morandi-primary mb-3">使用的資料：</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries({ ...selectedData, ...manualData }).map(([key, value]) => {
                      const field = template.field_mappings?.find(f => f.field_key === key)
                      return (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-morandi-muted min-w-[120px]">
                            {field?.display_name || key}:
                          </span>
                          <span className="text-morandi-primary font-medium">{String(value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-between pt-4 border-t border-morandi-container/20">
          <div>
            {step !== 'select-data' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 'fill-manual') setStep('select-data')
                  if (step === 'preview') setStep('fill-manual')
                }}
              >
                <ChevronLeft size={16} className="mr-2" />
                上一步
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>

            {step !== 'preview' ? (
              <Button
                onClick={() => {
                  if (step === 'select-data') setStep('fill-manual')
                  if (step === 'fill-manual') setStep('preview')
                }}
                disabled={!canGoNext()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                下一步
                <ChevronRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGeneratePDF}
                className="bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                <Download size={16} className="mr-2" />
                下載 PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
