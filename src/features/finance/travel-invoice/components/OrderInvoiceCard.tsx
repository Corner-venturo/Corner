'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurrencyCell } from '@/components/table-cells'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface OrderInvoiceCardProps {
  orderId: string
  onIssue?: () => void
}

interface InvoiceSummary {
  paid_amount: number
  invoiced_amount: number
  invoiceable_amount: number
}

interface Invoice {
  id: string
  transaction_no: string
  invoice_number: string | null
  total_amount: number
  invoice_date: string
  status: string
}

export function OrderInvoiceCard({ orderId, onIssue }: OrderInvoiceCardProps) {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoiceInfo()
  }, [orderId])

  const loadInvoiceInfo = async () => {
    try {
      setLoading(true)
      // 查詢訂單發票摘要
      const { data: summaryData } = await supabase
        .from('orders_invoice_summary')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (summaryData) {
        setSummary({
          paid_amount: Number(summaryData.paid_amount || 0),
          invoiced_amount: Number(summaryData.invoiced_amount || 0),
          invoiceable_amount: Number(summaryData.invoiceable_amount || 0),
        })
      }

      // 查詢已開立的發票
      const { data: invoicesData } = await supabase
        .from('invoice_orders')
        .select(`
          amount,
          travel_invoices (
            id,
            transaction_no,
            invoice_number,
            total_amount,
            invoice_date,
            status
          )
        `)
        .eq('order_id', orderId)

      if (invoicesData) {
        const mappedInvoices = invoicesData
          .map((io: { amount: number; travel_invoices: Invoice }) => ({
            ...io.travel_invoices,
            amount: io.amount,
          }))
          .filter(inv => inv.status !== 'voided' && inv.status !== 'failed')

        setInvoices(mappedInvoices)
      }
    } catch (error) {
      logger.error('載入發票資訊失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-morandi-secondary">載入中...</p>
        </CardContent>
      </Card>
    )
  }

  if (!summary) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          發票資訊
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-morandi-secondary">已收款</p>
            <p className="font-medium">
              <CurrencyCell amount={summary.paid_amount} />
            </p>
          </div>
          <div>
            <p className="text-sm text-morandi-secondary">已開發票</p>
            <p className="font-medium">
              <CurrencyCell amount={summary.invoiced_amount} />
            </p>
          </div>
          <div>
            <p className="text-sm text-morandi-secondary">可開金額</p>
            <p className="font-medium text-morandi-gold">
              <CurrencyCell amount={summary.invoiceable_amount} />
            </p>
          </div>
        </div>

        {/* 已開發票列表 */}
        {invoices.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-morandi-secondary mb-2">已開立發票</p>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex justify-between text-sm">
                  <span>{inv.invoice_number || inv.transaction_no}</span>
                  <CurrencyCell amount={inv.total_amount} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 開立按鈕 */}
        {summary.invoiceable_amount > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={onIssue}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2 w-full"
            >
              <FileText size={16} />
              開立發票
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
