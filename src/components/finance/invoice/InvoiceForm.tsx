'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { TravelInvoiceItem, BuyerInfo } from '@/stores/travel-invoice-store'
import type { Order } from '@/types/order.types'
import type { Tour } from '@/types/tour.types'

interface InvoiceFormProps {
  fixedOrder?: Order
  fixedTour?: Tour
  selectedTourId: string
  selectedOrderId: string
  invoiceDate: string
  reportStatus: 'unreported' | 'reported'
  customNo: string
  buyerInfo: BuyerInfo
  items: TravelInvoiceItem[]
  remark: string
  tourOptions: ComboboxOption[]
  orderOptions: ComboboxOption[]
  ordersLoading: boolean
  toursLoading: boolean
  setSelectedTourId: (value: string) => void
  setSelectedOrderId: (value: string) => void
  setInvoiceDate: (value: string) => void
  setReportStatus: (value: 'unreported' | 'reported') => void
  setCustomNo: (value: string) => void
  setBuyerInfo: (value: BuyerInfo) => void
  setRemark: (value: string) => void
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
  setBuyerInfo,
  setRemark,
  addItem,
  removeItem,
  updateItem,
}: InvoiceFormProps) {
  // 自動判斷 B2B/B2C：有統編就是 B2B
  const isB2B = Boolean(buyerInfo.buyerUBN && buyerInfo.buyerUBN.length > 0)

  return (
    <div className="space-y-4">
      {/* 基本資訊表格 */}
      <table className="w-full border-collapse border border-border">
        <tbody>
          {/* 團別 + 訂單（如果需要選擇） */}
          {(!fixedTour || !fixedOrder) && (
            <tr>
              {!fixedTour && (
                <>
                  <td className="w-24 py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
                    團別
                  </td>
                  <td className="py-1 px-2 border border-border">
                    <Combobox
                      value={selectedTourId}
                      onChange={(value) => {
                        setSelectedTourId(value)
                        setSelectedOrderId('')
                      }}
                      options={tourOptions}
                      placeholder={toursLoading ? "載入中..." : "搜尋團號..."}
                      emptyMessage={toursLoading ? "載入中..." : "找不到符合的團"}
                      showSearchIcon={true}
                      showClearButton={true}
                      disabled={toursLoading}
                      className="input-no-focus [&_button]:border-0 [&_button]:shadow-none [&_button]:bg-transparent"
                    />
                  </td>
                </>
              )}
              {!fixedOrder && (
                <>
                  <td className="w-24 py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
                    訂單
                  </td>
                  <td className="py-1 px-2 border border-border">
                    <Combobox
                      value={selectedOrderId}
                      onChange={setSelectedOrderId}
                      options={orderOptions}
                      placeholder={ordersLoading ? "載入中..." : (selectedTourId || fixedTour ? "搜尋訂單..." : "請先選擇團")}
                      emptyMessage={ordersLoading ? "載入中..." : "找不到符合的訂單"}
                      showSearchIcon={true}
                      showClearButton={true}
                      disabled={(!selectedTourId && !fixedTour) || ordersLoading}
                      className="input-no-focus [&_button]:border-0 [&_button]:shadow-none [&_button]:bg-transparent"
                    />
                  </td>
                </>
              )}
            </tr>
          )}

          {/* 開立日期 + 買受人 */}
          <tr>
            <td className="w-24 py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              開立日期
            </td>
            <td className="py-1 px-2 border border-border">
              <DatePicker
                value={invoiceDate}
                onChange={(date) => setInvoiceDate(date)}
                placeholder="選擇日期"
                className="input-no-focus [&_button]:border-0 [&_button]:shadow-none [&_button]:bg-transparent"
              />
            </td>
            <td className="w-24 py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              {isB2B ? '公司名稱 *' : '買受人 *'}
            </td>
            <td className="py-1 px-2 border border-border">
              <input
                type="text"
                value={buyerInfo.buyerName}
                onChange={e => setBuyerInfo({ ...buyerInfo, buyerName: e.target.value })}
                placeholder={isB2B ? '公司名稱' : '買受人名稱'}
                className="input-no-focus w-full h-9 px-2 bg-transparent text-sm"
              />
            </td>
          </tr>

          {/* 統編 + Email */}
          <tr>
            <td className="py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              統一編號
              <span className="text-xs text-morandi-secondary ml-1">
                {isB2B ? '(B2B)' : '(B2C)'}
              </span>
            </td>
            <td className="py-1 px-2 border border-border">
              <input
                type="text"
                value={buyerInfo.buyerUBN || ''}
                onChange={e => setBuyerInfo({ ...buyerInfo, buyerUBN: e.target.value })}
                placeholder="8 碼數字"
                maxLength={8}
                className="input-no-focus w-full h-9 px-2 bg-transparent text-sm"
              />
            </td>
            <td className="py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              Email
            </td>
            <td className="py-1 px-2 border border-border">
              <input
                type="email"
                value={buyerInfo.buyerEmail || ''}
                onChange={e => setBuyerInfo({ ...buyerInfo, buyerEmail: e.target.value })}
                placeholder="電子收據信箱"
                className="input-no-focus w-full h-9 px-2 bg-transparent text-sm"
              />
            </td>
          </tr>

          {/* 手機 + 申報狀態 */}
          <tr>
            <td className="py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              手機
            </td>
            <td className="py-1 px-2 border border-border">
              <input
                type="text"
                value={buyerInfo.buyerMobile || ''}
                onChange={e => setBuyerInfo({ ...buyerInfo, buyerMobile: e.target.value })}
                placeholder="09xxxxxxxx"
                className="input-no-focus w-full h-9 px-2 bg-transparent text-sm"
              />
            </td>
            <td className="py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              申報狀態
            </td>
            <td className="py-1 px-2 border border-border">
              <div className="flex items-center gap-4 h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportStatus"
                    checked={reportStatus === 'unreported'}
                    onChange={() => setReportStatus('unreported')}
                    className="w-4 h-4 accent-morandi-gold"
                  />
                  <span className="text-sm">未申報</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportStatus"
                    checked={reportStatus === 'reported'}
                    onChange={() => setReportStatus('reported')}
                    className="w-4 h-4 accent-morandi-gold"
                  />
                  <span className="text-sm">已申報</span>
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 商品明細表格 */}
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="text-sm text-morandi-primary font-medium bg-muted/30">
            <th className="text-left py-2 px-3 border border-border">品名</th>
            <th className="text-center py-2 px-3 border border-border w-20">數量</th>
            <th className="text-center py-2 px-3 border border-border w-24">單價</th>
            <th className="text-center py-2 px-3 border border-border w-16">單位</th>
            <th className="text-right py-2 px-3 border border-border w-24">金額</th>
            <th className="border border-border w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="bg-card">
              <td className="py-1 px-1 border border-border">
                <input
                  type="text"
                  value={item.item_name}
                  onChange={e => updateItem(index, 'item_name', e.target.value)}
                  placeholder="商品名稱"
                  className="input-no-focus w-full h-8 px-2 bg-transparent text-sm"
                />
              </td>
              <td className="py-1 px-1 border border-border">
                <input
                  type="number"
                  min="1"
                  value={item.item_count}
                  onChange={e => updateItem(index, 'item_count', parseInt(e.target.value) || 1)}
                  className="input-no-focus w-full h-8 px-2 bg-transparent text-sm text-center"
                />
              </td>
              <td className="py-1 px-1 border border-border">
                <input
                  type="number"
                  min="0"
                  value={item.item_price || ''}
                  onChange={e => updateItem(index, 'item_price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="input-no-focus w-full h-8 px-2 bg-transparent text-sm text-center"
                />
              </td>
              <td className="py-1 px-1 border border-border">
                <input
                  type="text"
                  value={item.item_unit}
                  onChange={e => updateItem(index, 'item_unit', e.target.value)}
                  className="input-no-focus w-full h-8 px-2 bg-transparent text-sm text-center"
                />
              </td>
              <td className="py-1 px-2 border border-border text-right text-sm font-medium bg-muted/20">
                {item.itemAmt.toLocaleString()}
              </td>
              <td className="py-1 px-2 border border-border text-center">
                <span
                  onClick={() => items.length > 1 && removeItem(index)}
                  className={`cursor-pointer text-sm ${items.length > 1 ? 'text-morandi-secondary hover:text-morandi-red' : 'text-morandi-muted cursor-not-allowed'}`}
                >
                  ✕
                </span>
              </td>
            </tr>
          ))}
          {/* 新增行 */}
          <tr className="bg-card hover:bg-muted/10">
            <td
              colSpan={6}
              className="py-2 px-3 border border-border text-center cursor-pointer"
              onClick={addItem}
            >
              <span className="flex items-center justify-center gap-1 text-morandi-gold hover:text-morandi-gold-hover text-sm">
                <Plus size={16} />
                新增品項
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 備註 */}
      <table className="w-full border-collapse border border-border">
        <tbody>
          <tr>
            <td className="w-24 py-2 px-3 border border-border bg-muted/30 text-sm font-medium text-morandi-primary">
              備註
            </td>
            <td className="py-1 px-2 border border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={remark}
                  onChange={e => setRemark(e.target.value.slice(0, 50))}
                  placeholder="備註（限 50 字）"
                  maxLength={50}
                  className="input-no-focus flex-1 h-9 px-2 bg-transparent text-sm"
                />
                <span className="text-xs text-morandi-secondary shrink-0">{remark.length}/50</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
