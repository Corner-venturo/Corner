'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo } from 'react'
import { X, Calendar } from 'lucide-react'
import { useTourStore, usePaymentRequestStore } from '@/stores'
import { useWorkspaceWidgets, AdvanceItem } from '@/stores/workspace-store'
import { alert } from '@/lib/ui/alert-dialog'

interface CreatePaymentRequestDialogProps {
  items: AdvanceItem | AdvanceItem[] // 單項或批次
  listId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreatePaymentRequestDialog({
  items,
  listId,
  onClose,
  onSuccess,
}: CreatePaymentRequestDialogProps) {
  const { items: tours } = useTourStore()
  const { create: createPaymentRequest } = usePaymentRequestStore()
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
      return nextThursday.toISOString().split('T')[0]
    }
    setRequestDate(getNextThursday())
  }, [])

  const handleCreate = async () => {
    if (!selectedTourId) {
      void alert('請選擇關聯旅遊團', 'warning')
      return
    }

    try {
      const paymentRequest = await createPaymentRequest({
        code: '',
        request_number: '',
        tour_id: selectedTourId,
        request_type: category || '員工代墊',
        amount: totalAmount,
        supplier_name: supplier,
        status: 'pending',
        note: itemsArray.map((item, i) =>
          `${i + 1}. ${item.name} - ${item.description} ($${item.amount.toLocaleString()})`
        ).join('\n'),
      } as Parameters<typeof createPaymentRequest>[0])

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
      onClose()
    } catch (error) {
      logger.error('建立請款單失敗：', error)
      void alert('建立失敗，請稍後再試', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="card-morandi-elevated w-[600px]" onClick={e => e.stopPropagation()}>
        {/* 標題列 */}
        <div className="flex items-center justify-between pb-3 border-b border-morandi-gold/20">
          <h3 className="text-lg font-semibold text-morandi-primary">
            {isBatch ? `批次請款 (${itemsArray.length} 筆)` : '建立請款單'}
          </h3>
          <button onClick={onClose} className="btn-icon-morandi !w-8 !h-8">
            <X size={16} />
          </button>
        </div>

        {/* 內容 */}
        <div className="space-y-4 my-4">
          {/* 代墊項目資訊 */}
          <div className="bg-morandi-container/5 rounded-lg p-3 border border-morandi-gold/20">
            <div className="text-sm font-medium text-morandi-secondary mb-2">代墊項目：</div>
            <div className="space-y-1">
              {itemsArray.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-morandi-primary">
                    {index + 1}. {item.name} - {item.description}
                  </span>
                  <span className="font-medium text-morandi-primary">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-morandi-gold/20">
              <span className="text-sm font-medium text-morandi-secondary">總計：</span>
              <span className="text-lg font-semibold text-morandi-primary">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 關聯旅遊團 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              關聯旅遊團 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTourId}
              onChange={e => setSelectedTourId(e.target.value)}
              className=""
            >
              <option value="">請選擇旅遊團</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} ({tour.code})
                </option>
              ))}
            </select>
          </div>

          {/* 類別 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">類別</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className=""
            />
          </div>

          {/* 供應商 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">供應商</label>
            <input
              type="text"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              className=""
            />
          </div>

          {/* 請款日期 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              請款日期 (預設下個週四)
            </label>
            <div className="relative">
              <input
                type="date"
                value={requestDate}
                onChange={e => setRequestDate(e.target.value)}
                className="input-morandi pl-10"
              />
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="flex gap-2 justify-end pt-3 border-t border-morandi-gold/20">
          <button className="btn-morandi-secondary !py-2 !px-4" onClick={onClose}>
            取消
          </button>
          <button className="btn-morandi-primary !py-2 !px-4" onClick={handleCreate}>
            建立請款單
          </button>
        </div>
      </div>
    </div>
  )
}
