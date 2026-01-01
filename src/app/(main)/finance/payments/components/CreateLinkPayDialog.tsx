/**
 * 建立 LinkPay 付款連結對話框
 *
 * 功能：
 * 1. 為收款單建立 LinkPay 付款連結（台新銀行）
 * 2. 設定付款人資訊、金額和到期日
 * 3. 呼叫台新 LinkPay API 生成付款連結
 * 4. 自動發送 Email 通知客戶
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Receipt } from '@/types/receipt.types'
import { alert } from '@/lib/ui/alert-dialog'
import { CurrencyCell } from '@/components/table-cells'
import { useAuthStore } from '@/stores/auth-store'
import { Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateLinkPayDialogProps {
  isOpen: boolean
  onClose: () => void
  receipt: Receipt
  onSuccess?: () => void // 建立成功後的回調
}

export function CreateLinkPayDialog({
  isOpen,
  onClose,
  receipt,
  onSuccess,
}: CreateLinkPayDialogProps) {
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    userName: receipt.receipt_account || '',
    email: receipt.email || '',
    gender: '', // 1: 男, 2: 女
    amount: receipt.receipt_amount.toString(),
    endDate: getDefaultEndDate(),
    paymentName: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    paymentLink?: string
    message?: string
  } | null>(null)

  // 當 receipt 改變時，重置表單
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userName: receipt.receipt_account || '',
        email: receipt.email || '',
        gender: '',
        amount: receipt.receipt_amount.toString(),
        endDate: getDefaultEndDate(),
        paymentName: '',
      })
      setResult(null)
    }
  }, [isOpen, receipt])

  // 預設到期日（7天後）
  function getDefaultEndDate() {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    // 驗證必填欄位
    if (!formData.userName.trim()) {
      void alert('請輸入付款人姓名', 'error')
      return
    }
    if (!formData.email.trim()) {
      void alert('請輸入 Email', 'error')
      return
    }
    if (!formData.email.includes('@')) {
      void alert('請輸入有效的 Email 地址', 'error')
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/linkpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber: receipt.receipt_number,
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          gender: formData.gender ? parseInt(formData.gender) : undefined,
          amount: parseFloat(formData.amount),
          endDate: formData.endDate,
          paymentName: formData.paymentName || undefined,
          createUser: user?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          paymentLink: data.data?.paymentLink || data.data?.link,
          message: '付款連結已成功建立！',
        })
        onSuccess?.()
      } else {
        setResult({
          success: false,
          message: data.message || '建立付款連結失敗',
        })
      }
    } catch (error) {
      logger.error('建立 LinkPay 失敗:', error)
      setResult({
        success: false,
        message: '網路錯誤，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (result?.paymentLink) {
      try {
        await navigator.clipboard.writeText(result.paymentLink)
        void alert('付款連結已複製！', 'success')
      } catch {
        void alert('複製失敗，請手動複製', 'error')
      }
    }
  }

  const handleOpenLink = () => {
    if (result?.paymentLink) {
      window.open(result.paymentLink, '_blank')
    }
  }

  // 如果已建立成功，顯示結果
  if (result?.success) {
    return (
      <FormDialog
        open={isOpen}
        onOpenChange={open => !open && onClose()}
        title="付款連結已建立"
        subtitle={`收款單號：${receipt.receipt_number}`}
        onSubmit={onClose}
        submitLabel="完成"
        maxWidth="md"
        footer={
          <Button
            onClick={onClose}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            完成
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="bg-morandi-green/10 border border-morandi-green/20 rounded-lg p-4">
            <p className="text-sm text-morandi-green font-medium">
              付款連結已成功建立並發送至客戶 Email！
            </p>
          </div>

          {/* 付款連結 */}
          <div className="bg-morandi-background border border-morandi-container/30 rounded-lg p-4">
            <label className="text-sm font-medium text-morandi-primary block mb-2">
              付款連結
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={result.paymentLink || ''}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1"
              >
                <Copy size={14} />
                複製
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="gap-1"
              >
                <ExternalLink size={14} />
                開啟
              </Button>
            </div>
          </div>

          {/* 提示 */}
          <div className="text-sm text-morandi-secondary">
            <p>• 客戶將收到包含付款連結的 Email 通知</p>
            <p>• 付款成功後系統會自動更新收款單狀態</p>
            <p>• 實收金額會扣除 2% 手續費</p>
          </div>
        </div>
      </FormDialog>
    )
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="建立 LinkPay 付款連結"
      subtitle={`收款單號：${receipt.receipt_number}`}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? '建立中...' : '建立付款連結'}
      submitDisabled={isSubmitting || !formData.userName || !formData.email || !formData.amount || !formData.endDate}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* 錯誤訊息 */}
        {result?.success === false && (
          <div className="bg-morandi-red/10 border border-morandi-red/20 rounded-lg p-4">
            <p className="text-sm text-morandi-red">
              {result.message}
            </p>
          </div>
        )}

        {/* 付款人姓名 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            付款人姓名 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={formData.userName}
            onChange={e => setFormData({ ...formData, userName: e.target.value })}
            placeholder="請輸入付款人姓名"
            className="mt-1"
            maxLength={20}
          />
          <p className="text-xs text-morandi-muted mt-1">客戶在付款頁面會看到此姓名</p>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            Email <span className="text-morandi-red">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="請輸入客戶 Email"
            className="mt-1"
          />
          <p className="text-xs text-morandi-muted mt-1">付款連結會發送到此 Email</p>
        </div>

        {/* 性別（選填） */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">性別</label>
          <Select
            value={formData.gender}
            onValueChange={value => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="選填" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">男</SelectItem>
              <SelectItem value="2">女</SelectItem>
            </SelectContent>
          </Select>
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
          <p className="text-xs text-morandi-muted mt-1 flex items-center gap-1">
            應收金額：<CurrencyCell amount={receipt.receipt_amount} className="text-xs" />
            <span className="text-morandi-gold">（實收會扣除 2% 手續費）</span>
          </p>
        </div>

        {/* 到期日 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">
            付款到期日 <span className="text-morandi-red">*</span>
          </label>
          <DatePicker
            value={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
            className="mt-1"
            minDate={new Date()}
            placeholder="選擇日期"
          />
          <p className="text-xs text-morandi-muted mt-1">付款連結將在到期日 23:59 後失效</p>
        </div>

        {/* 付款說明（選填） */}
        <div>
          <label className="text-sm font-medium text-morandi-primary">付款說明</label>
          <Textarea
            value={formData.paymentName}
            onChange={e => setFormData({ ...formData, paymentName: e.target.value })}
            placeholder={`預設：團名 + 付款人帳號`}
            rows={2}
            className="mt-1"
            maxLength={40}
          />
          <p className="text-xs text-morandi-muted mt-1">客戶在付款頁面會看到此說明（最多 40 字）</p>
        </div>

        {/* 提示資訊 */}
        <div className="bg-morandi-background border border-morandi-container/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-morandi-primary mb-2">建立後會自動：</h4>
          <ul className="text-sm text-morandi-secondary space-y-1">
            <li>• 生成台新銀行 LinkPay 付款連結</li>
            <li>• 發送付款通知 Email 給客戶</li>
            <li>• 追蹤付款狀態（待付款/已付款/失敗）</li>
            <li>• 付款成功後自動更新收款單實收金額</li>
          </ul>
        </div>
      </div>
    </FormDialog>
  )
}
