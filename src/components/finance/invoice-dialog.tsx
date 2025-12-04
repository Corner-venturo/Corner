'use client'

/**
 * 開立代轉發票 Dialog
 * 可從發票管理頁面或訂單詳情頁面使用
 */

import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/use-toast'
import { useTravelInvoiceStore, TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import { useOrderStore, useTourStore } from '@/stores'
import type { Order } from '@/types/order.types'
import type { Tour } from '@/types/tour.types'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 預設值（從訂單開啟時使用）
  defaultOrderId?: string
  defaultTourId?: string
  // 如果提供這些，就不需要選擇
  fixedOrder?: Order
  fixedTour?: Tour
}

export function InvoiceDialog({
  open,
  onOpenChange,
  defaultOrderId,
  defaultTourId,
  fixedOrder,
  fixedTour,
}: InvoiceDialogProps) {
  const { toast } = useToast()
  const { issueInvoice, invoices, isLoading, fetchInvoices } = useTravelInvoiceStore()
  const { items: allOrders, fetchAll: fetchOrders, loading: ordersLoading } = useOrderStore()
  const { items: allTours, fetchAll: fetchTours, loading: toursLoading } = useTourStore()

  // 追蹤資料載入狀態
  const [dataLoaded, setDataLoaded] = useState(false)

  // 當 Dialog 開啟時載入資料
  useEffect(() => {
    if (open) {
      setDataLoaded(false)
      Promise.all([fetchTours(), fetchOrders(), fetchInvoices()]).then(() => {
        setDataLoaded(true)
      })
    }
  }, [open, fetchTours, fetchOrders, fetchInvoices])

  // 表單狀態
  const [selectedTourId, setSelectedTourId] = useState<string>(defaultTourId || '')
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrderId || '')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [reportStatus, setReportStatus] = useState<'unreported' | 'reported'>('unreported')
  const [customNo, setCustomNo] = useState('')
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    buyerName: '',
    buyerUBN: '',
    buyerEmail: '',
    buyerMobile: '',
  })
  const [items, setItems] = useState<TravelInvoiceItem[]>([
    { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 },
  ])
  const [remark, setRemark] = useState('')

  // 計算自訂編號：訂單號碼-序號
  const generateCustomNo = (orderId: string, orderNumber: string) => {
    // 計算該訂單已開立的發票數量
    const existingCount = invoices.filter(inv => inv.order_id === orderId).length
    return `${orderNumber}-${existingCount + 1}`
  }

  // 當選擇訂單時，自動帶入資料
  useEffect(() => {
    if (fixedOrder) {
      setBuyerInfo({
        buyerName: fixedOrder.contact_person || '',
        buyerUBN: '',
        buyerEmail: '',
        buyerMobile: fixedOrder.contact_phone || '',
      })
      setCustomNo(generateCustomNo(fixedOrder.id, fixedOrder.order_number))
    } else if (selectedOrderId) {
      const order = allOrders.find(o => o.id === selectedOrderId)
      if (order) {
        setBuyerInfo({
          buyerName: order.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: order.contact_phone || '',
        })
        setCustomNo(generateCustomNo(order.id, order.order_number))
      }
    }
  }, [selectedOrderId, fixedOrder, allOrders, invoices])

  // 當 dialog 開啟時重置表單
  useEffect(() => {
    if (open) {
      setSelectedTourId(defaultTourId || fixedTour?.id || '')
      setSelectedOrderId(defaultOrderId || fixedOrder?.id || '')
      setInvoiceDate(new Date().toISOString().split('T')[0])
      setReportStatus('unreported')
      setRemark('')
      setItems([{ item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])

      if (fixedOrder) {
        setBuyerInfo({
          buyerName: fixedOrder.contact_person || '',
          buyerUBN: '',
          buyerEmail: '',
          buyerMobile: fixedOrder.contact_phone || '',
        })
        setCustomNo(generateCustomNo(fixedOrder.id, fixedOrder.order_number))
      } else {
        setBuyerInfo({ buyerName: '', buyerUBN: '', buyerEmail: '', buyerMobile: '' })
        setCustomNo('')
      }
    }
  }, [open, defaultTourId, defaultOrderId, fixedTour, fixedOrder])

  // 篩選該團的訂單
  const tourOrders = useMemo(() => {
    if (fixedTour) return allOrders.filter(o => o.tour_id === fixedTour.id)
    if (selectedTourId) return allOrders.filter(o => o.tour_id === selectedTourId)
    return []
  }, [selectedTourId, fixedTour, allOrders])

  // 取得當前訂單
  const currentOrder = useMemo(() => {
    if (fixedOrder) return fixedOrder
    return allOrders.find(o => o.id === selectedOrderId)
  }, [fixedOrder, selectedOrderId, allOrders])

  // 團選項（給 Combobox 用）
  const tourOptions: ComboboxOption[] = useMemo(() => {
    return allTours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  }, [allTours])

  // 訂單選項（給 Combobox 用）
  const orderOptions: ComboboxOption[] = useMemo(() => {
    return tourOrders.map(order => ({
      value: order.id,
      label: `${order.order_number} - ${order.contact_person}`,
    }))
  }, [tourOrders])

  // 商品明細操作
  const addItem = () => {
    setItems([...items, { item_name: '', item_count: 1, item_unit: '式', item_price: 0, itemAmt: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof TravelInvoiceItem, value: unknown) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'item_price' || field === 'item_count') {
      const price = Number(field === 'item_price' ? value : newItems[index].item_price)
      const count = Number(field === 'item_count' ? value : newItems[index].item_count)
      newItems[index].itemAmt = price * count
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.itemAmt, 0)

  // 開立發票
  const handleSubmit = async () => {
    if (!buyerInfo.buyerName) {
      toast({ title: '錯誤', description: '請輸入買受人名稱', variant: 'destructive' })
      return
    }
    if (items.some(item => !item.item_name || item.item_price <= 0)) {
      toast({ title: '錯誤', description: '請完整填寫商品資訊', variant: 'destructive' })
      return
    }

    const orderId = fixedOrder?.id || selectedOrderId
    const tourId = fixedTour?.id || selectedTourId

    // 檢查超開提醒
    if (currentOrder && totalAmount > (currentOrder.paid_amount ?? 0)) {
      const confirmed = window.confirm(
        `發票金額 NT$ ${totalAmount.toLocaleString()} 超過已收款金額 NT$ ${(currentOrder.paid_amount ?? 0).toLocaleString()}，確定要開立嗎？`
      )
      if (!confirmed) return
    }

    try {
      await issueInvoice({
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        tax_type: 'dutiable',
        buyerInfo,
        items,
        order_id: orderId || undefined,
        tour_id: tourId || undefined,
        created_by: 'current_user',
      })
      toast({ title: '成功', description: `代轉發票 ${customNo} 開立成功` })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '開立發票失敗',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            開立代轉發票
            {customNo && <span className="text-sm font-normal text-muted-foreground">（{customNo}）</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 選擇團（如果沒有固定團） */}
            {!fixedTour && (
              <div>
                <Label>選擇團 *</Label>
                <Combobox
                  value={selectedTourId}
                  onChange={(value) => {
                    setSelectedTourId(value)
                    setSelectedOrderId('')
                  }}
                  options={tourOptions}
                  placeholder={toursLoading ? "載入中..." : "輸入團號或名稱搜尋..."}
                  emptyMessage={toursLoading ? "載入中..." : "找不到符合的團"}
                  showSearchIcon={true}
                  showClearButton={true}
                  disabled={toursLoading}
                />
              </div>
            )}

            {/* 選擇訂單（如果沒有固定訂單） */}
            {!fixedOrder && (
              <div>
                <Label>選擇訂單 *</Label>
                <Combobox
                  value={selectedOrderId}
                  onChange={setSelectedOrderId}
                  options={orderOptions}
                  placeholder={ordersLoading ? "載入中..." : (selectedTourId ? "輸入訂單編號或聯絡人搜尋..." : "請先選擇團")}
                  emptyMessage={ordersLoading ? "載入中..." : "找不到符合的訂單"}
                  showSearchIcon={true}
                  showClearButton={true}
                  disabled={(!selectedTourId && !fixedTour) || ordersLoading}
                />
              </div>
            )}
          </div>

          {/* 第二排：日期、編號、申報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>開立日期</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
              />
            </div>

            <div>
              <Label>自訂編號</Label>
              <Input
                value={customNo}
                onChange={e => setCustomNo(e.target.value)}
                placeholder="自動產生"
                className="bg-muted/30"
              />
            </div>

            <div>
              <Label>申報註記</Label>
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportStatus"
                    checked={reportStatus === 'unreported'}
                    onChange={() => setReportStatus('unreported')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">未申報</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportStatus"
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
                  value={buyerInfo.buyerName}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerName: e.target.value })}
                  placeholder="請輸入買受人名稱"
                />
              </div>
              <div>
                <Label>統一編號</Label>
                <Input
                  value={buyerInfo.buyerUBN || ''}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerUBN: e.target.value })}
                  placeholder="8 碼數字"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={buyerInfo.buyerEmail || ''}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerEmail: e.target.value })}
                  placeholder="用於寄送電子收據"
                />
              </div>
              <div>
                <Label>手機號碼</Label>
                <Input
                  value={buyerInfo.buyerMobile || ''}
                  onChange={e => setBuyerInfo({ ...buyerInfo, buyerMobile: e.target.value })}
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
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                  <div className="col-span-4">
                    <Input
                      value={item.item_name}
                      onChange={e => updateItem(index, 'item_name', e.target.value)}
                      placeholder="商品名稱"
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      value={item.item_count}
                      onChange={e => updateItem(index, 'item_count', parseInt(e.target.value) || 1)}
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.item_price || ''}
                      onChange={e => updateItem(index, 'item_price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.item_unit}
                      onChange={e => updateItem(index, 'item_unit', e.target.value)}
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
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" />
                新增一列
              </Button>
            </div>

            {/* 備註 */}
            <div className="px-3 py-2 border-t">
              <div className="flex items-center gap-3">
                <Label className="shrink-0">備註</Label>
                <Input
                  value={remark}
                  onChange={e => setRemark(e.target.value.slice(0, 50))}
                  placeholder="請輸入備註（限 50 字）"
                  maxLength={50}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground shrink-0">{remark.length}/50</span>
              </div>
            </div>

            {/* 總計 */}
            <div className="px-3 py-3 border-t bg-muted/30">
              <div className="flex justify-end items-center gap-4">
                <span className="text-sm font-medium">總計</span>
                <span className="text-lg font-bold text-primary">
                  NT$ {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 超開提醒 */}
          {currentOrder && totalAmount > (currentOrder.paid_amount ?? 0) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              ⚠️ 發票金額超過已收款金額！已收款：NT$ {(currentOrder.paid_amount ?? 0).toLocaleString()}
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-center gap-4 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="min-w-[100px] bg-morandi-gold hover:bg-morandi-gold/90 text-white"
            >
              {isLoading ? '開立中...' : '確定開立'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
