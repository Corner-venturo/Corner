'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { TravelInvoiceItem, BuyerInfo } from '@/stores/useTravelInvoiceStore'
import type { Order } from '@/types/order.types'
import type { Tour } from '@/types/tour.types'

interface InvoiceFormProps {
  // 固定值
  fixedOrder?: Order
  fixedTour?: Tour

  // 表單狀態
  selectedTourId: string
  selectedOrderId: string
  invoiceDate: string
  reportStatus: 'unreported' | 'reported'
  customNo: string
  buyerInfo: BuyerInfo
  items: TravelInvoiceItem[]
  remark: string

  // 選項
  tourOptions: ComboboxOption[]
  orderOptions: ComboboxOption[]

  // 載入狀態
  ordersLoading: boolean
  toursLoading: boolean

  // Setters
  setSelectedTourId: (value: string) => void
  setSelectedOrderId: (value: string) => void
  setInvoiceDate: (value: string) => void
  setReportStatus: (value: 'unreported' | 'reported') => void
  setCustomNo: (value: string) => void
  setBuyerInfo: (value: BuyerInfo) => void
  setRemark: (value: string) => void

  // Actions
  addItem: () => void
  removeItem: (index: number) => void
  updateItem: (index: number, field: keyof TravelInvoiceItem, value: unknown) => void
}

export function InvoiceForm({
  fixedOrder,
  fixedTour,
  selectedTourId,
  selectedOrderId,
  invoiceDate,
  reportStatus,
  customNo,
  buyerInfo,
  items,
  remark,
  tourOptions,
  orderOptions,
  ordersLoading,
  toursLoading,
  setSelectedTourId,
  setSelectedOrderId,
  setInvoiceDate,
  setReportStatus,
  setCustomNo,
  setBuyerInfo,
  setRemark,
  addItem,
  removeItem,
  updateItem,
}: InvoiceFormProps) {
  return (
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
          <DatePicker
            value={invoiceDate}
            onChange={(date) => setInvoiceDate(date)}
            placeholder="選擇日期"
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
      </div>
    </div>
  )
}
