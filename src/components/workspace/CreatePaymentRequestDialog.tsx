'use client'

import { formatDate } from '@/lib/utils/format-date'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo } from 'react'
import { Plus, X } from 'lucide-react'
import { useToursSlim, createPaymentRequest as createPaymentRequestApi } from '@/data'
import { useWorkspaceWidgets, AdvanceItem } from '@/stores/workspace-store'
import { alert } from '@/lib/ui/alert-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CurrencyCell } from '@/components/table-cells'
import { createPaymentRequestSchema } from '@/lib/validations/schemas'

interface CreatePaymentRequestDialogProps {
  items: AdvanceItem | AdvanceItem[] // 單項或批次
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePaymentRequestDialog({
  items,
  listId,
  open,
  onOpenChange,
  onSuccess,
}: CreatePaymentRequestDialogProps) {
  const { items: tours } = useToursSlim()
  const { processAdvanceItem } = useWorkspaceWidgets()

  const itemsArray = useMemo(() => (Array.isArray(items) ? items : [items]), [items])
  const isBatch = Array.isArray(items)

  const [selectedTourId, setSelectedTourId] = useState('')
  const [category, setCategory] = useState('其他')
  const [supplier, setSupplier] = useState('')
  const [requestDate, setRequestDate] = useState('')

  // 計算總金額
  const totalAmount = itemsArray.reduce((sum, item) => sum + item.amount, 0)

  // 自動設定供應商為第一個代墊人
  useEffect(() => {
    if (itemsArray.length > 0) {
      setSupplier(`員工代墊-${itemsArray[0].advance_person}`)
    }
  }, [itemsArray])

  // 獲取下個週四
  useEffect(() => {
    const getNextThursday = () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilThursday = (4 - dayOfWeek + 7) % 7
      const nextThursday = new Date(today)
      nextThursday.setDate(today.getDate() + (daysUntilThursday === 0 ? 7 : daysUntilThursday))
      return formatDate(nextThursday)
    }
    setRequestDate(getNextThursday())
  }, [])

  const handleCreate = async () => {
    const validation = createPaymentRequestSchema.safeParse({
      selectedTourId,
      amount: totalAmount,
    })
    if (!validation.success) {
      void alert(validation.error.issues[0].message, 'warning')
      return
    }

    try {
      const paymentRequest = await createPaymentRequestApi({
        code: '',
        request_number: '',
        tour_id: selectedTourId,
        request_type: category || '員工代墊',
        request_date: requestDate,
        amount: totalAmount,
        supplier_name: supplier,
        status: 'pending',
        notes: itemsArray.map((item, i) =>
          `${i + 1}. ${item.name} - ${item.description} (NT$ ${item.amount.toLocaleString()})`
        ).join('\n'),
      })

      // 更新代墊項目狀態
      for (const item of itemsArray) {
        await processAdvanceItem(
          listId,
          item.id,
          paymentRequest.id,
          'current-user' // 從 auth store 取得當前用戶 ID
        )
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      logger.error('建立請款單失敗：', error)
      void alert('建立失敗，請稍後再試', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isBatch ? `批次請款 (${itemsArray.length} 筆)` : '建立請款單'}
          </DialogTitle>
        </DialogHeader>

        {/* 內容 */}
        <div className="space-y-4">
          {/* 代墊項目資訊 */}
          <div className="bg-morandi-container/5 rounded-lg p-3 border border-morandi-gold/20">
            <div className="text-sm font-medium text-morandi-secondary mb-2">代墊項目：</div>
            <div className="space-y-1">
              {itemsArray.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-morandi-primary">
                    {index + 1}. {item.name} - {item.description}
                  </span>
                  <CurrencyCell amount={item.amount} className="font-medium text-morandi-primary" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-morandi-gold/20">
              <span className="text-sm font-medium text-morandi-secondary">總計：</span>
              <CurrencyCell amount={totalAmount} className="text-lg font-semibold text-morandi-primary" />
            </div>
          </div>

          {/* 關聯旅遊團 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              關聯旅遊團 <span className="text-status-danger">*</span>
            </label>
            <Combobox
              value={selectedTourId}
              onChange={setSelectedTourId}
              options={tours.map(tour => ({
                value: tour.id,
                label: `${tour.code} - ${tour.name}`,
              }))}
              placeholder="搜尋或選擇旅遊團..."
              emptyMessage="找不到旅遊團"
            />
          </div>

          {/* 類別 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">類別</label>
            <Input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
          </div>

          {/* 供應商 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">供應商</label>
            <Input
              type="text"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
            />
          </div>

          {/* 請款日期 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              請款日期 (預設下個週四)
            </label>
            <DatePicker
              value={requestDate}
              onChange={date => setRequestDate(date)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={16} />
            建立請款單
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
