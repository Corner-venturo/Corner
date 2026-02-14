/**
 * QuickQuoteSection - 團體報價單內嵌的快速報價單區塊
 * 讓同一份報價單可以同時存團體成本計算和快速報價單明細
 */

'use client'

import { QUICK_QUOTE_LABELS } from '../constants/labels'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, ChevronDown, ChevronRight, Printer } from 'lucide-react'
import { QuickQuoteItem } from '@/types/quote.types'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyCell } from '@/components/table-cells'
import { ACCOMMODATION_ITEM_ROW_LABELS, QUICK_QUOTE_DIALOG_LABELS, QUICK_QUOTE_SECTION_LABELS } from '../constants/labels';

interface QuickQuoteSectionProps {
  items: QuickQuoteItem[]
  setItems: (items: QuickQuoteItem[]) => void
  customerInfo: {
    customer_name: string
    contact_phone: string
    contact_address: string
    tour_code: string
    handler_name: string
    issue_date: string
    received_amount: number
    expense_description: string
  }
  setCustomerInfo: (info: QuickQuoteSectionProps['customerInfo']) => void
  isReadOnly: boolean
  onPrint: () => void
}

export const QuickQuoteSection: React.FC<QuickQuoteSectionProps> = ({
  items,
  setItems,
  customerInfo,
  setCustomerInfo,
  isReadOnly,
  onPrint,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // 計算金額
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0)
  const totalProfit = totalAmount - totalCost
  const balanceAmount = totalAmount - customerInfo.received_amount

  // 新增項目
  const addItem = () => {
    const newItem: QuickQuoteItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      notes: '',
    }
    setItems([...items, newItem])
  }

  // 刪除項目
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // 更新項目
  const updateItem = <K extends keyof QuickQuoteItem>(id: string, field: K, value: QuickQuoteItem[K]) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            updated.amount = updated.quantity * updated.unit_price
          }
          return updated
        }
        return item
      })
    )
  }

  // 更新客戶資訊欄位
  const setField = <K extends keyof QuickQuoteSectionProps['customerInfo']>(
    field: K,
    value: QuickQuoteSectionProps['customerInfo'][K]
  ) => {
    setCustomerInfo({ ...customerInfo, [field]: value })
  }

  return (
    <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden">
      {/* 標題列 - 可展開 */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-morandi-container/20 transition-colors',
          isExpanded && 'border-b border-border'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-morandi-secondary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-morandi-secondary" />
          )}
          <h3 className="text-base font-semibold text-morandi-primary">{QUICK_QUOTE_LABELS.TITLE}</h3>
          {items.length > 0 && (
            <span className="text-sm text-morandi-secondary flex items-center gap-1">
              ({items.length} 項目，<CurrencyCell amount={totalAmount} className="inline" />)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {items.length > 0 && (
            <Button
              onClick={onPrint}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              列印
            </Button>
          )}
        </div>
      </div>

      {/* 展開內容 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 客戶資訊 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.CUSTOMER_NAME}</label>
              <Input
                value={customerInfo.customer_name}
                onChange={e => setField('customer_name', e.target.value)}
                disabled={isReadOnly}
                className="mt-1 h-8 text-sm"
                placeholder={QUICK_QUOTE_SECTION_LABELS.客戶名稱}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.PHONE}</label>
              <Input
                value={customerInfo.contact_phone}
                onChange={e => setField('contact_phone', e.target.value)}
                disabled={isReadOnly}
                className="mt-1 h-8 text-sm"
                placeholder={QUICK_QUOTE_SECTION_LABELS.聯絡電話}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.GROUP_NUMBER}</label>
              <Input
                value={customerInfo.tour_code}
                onChange={e => setField('tour_code', e.target.value)}
                disabled={isReadOnly}
                className="mt-1 h-8 text-sm"
                placeholder={QUICK_QUOTE_SECTION_LABELS.團體編號}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.ADDRESS}</label>
              <Input
                value={customerInfo.contact_address}
                onChange={e => setField('contact_address', e.target.value)}
                disabled={isReadOnly}
                className="mt-1 h-8 text-sm"
                placeholder={QUICK_QUOTE_SECTION_LABELS.通訊地址}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.HANDLER}</label>
              <Input
                value={customerInfo.handler_name}
                onChange={e => setField('handler_name', e.target.value)}
                disabled={isReadOnly}
                className="mt-1 h-8 text-sm"
                placeholder={QUICK_QUOTE_SECTION_LABELS.承辦業務}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.ISSUE_DATE}</label>
              <DatePicker
                value={customerInfo.issue_date}
                onChange={(date) => setField('issue_date', date || '')}
                disabled={isReadOnly}
                placeholder={QUICK_QUOTE_DIALOG_LABELS.選擇日期}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* 收費明細表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-morandi-primary">{QUICK_QUOTE_LABELS.FEE_DETAILS}</label>
              {!isReadOnly && (
                <Button onClick={addItem} size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  新增
                </Button>
              )}
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-morandi-container/20">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium">{QUICK_QUOTE_LABELS.SUMMARY}</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium w-16">{QUICK_QUOTE_LABELS.QUANTITY}</th>
                    {!isReadOnly && <th className="px-2 py-1.5 text-center text-xs font-medium w-20">{QUICK_QUOTE_LABELS.COST}</th>}
                    <th className="px-2 py-1.5 text-center text-xs font-medium w-24">{QUICK_QUOTE_LABELS.UNIT_PRICE}</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium w-24">{QUICK_QUOTE_LABELS.AMOUNT}</th>
                    {!isReadOnly && <th className="px-2 py-1.5 text-center text-xs font-medium w-20">{QUICK_QUOTE_LABELS.PROFIT}</th>}
                    <th className="px-2 py-1.5 text-left text-xs font-medium w-24">{QUICK_QUOTE_LABELS.REMARKS}</th>
                    {!isReadOnly && <th className="px-2 py-1.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-2 py-1">
                        <Input
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder={QUICK_QUOTE_DIALOG_LABELS.項目說明}
                          disabled={isReadOnly}
                          className="h-7 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity && item.quantity !== 0 ? item.quantity : ''}
                          onChange={e => {
                            const val = e.target.value.trim()
                            updateItem(item.id, 'quantity', val === '' ? 0 : Number(val) || 0)
                          }}
                          disabled={isReadOnly}
                          className="h-7 text-sm text-center"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={item.cost || ''}
                            onChange={e => {
                              const val = e.target.value.trim()
                              updateItem(item.id, 'cost', val === '' ? 0 : Number(val) || 0)
                            }}
                            className="h-7 text-sm text-right"
                          />
                        </td>
                      )}
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.unit_price || ''}
                          onChange={e => {
                            const val = e.target.value.trim()
                            updateItem(item.id, 'unit_price', val === '' ? 0 : Number(val) || 0)
                          }}
                          disabled={isReadOnly}
                          className="h-7 text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1 text-right">
                        <CurrencyCell amount={item.amount} className="text-sm font-medium justify-end" />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1 text-right">
                          <CurrencyCell
                            amount={(item.unit_price - (item.cost || 0)) * item.quantity}
                            variant={(item.unit_price - (item.cost || 0)) * item.quantity >= 0 ? 'income' : 'expense'}
                            className="text-sm justify-end"
                          />
                        </td>
                      )}
                      <td className="px-2 py-1">
                        <Input
                          value={item.notes}
                          onChange={e => updateItem(item.id, 'notes', e.target.value)}
                          placeholder={ACCOMMODATION_ITEM_ROW_LABELS.備註}
                          disabled={isReadOnly}
                          className="h-7 text-sm"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-morandi-red hover:text-status-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={isReadOnly ? 5 : 8}
                        className="px-2 py-4 text-center text-sm text-morandi-secondary"
                      >
                        尚無項目{!isReadOnly && QUICK_QUOTE_SECTION_LABELS.點擊_新增_開始}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 費用說明 */}
          <div>
            <label className="text-xs font-medium text-morandi-primary">費用說明</label>
            <textarea
              value={customerInfo.expense_description}
              onChange={e => setField('expense_description', e.target.value)}
              placeholder={QUICK_QUOTE_SECTION_LABELS.輸入整體報價說明_例如_含機票_住宿_餐食}
              disabled={isReadOnly}
              className="w-full mt-1 min-h-[60px] p-2 border border-border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 disabled:bg-morandi-container/20"
            />
          </div>

          {/* 金額統計 */}
          <div className={`grid gap-3 ${isReadOnly ? 'grid-cols-3' : 'grid-cols-5'}`}>
            {!isReadOnly && (
              <div className="p-3 bg-morandi-container/10 rounded-lg">
                <label className="text-xs font-medium text-morandi-primary">總成本</label>
                <CurrencyCell amount={totalCost} className="mt-1 text-lg font-bold" />
              </div>
            )}
            <div className="p-3 bg-morandi-container/10 rounded-lg">
              <label className="text-xs font-medium text-morandi-primary">應收金額</label>
              <CurrencyCell amount={totalAmount} className="mt-1 text-lg font-bold" />
            </div>
            {!isReadOnly && (
              <div className="p-3 bg-morandi-container/10 rounded-lg">
                <label className="text-xs font-medium text-morandi-primary">總利潤</label>
                <CurrencyCell
                  amount={totalProfit}
                  variant={totalProfit >= 0 ? 'income' : 'expense'}
                  className="mt-1 text-lg font-bold"
                />
              </div>
            )}
            <div className="p-3 bg-morandi-container/10 rounded-lg">
              <label className="text-xs font-medium text-morandi-primary">已收金額</label>
              {!isReadOnly ? (
                <Input
                  type="text"
                  inputMode="numeric"
                  value={customerInfo.received_amount || ''}
                  onChange={e => {
                    const val = e.target.value.trim()
                    setField('received_amount', val === '' ? 0 : Number(val) || 0)
                  }}
                  className="mt-1 h-8 text-lg font-bold"
                />
              ) : (
                <CurrencyCell amount={customerInfo.received_amount} className="mt-1 text-lg font-bold" />
              )}
            </div>
            <div className="p-3 bg-morandi-container/10 rounded-lg">
              <label className="text-xs font-medium text-morandi-primary">應收餘額</label>
              <CurrencyCell
                amount={balanceAmount}
                variant={balanceAmount > 0 ? 'expense' : 'income'}
                className="mt-1 text-lg font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
