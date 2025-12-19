'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { Tour, Payment } from '@/stores/types'
import { useOrderStore, useReceiptStore } from '@/stores'
import type { Receipt, ReceiptType } from '@/types/receipt.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import { confirm } from '@/lib/ui/alert-dialog'

interface TourPaymentsProps {
  tour: Tour
  orderFilter?: string // 選填：只顯示特定訂單的收款記錄
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
}

// 擴展 Payment 型別以包含收款專用欄位
interface ReceiptPayment extends Payment {
  method?: string
}

export const TourPayments = React.memo(function TourPayments({
  tour,
  orderFilter,
  triggerAdd,
  onTriggerAddComplete,
}: TourPaymentsProps) {
  const { items: orders } = useOrderStore()
  const { items: receipts, create: createReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { issueInvoice, isLoading: isInvoiceLoading } = useTravelInvoiceStore()
  const { toast } = useToast()

  // 代轉發票 Dialog 狀態
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [invoiceOrderId, setInvoiceOrderId] = useState<string>('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [reportStatus, setReportStatus] = useState<'unreported' | 'reported'>('unreported')
  const [invoiceBuyer, setInvoiceBuyer] = useState<BuyerInfo>({
    buyerName: '',
    buyerUBN: '',
    buyerEmail: '',
    buyerMobile: '',
  })
  const [invoiceItems, setInvoiceItems] = useState<TravelInvoiceItem[]>([
    { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
  ])
  const [invoiceRemark, setInvoiceRemark] = useState('')

  const addPayment = async (data: {
    type?: string
    tour_id: string
    order_id?: string
    amount: number
    description: string
    method: string
    status: string
  }) => {
    try {
      // 找到對應的訂單
      const order = data.order_id ? orders.find(o => o.id === data.order_id) : undefined

      // 轉換付款方式為 ReceiptType
      const receiptTypeMap: Record<string, ReceiptType> = {
        bank_transfer: 0, // 匯款
        cash: 1, // 現金
        credit_card: 2, // 刷卡
        check: 3, // 支票
      }

      const receiptData: Partial<Receipt> = {
        order_id: data.order_id || null,
        order_number: order?.order_number || null,
        tour_name: tour.name || null,
        receipt_date: new Date().toISOString(),
        receipt_type: receiptTypeMap[data.method] || 0,
        receipt_amount: data.amount,
        actual_amount: data.amount,
        status: data.status === '已確認' ? 1 : 0, // 1:已確認 0:待確認
        note: data.description,
        receipt_account: order?.contact_person || null,
      }

      await createReceipt(receiptData as Receipt)
      await fetchReceipts()

      toast({
        title: '成功',
        description: '收款單建立成功',
      })
    } catch (error) {
      logger.error('建立收款單失敗:', error instanceof Error ? error.message : String(error))
      toast({
        title: '錯誤',
        description: '建立收款單失敗',
        variant: 'destructive',
      })
      throw error
    }
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // 監聽外部觸發新增
  React.useEffect(() => {
    if (triggerAdd) {
      setIsAddDialogOpen(true)
      onTriggerAddComplete?.()
    }
  }, [triggerAdd, onTriggerAddComplete])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [newPayment, setNewPayment] = useState<{
    amount: number
    description: string
    method: string
    status: '已確認' | '待確認'
  }>({
    amount: 0,
    description: '',
    method: 'bank_transfer',
    status: '已確認',
  })

  // 獲取屬於這個旅遊團的所有訂單（如果有 orderFilter，則只取該訂單）
  const tourOrders = orders.filter(order => {
    if (orderFilter) {
      return order.id === orderFilter
    }
    return order.tour_id === tour.id
  })

  // 從 receipts store 獲取這個團的收款記錄
  const tourPayments = React.useMemo(() => {
    const tourOrderIds = new Set(tourOrders.map(o => o.id))

    return receipts
      .filter(receipt => {
        // 如果有 orderFilter，只顯示該訂單的收款
        if (orderFilter) {
          return receipt.order_id === orderFilter
        }

        // 否則顯示所有屬於這個團的收款
        return receipt.order_id && tourOrderIds.has(receipt.order_id)
      })
      .map(receipt => ({
        id: receipt.id,
        type: 'receipt' as const,
        tour_id: tour.id,
        order_id: receipt.order_id || undefined,
        amount: receipt.actual_amount,
        description: receipt.note || '',
        status: receipt.status === 1 ? 'confirmed' : 'pending',
        method:
          ['bank_transfer', 'cash', 'credit_card', 'check', 'linkpay'][receipt.receipt_type] ||
          'bank_transfer',
        created_at: receipt.created_at,
      })) as ReceiptPayment[]
  }, [receipts, tourOrders, tour.id, orderFilter])

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.description) return

    addPayment({
      type: 'receipt',
      tour_id: tour.id,
      order_id: selectedOrderId || undefined,
      ...newPayment,
    })

    setNewPayment({
      amount: 0,
      description: '',
      method: 'bank_transfer',
      status: '已確認',
    })
    setSelectedOrderId('')
    setIsAddDialogOpen(false)
  }

  // 發票相關函數
  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
    ])
  }

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
    }
  }

  const updateInvoiceItem = (index: number, field: keyof TravelInvoiceItem, value: unknown) => {
    const newItems = [...invoiceItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'item_price' || field === 'item_count') {
      const price = Number(field === 'item_price' ? value : newItems[index].item_price)
      const count = Number(field === 'item_count' ? value : newItems[index].item_count)
      newItems[index].itemAmt = price * count
    }
    setInvoiceItems(newItems)
  }

  const invoiceTotal = invoiceItems.reduce((sum, item) => sum + item.itemAmt, 0)

  const openInvoiceDialog = (orderId?: string) => {
    // 如果有訂單，預填買受人資料
    if (orderId) {
      const order = tourOrders.find(o => o.id === orderId)
      if (order) {
        setInvoiceBuyer({
          buyerName: order.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: order.contact_phone || '',
        })
        setInvoiceOrderId(orderId)
      }
    } else {
      setInvoiceOrderId('')
    }
    setIsInvoiceDialogOpen(true)
  }

  const handleIssueInvoice = async () => {
    if (!invoiceBuyer.buyerName) {
      toast({ title: '錯誤', description: '請輸入買受人名稱', variant: 'destructive' })
      return
    }
    if (invoiceItems.some(item => !item.item_name || item.item_price <= 0)) {
      toast({ title: '錯誤', description: '請完整填寫商品資訊', variant: 'destructive' })
      return
    }

    // 檢查超開提醒
    if (invoiceOrderId) {
      const order = tourOrders.find(o => o.id === invoiceOrderId)
      if (order && invoiceTotal > (order.paid_amount ?? 0)) {
        const confirmed = await confirm(
          `發票金額 NT$ ${invoiceTotal.toLocaleString()} 超過已收款金額 NT$ ${(order.paid_amount ?? 0).toLocaleString()}，確定要開立嗎？`,
          { title: '金額超開提醒', type: 'warning' }
        )
        if (!confirmed) return
      }
    }

    try {
      await issueInvoice({
        invoice_date: invoiceDate,
        total_amount: invoiceTotal,
        tax_type: 'dutiable',
        buyerInfo: invoiceBuyer,
        items: invoiceItems,
        order_id: invoiceOrderId || undefined,
        tour_id: tour.id,
        created_by: 'current_user',
      })
      toast({ title: '成功', description: '代轉發票開立成功' })
      setIsInvoiceDialogOpen(false)
      // 重置表單
      setInvoiceBuyer({ buyerName: '', buyerUBN: '', buyerEmail: '', buyerMobile: '' })
      setInvoiceItems([{ item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])
      setInvoiceRemark('')
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '開立發票失敗',
        variant: 'destructive',
      })
    }
  }

  // 統計數據計算
  const confirmedPayments = tourPayments.filter(p => p.status === 'confirmed')
  const pendingPayments = tourPayments.filter(p => p.status === 'pending')
  const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPayments = totalConfirmed + totalPending

  // 計算應收金額 (基於訂單)
  const totalOrderAmount = tourOrders.reduce((sum, order) => sum + (order.total_amount ?? 0), 0)
  const remaining_amount = Math.max(0, totalOrderAmount - totalConfirmed)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: '已確認',
      pending: '待確認',
      completed: '已完成',
    }
    const badges: Record<string, string> = {
      已確認: 'bg-morandi-green text-white',
      待確認: 'bg-morandi-gold text-white',
      已完成: 'bg-morandi-container text-morandi-primary',
    }
    return badges[statusMap[status] || status] || 'bg-morandi-container text-morandi-secondary'
  }

  const getMethodBadge = (method: string) => {
    const badges: Record<string, string> = {
      bank_transfer: 'bg-blue-100 text-blue-800',
      credit_card: 'bg-purple-100 text-purple-800',
      cash: 'bg-green-100 text-green-800',
      check: 'bg-yellow-100 text-yellow-800',
    }
    return badges[method] || 'bg-gray-100 text-gray-800'
  }

  const getMethodDisplayName = (method: string) => {
    const names: Record<string, string> = {
      bank_transfer: '銀行轉帳',
      credit_card: '信用卡',
      cash: '現金',
      check: '支票',
    }
    return names[method] || method
  }

  const getPaymentTypeIcon = (type: Payment['type']) => {
    if (type === 'receipt') return <TrendingUp size={16} className="text-morandi-green" />
    if (type === 'request') return <TrendingDown size={16} className="text-morandi-red" />
    return <CreditCard size={16} className="text-morandi-gold" />
  }

  return (
    <div className="space-y-6">
      {/* 收款統計 */}
      <div className="bg-morandi-container/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">收款概況</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-green">
              NT$ {totalConfirmed.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">已收款</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-gold">
              NT$ {totalPending.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">待確認</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-primary">
              NT$ {totalPayments.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">總收款</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-morandi-red">
              NT$ {remaining_amount.toLocaleString()}
            </div>
            <div className="text-sm text-morandi-secondary">待收款</div>
          </div>
        </div>
      </div>

      {/* 收款紀錄表格 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-morandi-container/30">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  日期
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  類型
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  金額
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  說明
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  付款方式
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  訂單
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  狀態
                </th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tourPayments.length > 0 ? (
                tourPayments.map(payment => {
                  const relatedOrder = tourOrders.find(order => order.id === payment.order_id)

                  return (
                    <tr key={payment.id} className="border-b border-border/30">
                      <td className="py-3 px-4 text-morandi-primary">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentTypeIcon(payment.type)}
                          <span className="text-morandi-primary">
                            {payment.type === 'receipt'
                              ? '收款'
                              : payment.type === 'request'
                                ? '請款'
                                : '出納'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'font-medium',
                            payment.type === 'receipt' ? 'text-morandi-green' : 'text-morandi-red'
                          )}
                        >
                          {payment.type === 'receipt' ? '+' : '-'} NT${' '}
                          {payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-morandi-primary">{payment.description}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            getMethodBadge(payment.method || '')
                          )}
                        >
                          {getMethodDisplayName(payment.method || '')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-morandi-primary">
                        {relatedOrder ? relatedOrder.order_number : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            getStatusBadge(payment.status)
                          )}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInvoiceDialog(payment.order_id)}
                          className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                          title="開立代轉發票"
                        >
                          <FileText size={14} className="mr-1" />
                          開代轉
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-morandi-secondary">
                    <DollarSign size={24} className="mx-auto mb-4 opacity-50" />
                    <p>尚無收款紀錄</p>
                    <p className="text-sm mt-1">點擊上方「新增收款」按鈕開始記錄收款</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增收款對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增收款紀錄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">關聯訂單 (選填)</label>
              <Select
                value={selectedOrderId}
                onValueChange={value => setSelectedOrderId(value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="- 不關聯特定訂單 -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">- 不關聯特定訂單 -</SelectItem>
                  {tourOrders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.contact_person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">收款金額</label>
              <Input
                type="number"
                value={newPayment.amount || ''}
                onChange={e => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">收款說明</label>
              <Input
                value={newPayment.description}
                onChange={e => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例：王小明訂金"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">付款方式</label>
              <Select
                value={newPayment.method}
                onValueChange={value => setNewPayment(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">銀行轉帳</SelectItem>
                  <SelectItem value="credit_card">信用卡</SelectItem>
                  <SelectItem value="cash">現金</SelectItem>
                  <SelectItem value="check">支票</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">確認狀態</label>
              <Select
                value={newPayment.status}
                onValueChange={value => setNewPayment(prev => ({ ...prev, status: value as '已確認' | '待確認' }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="已確認">已確認</SelectItem>
                  <SelectItem value="待確認">待確認</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleAddPayment}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 開立代轉發票對話框 */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              開立代轉發票
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>開立日期</Label>
                <DatePicker
                  value={invoiceDate}
                  onChange={(date) => setInvoiceDate(date)}
                  placeholder="選擇日期"
                />
              </div>
              <div>
                <Label>關聯訂單</Label>
                <Select
                  value={invoiceOrderId}
                  onValueChange={orderId => {
                    setInvoiceOrderId(orderId)
                    if (orderId) {
                      const order = tourOrders.find(o => o.id === orderId)
                      if (order) {
                        setInvoiceBuyer({
                          ...invoiceBuyer,
                          buyerName: order.contact_person || '',
                          buyerMobile: order.contact_phone || '',
                        })
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="- 不關聯訂單 -" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">- 不關聯訂單 -</SelectItem>
                    {tourOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.contact_person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>申報註記</Label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceReportStatus"
                      checked={reportStatus === 'unreported'}
                      onChange={() => setReportStatus('unreported')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">未申報</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceReportStatus"
                      checked={reportStatus === 'reported'}
                      onChange={() => setReportStatus('reported')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">已申報</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 買受人資訊 */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-3">買受人資訊</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>買受人名稱 *</Label>
                  <Input
                    value={invoiceBuyer.buyerName}
                    onChange={e => setInvoiceBuyer({ ...invoiceBuyer, buyerName: e.target.value })}
                    placeholder="請輸入買受人名稱"
                  />
                </div>
                <div>
                  <Label>統一編號</Label>
                  <Input
                    value={invoiceBuyer.buyerUBN || ''}
                    onChange={e => setInvoiceBuyer({ ...invoiceBuyer, buyerUBN: e.target.value })}
                    placeholder="8 碼數字"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={invoiceBuyer.buyerEmail || ''}
                    onChange={e => setInvoiceBuyer({ ...invoiceBuyer, buyerEmail: e.target.value })}
                    placeholder="用於寄送電子收據"
                  />
                </div>
                <div>
                  <Label>手機號碼</Label>
                  <Input
                    value={invoiceBuyer.buyerMobile || ''}
                    onChange={e => setInvoiceBuyer({ ...invoiceBuyer, buyerMobile: e.target.value })}
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* 商品明細 - 表格式 */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
                <div className="col-span-4">摘要</div>
                <div className="col-span-1 text-center">數量</div>
                <div className="col-span-2 text-right">單價</div>
                <div className="col-span-2 text-center">單位</div>
                <div className="col-span-2 text-right">金額</div>
                <div className="col-span-1 text-center">處理</div>
              </div>

              <div className="divide-y">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-4">
                      <Input
                        value={item.item_name}
                        onChange={e => updateInvoiceItem(index, 'item_name', e.target.value)}
                        placeholder="商品名稱"
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.item_count}
                        onChange={e => updateInvoiceItem(index, 'item_count', parseInt(e.target.value) || 1)}
                        className="h-8 text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.item_price || ''}
                        onChange={e => updateInvoiceItem(index, 'item_price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={item.item_unit}
                        onChange={e => updateInvoiceItem(index, 'item_unit', e.target.value)}
                        className="h-8 text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="h-8 flex items-center justify-end px-2 bg-muted/30 rounded text-sm font-medium">
                        {item.itemAmt.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceItems.length <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  新增一列
                </Button>
              </div>

              {/* 備註 */}
              <div className="px-3 py-2 border-t">
                <div className="flex items-center gap-3">
                  <Label className="shrink-0">備註</Label>
                  <Input
                    value={invoiceRemark}
                    onChange={e => setInvoiceRemark(e.target.value.slice(0, 50))}
                    placeholder="請輸入備註（限 50 字）"
                    maxLength={50}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {invoiceRemark.length}/50
                  </span>
                </div>
              </div>

              {/* 總計 */}
              <div className="px-3 py-3 border-t bg-muted/30">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-sm font-medium">總計</span>
                  <span className="text-lg font-bold text-primary">
                    NT$ {invoiceTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 超開提醒 */}
            {invoiceOrderId && (() => {
              const order = tourOrders.find(o => o.id === invoiceOrderId)
              if (order && invoiceTotal > (order.paid_amount ?? 0)) {
                return (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    ⚠️ 發票金額超過已收款金額！已收款：NT$ {(order.paid_amount ?? 0).toLocaleString()}
                  </div>
                )
              }
              return null
            })()}

            {/* 按鈕 */}
            <div className="flex justify-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsInvoiceDialogOpen(false)}
                className="min-w-[100px]"
              >
                取消
              </Button>
              <Button
                onClick={handleIssueInvoice}
                disabled={isInvoiceLoading}
                className="min-w-[100px]"
              >
                {isInvoiceLoading ? '開立中...' : '確定開立'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
