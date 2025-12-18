/**
 * 編輯收款單對話框
 *
 * 功能：
 * 1. 編輯收款日期
 * 2. 編輯收款方式詳細資訊（經手人、帳戶資訊等）
 * 3. 編輯備註
 *
 * 限制：
 * - 已確認的收款單不可編輯金額
 * - 不可修改收款方式
 */

'use client'

import { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { formatDateForInput } from '@/lib/utils'
import type { Receipt } from '@/types/receipt.types'

interface EditReceiptDialogProps {
  isOpen: boolean
  onClose: () => void
  receipt: Receipt
  onSubmit: (data: Partial<Receipt>) => Promise<void>
}

export function EditReceiptDialog({
  isOpen,
  onClose,
  receipt,
  onSubmit,
}: EditReceiptDialogProps) {
  const [formData, setFormData] = useState({
    receipt_date: receipt.receipt_date,
    handler_name: receipt.handler_name || '',
    account_info: receipt.account_info || '',
    fees: receipt.fees?.toString() || '',
    card_last_four: receipt.card_last_four || '',
    check_number: receipt.check_number || '',
    check_date: receipt.check_date || '',
    notes: receipt.note || '',
  })

  // 當 receipt 更新時同步 formData
  useEffect(() => {
    setFormData({
      receipt_date: receipt.receipt_date,
      handler_name: receipt.handler_name || '',
      account_info: receipt.account_info || '',
      fees: receipt.fees?.toString() || '',
      card_last_four: receipt.card_last_four || '',
      check_number: receipt.check_number || '',
      check_date: receipt.check_date || '',
      notes: receipt.note || '',
    })
  }, [receipt])

  const handleSubmit = async () => {
    const updateData: Partial<Receipt> = {
      receipt_date: formData.receipt_date,
      handler_name: formData.handler_name || null,
      account_info: formData.account_info || null,
      fees: formData.fees ? parseFloat(formData.fees) : null,
      card_last_four: formData.card_last_four || null,
      check_number: formData.check_number || null,
      check_date: formData.check_date || null,
      note: formData.notes || null,
    }

    await onSubmit(updateData)
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="編輯收款單"
      subtitle={`收款單號：${receipt.receipt_number}`}
      onSubmit={handleSubmit}
      submitLabel="儲存變更"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* 收款日期 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            收款日期 <span className="text-morandi-red">*</span>
          </label>
          <DatePicker
            value={formatDateForInput(formData.receipt_date)}
            onChange={(date) => setFormData({ ...formData, receipt_date: date })}
            className="mt-1"
            placeholder="選擇日期"
          />
        </div>

        {/* 經手人 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">經手人</label>
          <Input
            value={formData.handler_name}
            onChange={e => setFormData({ ...formData, handler_name: e.target.value })}
            placeholder="收款經手人姓名"
            className="mt-1"
          />
        </div>

        {/* 帳戶資訊 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">帳戶資訊</label>
          <Input
            value={formData.account_info}
            onChange={e => setFormData({ ...formData, account_info: e.target.value })}
            placeholder="銀行帳號、現金櫃位等"
            className="mt-1"
          />
        </div>

        {/* 手續費 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">手續費</label>
          <Input
            type="number"
            value={formData.fees}
            onChange={e => setFormData({ ...formData, fees: e.target.value })}
            placeholder="0"
            className="mt-1"
            min="0"
            step="0.01"
          />
        </div>

        {/* 刷卡後四碼 (僅刷卡方式) */}
        {receipt.receipt_type === 2 && (
          <div>
            <label className="text-sm font-medium text-morandi-primary">卡號後四碼</label>
            <Input
              value={formData.card_last_four}
              onChange={e => setFormData({ ...formData, card_last_four: e.target.value })}
              placeholder="1234"
              maxLength={4}
              className="mt-1"
            />
          </div>
        )}

        {/* 支票資訊 (僅支票方式) */}
        {receipt.receipt_type === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">支票號碼</label>
              <Input
                value={formData.check_number}
                onChange={e => setFormData({ ...formData, check_number: e.target.value })}
                placeholder="支票號碼"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary">支票日期</label>
              <DatePicker
                value={formatDateForInput(formData.check_date)}
                onChange={(date) => setFormData({ ...formData, check_date: date })}
                className="mt-1"
                placeholder="選擇日期"
              />
            </div>
          </div>
        )}

        {/* 備註 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">備註</label>
          <Textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="收款備註資訊"
            rows={3}
            className="mt-1"
          />
        </div>
      </div>
    </FormDialog>
  )
}
