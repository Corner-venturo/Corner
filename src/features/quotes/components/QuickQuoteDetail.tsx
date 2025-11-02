/**
 * QuickQuoteDetail - 快速報價單詳細頁面
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Trash2, Plus, Printer } from 'lucide-react'
import { Quote, QuickQuoteItem } from '@/types/quote.types'
import { PrintableQuickQuote } from './PrintableQuickQuote'

interface QuickQuoteDetailProps {
  quote: Quote
  onUpdate: (data: Partial<Quote>) => Promise<void>
}

export const QuickQuoteDetail: React.FC<QuickQuoteDetailProps> = ({ quote, onUpdate }) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    customer_name: quote.customer_name || '',
    contact_phone: quote.contact_phone || '',
    contact_address: quote.contact_address || '',
    tour_code: quote.tour_code || '',
    handler_name: quote.handler_name || 'William',
    issue_date: quote.issue_date || new Date().toISOString().split('T')[0],
    received_amount: quote.received_amount || 0,
  })

  // 從 quote.quick_quote_items 載入項目（初始化時）
  const [items, setItems] = useState<QuickQuoteItem[]>(() => {
    return quote.quick_quote_items || []
  })

  // 當重新整理頁面時（quote.id 變化），重新載入 items
  const [loadedQuoteId, setLoadedQuoteId] = useState(quote.id)
  useEffect(() => {
    if (quote.id !== loadedQuoteId) {
      setItems(quote.quick_quote_items || [])
      setLoadedQuoteId(quote.id)
    }
  }, [quote.id, loadedQuoteId, quote.quick_quote_items])

  const setFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 計算應收金額
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  // 計算應收餘額
  const balanceAmount = totalAmount - formData.received_amount

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
    setIsEditing(true)
  }

  // 刪除項目
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // 更新項目
  const updateItem = (id: string, field: keyof QuickQuoteItem, value: any) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          // 自動計算金額
          if (field === 'quantity' || field === 'unit_price') {
            updated.amount = updated.quantity * updated.unit_price
          }
          return updated
        }
        return item
      })
    )
  }

  // 儲存變更
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        customer_name: formData.customer_name,
        contact_phone: formData.contact_phone,
        contact_address: formData.contact_address,
        tour_code: formData.tour_code,
        handler_name: formData.handler_name,
        issue_date: formData.issue_date,
        total_amount: totalAmount,
        received_amount: formData.received_amount,
        quick_quote_items: items, // ✅ 儲存 items 到 quick_quote_items 欄位
      })
      setIsEditing(false)
      alert('儲存成功！')
    } catch (error) {
      console.error('Save error:', error)
      alert('儲存失敗：' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  // 列印預覽
  const handlePrintPreview = () => {
    setShowPrintPreview(true)
  }

  // 列印
  const handlePrint = async () => {
    window.print()

    // 列印後自動更新狀態為「已請款」
    try {
      await onUpdate({ status: 'billed' })
      setShowPrintPreview(false)
    } catch (error) {
      console.error('更新狀態失敗:', error)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-6">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/quotes')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回報價單列表
        </Button>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button onClick={handlePrintPreview} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                列印
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                編輯
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '儲存中...' : '儲存'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 標題 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-morandi-primary">快速報價單</h1>
            <p className="text-sm text-morandi-secondary mt-1">
              報價單編號：{quote.code || '-'}
              {formData.customer_name && ` | 客戶：${formData.customer_name}`}
            </p>
          </div>
          <div className="px-4 py-2 bg-morandi-green/10 text-morandi-green rounded-lg text-sm font-medium">
            快速報價單
          </div>
        </div>
      </div>

      {/* 客戶資訊 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-morandi-primary mb-4">客戶資訊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">客戶名稱</label>
            <Input
              value={formData.customer_name}
              onChange={e => setFormField('customer_name', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
            <Input
              value={formData.contact_phone}
              onChange={e => setFormField('contact_phone', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">通訊地址</label>
            <Input
              value={formData.contact_address}
              onChange={e => setFormField('contact_address', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">團體編號</label>
            <Input
              value={formData.tour_code}
              onChange={e => setFormField('tour_code', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">承辦業務</label>
            <Input
              value={formData.handler_name}
              onChange={e => setFormField('handler_name', e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary">開單日期</label>
            <Input
              type="date"
              value={formData.issue_date}
              onChange={e => setFormField('issue_date', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* 收費明細表 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-morandi-primary">收費明細表</h2>
          {isEditing && (
            <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              新增項目
            </Button>
          )}
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-morandi-container/20">
              <tr>
                <th className="px-3 py-2 text-left">摘要</th>
                <th className="px-3 py-2 text-center w-20">數量</th>
                <th className="px-3 py-2 text-center w-28">單價</th>
                <th className="px-3 py-2 text-center w-28">金額</th>
                <th className="px-3 py-2 text-left w-32">備註</th>
                {isEditing && <th className="px-3 py-2 text-center w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Input
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      placeholder="項目說明"
                      disabled={!isEditing}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => {
                        let val = e.target.value
                        // 全形轉半形
                        val = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                        val = val.replace(/[．]/g, '.')
                        val = val.replace(/[－]/g, '-')

                        // 允許空值和負數
                        if (val === '' || val === '-') {
                          updateItem(item.id, 'quantity', 0)
                        } else {
                          const num = parseFloat(val)
                          if (!isNaN(num)) {
                            updateItem(item.id, 'quantity', num)
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      disabled={!isEditing}
                      className="h-8 text-center"
                      step="0.01"
                      placeholder=""
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={item.unit_price === 0 ? '' : item.unit_price}
                      onChange={e => {
                        let val = e.target.value
                        // 全形轉半形
                        val = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                        val = val.replace(/[．]/g, '.')
                        val = val.replace(/[－]/g, '-')

                        // 允許空值和負數
                        if (val === '' || val === '-') {
                          updateItem(item.id, 'unit_price', 0)
                        } else {
                          const num = parseFloat(val)
                          if (!isNaN(num)) {
                            updateItem(item.id, 'unit_price', num)
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      disabled={!isEditing}
                      className="h-8 text-right"
                      step="0.01"
                      placeholder=""
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {item.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.notes}
                      onChange={e => updateItem(item.id, 'notes', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      placeholder="備註"
                      disabled={!isEditing}
                      className="h-8"
                    />
                  </td>
                  {isEditing && (
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-morandi-red hover:text-red-700"
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
                    colSpan={isEditing ? 6 : 5}
                    className="px-3 py-8 text-center text-morandi-secondary"
                  >
                    尚無項目
                    {isEditing && '，點擊「新增項目」開始'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 金額統計 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-morandi-primary mb-4">金額統計</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">應收金額</label>
            <div className="mt-1 text-2xl font-bold text-morandi-primary">
              NT$ {totalAmount.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">已收金額</label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.received_amount === 0 ? '' : formData.received_amount}
                onChange={e => {
                  let val = e.target.value
                  // 全形轉半形
                  val = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                  val = val.replace(/[．]/g, '.')
                  val = val.replace(/[－]/g, '-')

                  // 允許空值和負數
                  if (val === '' || val === '-') {
                    setFormField('received_amount', 0)
                  } else {
                    const num = parseFloat(val)
                    if (!isNaN(num)) {
                      setFormField('received_amount', num)
                    }
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                className="mt-1 text-xl font-bold"
                step="0.01"
                placeholder=""
              />
            ) : (
              <div className="mt-1 text-2xl font-bold text-morandi-primary">
                NT$ {formData.received_amount.toLocaleString()}
              </div>
            )}
          </div>
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">應收餘額</label>
            <div
              className={`mt-1 text-2xl font-bold ${
                balanceAmount > 0 ? 'text-morandi-red' : 'text-morandi-green'
              }`}
            >
              NT$ {balanceAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 列印預覽對話框 */}
      <PrintableQuickQuote
        quote={quote}
        items={items}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onPrint={handlePrint}
      />
    </div>
  )
}
