/**
 * 建立 LinkPay 付款連結對話框
 *
 * 功能：
 * 1. 為收款單建立 LinkPay 付款連結
 * 2. 設定付款金額和到期日
 * 3. 呼叫 LinkPay API（目前為 mock 模式）
 * 4. 儲存 LinkPay 記錄到資料庫
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { useLinkPayLogStore } from '@/stores'
import { formatDateForInput } from '@/lib/utils'
import type { Receipt } from '@/types/receipt.types'
import { alert } from '@/lib/ui/alert-dialog'

interface CreateLinkPayDialogProps {
  isOpen: boolean
  onClose: () => void
  receipt: Receipt
}

export function CreateLinkPayDialog({
  isOpen,
  onClose,
  receipt,
}: CreateLinkPayDialogProps) {
  const { create: createLinkPayLog } = useLinkPayLogStore()

  const [formData, setFormData] = useState({
    amount: receipt.receipt_amount.toString(),
    end_date: getDefaultEndDate(),
    description: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 預設到期日（7天後）
  function getDefaultEndDate() {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // 呼叫 LinkPay API（目前為 mock 模式）
      const response = await fetch('/api/linkpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_id: receipt.id,
          amount: parseFloat(formData.amount),
          end_date: formData.end_date,
          description: formData.description || `收款單 ${receipt.receipt_number}`,
        }),
      })

      if (!response.ok) {
        throw new Error('LinkPay API 呼叫失敗')
      }

      const { data } = await response.json()

      // 儲存 LinkPay 記錄到資料庫
       
      await createLinkPayLog({
        receipt_id: receipt.id,
        linkpay_order_number: data.linkpay_order_number,
        amount: parseFloat(formData.amount),
        status: data.status,
        link: data.link,
        end_date: data.end_date,
      } as any)
       

      void alert('LinkPay 付款連結已建立！', 'success')
      onClose()

      // 重置表單
      setFormData({
        amount: receipt.receipt_amount.toString(),
        end_date: getDefaultEndDate(),
        description: '',
      })
    } catch (error) {
      logger.error('建立 LinkPay 失敗:', error)
      void alert('建立 LinkPay 失敗', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="建立 LinkPay 付款連結"
      subtitle={`收款單號：${receipt.receipt_number}`}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? '建立中...' : '建立付款連結'}
      submitDisabled={isSubmitting || !formData.amount || !formData.end_date}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-morandi-gold/10 border border-morandi-gold/20 rounded-lg p-4">
          <p className="text-sm text-morandi-gold">
            <strong>注意：</strong>目前為測試模式，將建立 mock 付款連結。
            <br />
            實際上線時會串接真實 LinkPay API。
          </p>
        </div>

        {/* 付款金額 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            付款金額 <span className="text-morandi-red">*</span>
          </label>
          <Input
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            placeholder="請輸入付款金額"
            className="mt-1"
            min="1"
            step="1"
          />
          <p className="text-xs text-morandi-muted mt-1">
            應收金額：NT$ {receipt.receipt_amount.toLocaleString()}
          </p>
        </div>

        {/* 到期日 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            付款到期日 <span className="text-morandi-red">*</span>
          </label>
          <DatePicker
            value={formData.end_date}
            onChange={(date) => setFormData({ ...formData, end_date: date })}
            className="mt-1"
            minDate={new Date()}
            placeholder="選擇日期"
          />
          <p className="text-xs text-morandi-muted mt-1">付款連結將在到期日後失效</p>
        </div>

        {/* 描述 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">付款說明</label>
          <Textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder={`收款單 ${receipt.receipt_number}`}
            rows={2}
            className="mt-1"
          />
          <p className="text-xs text-morandi-muted mt-1">客戶在付款頁面會看到此說明</p>
        </div>

        {/* 提示資訊 */}
        <div className="bg-morandi-background border border-morandi-container/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-morandi-primary mb-2">建立後會自動：</h4>
          <ul className="text-sm text-morandi-secondary space-y-1">
            <li>• 生成 LinkPay 付款連結</li>
            <li>• 發送付款通知 Email 給客戶</li>
            <li>• 追蹤付款狀態</li>
            <li>• 付款成功後自動更新實收金額</li>
          </ul>
        </div>
      </div>
    </FormDialog>
  )
}
