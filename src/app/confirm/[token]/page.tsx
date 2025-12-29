'use client'

/**
 * 報價確認頁面（客戶公開連結）
 * /confirm/[token]
 *
 * 客戶透過此頁面確認報價單
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Check, Loader2, AlertCircle, CheckCircle2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { logger } from '@/lib/utils/logger'

interface QuoteInfo {
  code: string
  name: string | null
  customer_name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  days: number | null
  number_of_people: number | null
  total_amount: number | null
}

type PageState = 'loading' | 'ready' | 'confirming' | 'success' | 'error' | 'already_confirmed'

export default function QuoteConfirmPage() {
  const params = useParams()
  const token = params.token as string

  const [state, setState] = useState<PageState>('loading')
  const [quote, setQuote] = useState<QuoteInfo | null>(null)
  const [error, setError] = useState<string>('')

  // 表單欄位
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // 載入報價單資訊
  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/confirmation/customer?token=${token}`)
        const data = await res.json()

        if (data.success) {
          setQuote(data.quote)
          setName(data.quote.customer_name || '')
          setState('ready')
        } else if (data.already_confirmed) {
          setState('already_confirmed')
          setError(data.error)
        } else {
          setState('error')
          setError(data.error || '無法載入報價單資訊')
        }
      } catch (err) {
        logger.error('載入報價單失敗:', err)
        setState('error')
        setError('網路錯誤，請稍後再試')
      }
    }

    if (token) {
      fetchQuote()
    }
  }, [token])

  // 提交確認
  async function handleConfirm() {
    if (!name.trim()) {
      setError('請填寫您的姓名')
      return
    }

    setState('confirming')
    setError('')

    try {
      const res = await fetch('/api/quotes/confirmation/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setState('success')
      } else if (data.already_confirmed) {
        setState('already_confirmed')
      } else {
        setState('ready')
        setError(data.error || '確認失敗')
      }
    } catch (err) {
      logger.error('確認失敗:', err)
      setState('ready')
      setError('網路錯誤，請稍後再試')
    }
  }

  // 格式化金額
  function formatCurrency(amount: number | null) {
    if (!amount) return '-'
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 格式化日期
  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-morandi-container to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo / 公司名稱 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-morandi-gold/10 mb-4">
            <Building2 className="w-8 h-8 text-morandi-gold" />
          </div>
          <h1 className="text-2xl font-semibold text-morandi-primary">報價確認</h1>
        </div>

        {/* 主要卡片 */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          {/* 載入中 */}
          {state === 'loading' && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-morandi-gold animate-spin mb-4" />
              <p className="text-morandi-secondary">載入報價單資訊...</p>
            </div>
          )}

          {/* 錯誤 */}
          {state === 'error' && (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-morandi-red/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-morandi-red" />
              </div>
              <h2 className="text-lg font-medium text-morandi-primary mb-2">無法載入報價單</h2>
              <p className="text-morandi-secondary text-center">{error}</p>
              <p className="text-sm text-morandi-muted mt-4">
                如有疑問，請聯繫您的業務人員
              </p>
            </div>
          )}

          {/* 已確認 */}
          {state === 'already_confirmed' && (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-morandi-green/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-morandi-green" />
              </div>
              <h2 className="text-lg font-medium text-morandi-primary mb-2">報價單已確認</h2>
              <p className="text-morandi-secondary text-center">
                此報價單已完成確認，無需重複操作
              </p>
            </div>
          )}

          {/* 準備確認 */}
          {state === 'ready' && quote && (
            <>
              {/* 報價單資訊 */}
              <div className="bg-morandi-container/30 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-morandi-secondary">報價單編號</p>
                    <p className="font-medium text-morandi-primary">{quote.code}</p>
                  </div>
                  {quote.total_amount && (
                    <div className="text-right">
                      <p className="text-sm text-morandi-secondary">總金額</p>
                      <p className="font-semibold text-morandi-gold text-lg">
                        {formatCurrency(quote.total_amount)}
                      </p>
                    </div>
                  )}
                </div>

                {quote.name && (
                  <p className="font-medium text-morandi-primary mb-2">{quote.name}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {quote.destination && (
                    <div>
                      <span className="text-morandi-secondary">目的地：</span>
                      <span className="text-morandi-primary">{quote.destination}</span>
                    </div>
                  )}
                  {quote.days && (
                    <div>
                      <span className="text-morandi-secondary">天數：</span>
                      <span className="text-morandi-primary">{quote.days} 天</span>
                    </div>
                  )}
                  {quote.start_date && (
                    <div>
                      <span className="text-morandi-secondary">出發：</span>
                      <span className="text-morandi-primary">{formatDate(quote.start_date)}</span>
                    </div>
                  )}
                  {quote.number_of_people && (
                    <div>
                      <span className="text-morandi-secondary">人數：</span>
                      <span className="text-morandi-primary">{quote.number_of_people} 人</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 確認表單 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-morandi-primary">
                    確認人姓名 <span className="text-morandi-red">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="請輸入您的姓名"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-morandi-primary">
                    Email（選填）
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-morandi-primary">
                    聯絡電話（選填）
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-morandi-primary">
                    備註（選填）
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="如有其他需求請在此說明"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {error && (
                  <p className="text-sm text-morandi-red flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleConfirm}
                  className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  size="lg"
                >
                  <Check className="w-5 h-5" />
                  確認報價單
                </Button>

                <p className="text-xs text-morandi-muted text-center">
                  點擊確認表示您已閱讀並同意報價內容
                </p>
              </div>
            </>
          )}

          {/* 確認中 */}
          {state === 'confirming' && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-morandi-gold animate-spin mb-4" />
              <p className="text-morandi-secondary">處理中...</p>
            </div>
          )}

          {/* 確認成功 */}
          {state === 'success' && (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-morandi-green/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-morandi-green" />
              </div>
              <h2 className="text-lg font-medium text-morandi-primary mb-2">確認成功！</h2>
              <p className="text-morandi-secondary text-center">
                感謝您的確認，我們的業務人員將盡快與您聯繫
              </p>
              {quote && (
                <p className="text-sm text-morandi-muted mt-4">
                  報價單編號：{quote.code}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 版權資訊 */}
        <p className="text-center text-xs text-morandi-muted mt-6">
          © {new Date().getFullYear()} Venturo Travel
        </p>
      </div>
    </div>
  )
}
