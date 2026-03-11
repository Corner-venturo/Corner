'use client'

/**
 * TourQuickQuoteTab - 團詳情頁快速報價單分頁
 *
 * 列出該團所有快速報價單，可新增、查看
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Tour } from '@/stores/types'
import type { Quote } from '@/stores/types'
import { QuickQuoteDialog } from '@/features/quotes/components/QuickQuoteDialog'
import { useQuickQuoteForm } from '@/features/quotes/hooks/useQuickQuoteForm'
import { createQuote } from '@/data'
import { COMP_TOURS_LABELS } from '../constants/labels'

interface TourQuickQuoteTabProps {
  tour: Tour
}

const STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  proposed: '已提案',
  confirmed: '已確認',
  revised: '修改中',
  cancelled: '已取消',
}

export function TourQuickQuoteTab({ tour }: TourQuickQuoteTabProps) {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const addQuote = useCallback(
    async (data: Partial<Quote>) => {
      const result = await createQuote({
        ...data,
        tour_id: tour.id,
        tour_code: tour.code || '',
      } as Parameters<typeof createQuote>[0])
      return result as Quote | undefined
    },
    [tour.id, tour.code]
  )

  const { formData, setFormField, resetForm, handleSubmit } = useQuickQuoteForm({ addQuote })

  // 載入該團所有快速報價單
  const loadQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, customer_name, issue_date, total_amount, received_amount, status, created_at')
        .eq('tour_id', tour.id)
        .eq('quote_type', 'quick')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotes((data as Quote[]) || [])
    } catch (err) {
      logger.error('載入快速報價單失敗', err)
    } finally {
      setLoading(false)
    }
  }, [tour.id])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  // 開啟新增 dialog 時自動帶入團號
  const handleOpenDialog = useCallback(() => {
    setFormField('tour_code', tour.code || '')
    setDialogOpen(true)
  }, [tour.code, setFormField])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    resetForm()
  }, [resetForm])

  const handleDialogSubmit = useCallback(async () => {
    const success = await handleSubmit()
    if (success) {
      setDialogOpen(false)
      resetForm()
      loadQuotes()
    }
    return success
  }, [handleSubmit, resetForm, loadQuotes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  // 空狀態
  if (quotes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-morandi-primary mb-2">尚無快速報價單</h3>
          <p className="text-sm text-muted-foreground mb-6">建立快速報價單以記錄簡易收款</p>
          <Button onClick={handleOpenDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {COMP_TOURS_LABELS.新增快速報價}
          </Button>
        </div>
        <QuickQuoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormField={setFormField as never}
          onSubmit={handleDialogSubmit}
          onClose={handleDialogClose}
        />
      </>
    )
  }

  // 列表
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={handleOpenDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {COMP_TOURS_LABELS.新增快速報價}
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-medium">客戶名稱</th>
                <th className="px-4 py-2.5 font-medium">開單日期</th>
                <th className="px-4 py-2.5 font-medium text-right">應收金額</th>
                <th className="px-4 py-2.5 font-medium text-right">已收金額</th>
                <th className="px-4 py-2.5 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr
                  key={quote.id}
                  className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/quotes/quick/${quote.id}`)}
                >
                  <td className="px-4 py-2.5">{quote.customer_name || '未命名'}</td>
                  <td className="px-4 py-2.5">{quote.issue_date || '-'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {formatCurrency(quote.total_amount || 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatCurrency(quote.received_amount || 0)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {STATUS_MAP[quote.status] || quote.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QuickQuoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormField={setFormField as never}
        onSubmit={handleDialogSubmit}
        onClose={handleDialogClose}
      />
    </>
  )
}
