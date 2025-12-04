/**
 * DisbursementPrintDialog
 * 出納單列印預覽對話框
 *
 * 功能：
 * - 顯示出納單即時預覽
 * - 提供列印和下載 PDF 功能
 */

'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, Loader2 } from 'lucide-react'
import type { DisbursementOrder, PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { PrintDisbursementPreview } from './PrintDisbursementPreview'
import { generateDisbursementPDF } from '@/lib/pdf/disbursement-pdf'

interface DisbursementPrintDialogProps {
  order: DisbursementOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisbursementPrintDialog({
  order,
  open,
  onOpenChange,
}: DisbursementPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentRequestItems, setPaymentRequestItems] = useState<PaymentRequestItem[]>([])

  // 直接從 Supabase 取得關聯的請款單和項目
  useEffect(() => {
    if (!open || !order?.payment_request_ids?.length) {
      setPaymentRequests([])
      setPaymentRequestItems([])
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const requestIds = order.payment_request_ids

        // 取得請款單
        const { data: requests } = await supabase
          .from('payment_requests')
          .select('*')
          .in('id', requestIds)

        // 取得請款項目
        const { data: items } = await supabase
          .from('payment_request_items')
          .select('*')
          .in('request_id', requestIds)

        setPaymentRequests(requests || [])
        setPaymentRequestItems(items || [])
      } catch (error) {
        console.error('載入資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, order])

  // 瀏覽器列印
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // 下載 PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!order) return

    try {
      await generateDisbursementPDF({
        order,
        paymentRequests,
        paymentRequestItems,
      })
    } catch (error) {
      console.error('下載 PDF 失敗:', error)
      alert('下載 PDF 失敗')
    }
  }, [order, paymentRequests, paymentRequestItems])

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] overflow-hidden flex flex-col p-0">
        {/* 標題列 */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-morandi-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              列印預覽 - {order.order_number}
            </DialogTitle>
            <div className="flex items-center gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer size={16} />
                列印
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="gap-2"
              >
                <Download size={16} />
                下載 PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 預覽區域 */}
        <div className="flex-1 overflow-auto bg-gray-200 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">載入資料中...</span>
            </div>
          ) : (
            <div className="shadow-lg">
              <PrintDisbursementPreview
                ref={printRef}
                order={order}
                paymentRequests={paymentRequests}
                paymentRequestItems={paymentRequestItems}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DisbursementPrintDialog
