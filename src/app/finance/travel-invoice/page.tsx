'use client'

/**
 * 代轉發票管理頁面
 */

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { Plus, Search, FileText, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTravelInvoiceStore } from '@/stores/useTravelInvoiceStore'

export default function TravelInvoicePage() {
  const { invoices, isLoading, error, fetchInvoices } = useTravelInvoiceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch =
      invoice.transactionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.buyerInfo.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter ? invoice.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待處理', variant: 'secondary' },
      issued: { label: '已開立', variant: 'default' },
      voided: { label: '已作廢', variant: 'destructive' },
      allowance: { label: '已折讓', variant: 'outline' },
      failed: { label: '失敗', variant: 'destructive' },
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題列 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">代轉發票管理</h1>
          <p className="text-muted-foreground mt-1">藍新旅行業電子發票系統</p>
        </div>
        <Link href="/finance/travel-invoice/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            開立新發票
          </Button>
        </Link>
      </div>

      {/* 篩選區 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋交易編號、發票號碼、買受人..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="issued">已開立</option>
              <option value="voided">已作廢</option>
              <option value="allowance">已折讓</option>
              <option value="failed">失敗</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 錯誤訊息 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 發票列表 */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">載入中...</p>
            </CardContent>
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">尚無發票資料</p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map(invoice => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{invoice.transactionNo}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.invoiceNumber || '尚未取得發票號碼'}
                    </p>
                  </div>
                  <div className="text-right space-y-2">{getStatusBadge(invoice.status)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">開立日期</p>
                    <p className="font-medium">{invoice.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">買受人</p>
                    <p className="font-medium">{invoice.buyerInfo.buyerName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">金額</p>
                    <p className="font-medium">NT$ {invoice.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-end items-end">
                    <Link href={`/finance/travel-invoice/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        查看詳情
                      </Button>
                    </Link>
                  </div>
                </div>
                {invoice.voidReason && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">作廢原因：</span>
                      {invoice.voidReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
