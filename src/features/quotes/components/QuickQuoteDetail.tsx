/**
 * QuickQuoteDetail - 快速報價單詳細頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Trash2, Plus, Printer, FilePlus, History, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Quote, QuickQuoteItem, QuoteVersion } from '@/stores/types'
import { PrintableQuickQuote } from './PrintableQuickQuote'

interface QuickQuoteDetailProps {
  quote: Quote
  onUpdate: (data: Partial<Quote>) => Promise<void> | Promise<Quote>
}

export const QuickQuoteDetail: React.FC<QuickQuoteDetailProps> = ({ quote, onUpdate }) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [currentEditingVersion, setCurrentEditingVersion] = useState<number | null>(null)

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

  // 從 quote_items 表格載入項目
  const [items, setItems] = useState<QuickQuoteItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)

  useEffect(() => {
    // ✅ 快速報價單項目只從 quote.quick_quote_items 欄位讀取
    if (quote.quick_quote_items && Array.isArray(quote.quick_quote_items)) {
      setItems(quote.quick_quote_items as QuickQuoteItem[])
    } else {
      // 如果沒有項目，設為空陣列
      setItems([])
    }
    setIsLoadingItems(false)
  }, [quote.quick_quote_items])

  const setFormField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
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

  // 計算總成本
  const totalCost = items.reduce((sum, item) => sum + ((item as any).cost || 0) * item.quantity, 0)

  // 計算利潤
  const totalProfit = totalAmount - totalCost

  // 刪除項目
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

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

  // 準備版本資料的通用函數
  const prepareVersionData = (versionNumber: number, versionName: string) => ({
    id: Date.now().toString(),
    quote_id: quote.id,
    version: versionNumber,
    version_name: versionName,
    customer_name: formData.customer_name,
    contact_phone: formData.contact_phone,
    contact_address: formData.contact_address,
    tour_code: formData.tour_code,
    handler_name: formData.handler_name,
    issue_date: formData.issue_date,
    total_amount: totalAmount,
    total_cost: totalCost,
    received_amount: formData.received_amount,
    balance_amount: totalAmount - formData.received_amount,
    items: items,
    created_at: new Date().toISOString(),
  })

  // 儲存變更
  const handleSave = async (showAlert = false) => {
    setIsSaving(true)
    try {
      const baseUpdate = {
        customer_name: formData.customer_name,
        contact_phone: formData.contact_phone,
        contact_address: formData.contact_address,
        tour_code: formData.tour_code,
        handler_name: formData.handler_name,
        issue_date: formData.issue_date,
        total_amount: totalAmount,
        total_cost: totalCost,
        received_amount: formData.received_amount,
        balance_amount: totalAmount - formData.received_amount,
        quick_quote_items: items,
      }

      const existingVersions = quote.versions || []

      // 如果正在編輯某個版本，更新該版本
      if (currentEditingVersion !== null && existingVersions.length > 0) {
        const updatedVersions = [...existingVersions]
        updatedVersions[currentEditingVersion] = {
          ...updatedVersions[currentEditingVersion],
          ...prepareVersionData(
            updatedVersions[currentEditingVersion].version,
            (updatedVersions[currentEditingVersion] as any).version_name || `版本 ${updatedVersions[currentEditingVersion].version}`
          ),
        } as QuoteVersion

        await onUpdate({
          ...baseUpdate,
          versions: updatedVersions,
        })
      } else if (existingVersions.length === 0) {
        // 第一次儲存：自動建立版本 1，版本名稱使用客戶名稱
        const versionName = formData.customer_name || '版本 1'
        const firstVersion = prepareVersionData(1, versionName)

        await onUpdate({
          ...baseUpdate,
          version: 1,
          versions: [firstVersion as unknown as QuoteVersion],
        })
        setCurrentEditingVersion(0)
      } else {
        // 有版本記錄但沒有編輯特定版本，只更新主資料
        await onUpdate(baseUpdate)
      }

      logger.log('✅ [QuickQuote] 儲存成功')
      if (showAlert) {
        setIsEditing(false)
      }
    } catch (error) {
      logger.error('❌ [QuickQuote] 儲存失敗:', error)
      if (showAlert) {
        alert('儲存失敗：' + (error as Error).message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // 儲存版本對話框狀態
  const [isSaveVersionDialogOpen, setIsSaveVersionDialogOpen] = useState(false)
  const [versionName, setVersionName] = useState('')

  // 另存新版本
  const handleSaveAsNewVersion = async () => {
    if (!versionName.trim()) {
      alert('請輸入版本名稱')
      return
    }

    setIsSaving(true)
    try {
      const existingVersions = quote.versions || []
      const maxVersion = existingVersions.reduce((max, v) =>
        Math.max(max, v.version || 0), 0
      )
      const newVersionNumber = maxVersion + 1

      const newVersionData = prepareVersionData(newVersionNumber, versionName.trim())
      const newVersions = [...existingVersions, newVersionData]

      await onUpdate({
        customer_name: formData.customer_name,
        contact_phone: formData.contact_phone,
        contact_address: formData.contact_address,
        tour_code: formData.tour_code,
        handler_name: formData.handler_name,
        issue_date: formData.issue_date,
        total_amount: totalAmount,
        total_cost: totalCost,
        received_amount: formData.received_amount,
        balance_amount: totalAmount - formData.received_amount,
        quick_quote_items: items,
        version: newVersionNumber,
        versions: newVersions as unknown as QuoteVersion[],
      })

      // 設定當前編輯版本為新版本
      setCurrentEditingVersion(newVersions.length - 1)
      setIsSaveVersionDialogOpen(false)
      setVersionName('')
      logger.log('✅ [QuickQuote] 新版本儲存成功')
    } catch (error) {
      logger.error('❌ [QuickQuote] 儲存版本失敗:', error)
      alert('版本儲存失敗：' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  // 刪除版本
  const handleDeleteVersion = async (versionIndex: number) => {
    const versions = quote.versions || []
    if (versions.length <= 1) {
      alert('至少需要保留一個版本')
      return
    }

    if (!confirm(`確定要刪除「${(versions[versionIndex] as any).version_name || `版本 ${versions[versionIndex].version}`}」嗎？`)) {
      return
    }

    try {
      const newVersions = versions.filter((_, idx) => idx !== versionIndex)
      await onUpdate({ versions: newVersions })

      // 如果刪除的是當前編輯版本，重設
      if (currentEditingVersion === versionIndex) {
        setCurrentEditingVersion(null)
      } else if (currentEditingVersion !== null && currentEditingVersion > versionIndex) {
        setCurrentEditingVersion(currentEditingVersion - 1)
      }

      logger.log('✅ [QuickQuote] 版本刪除成功')
    } catch (error) {
      logger.error('❌ [QuickQuote] 刪除版本失敗:', error)
      alert('刪除版本失敗')
    }
  }

  // 載入版本
  const handleLoadVersion = (versionIndex: number) => {
    const versions = quote.versions || []

    if (versionIndex < 0 || versionIndex >= versions.length) return

    const versionData = versions[versionIndex] as any

    // 更新表單資料
    setFormData({
      customer_name: versionData.customer_name || '',
      contact_phone: versionData.contact_phone || '',
      contact_address: versionData.contact_address || '',
      tour_code: versionData.tour_code || '',
      handler_name: versionData.handler_name || 'William',
      issue_date: versionData.issue_date || new Date().toISOString().split('T')[0],
      received_amount: versionData.received_amount || 0,
    })

    // 更新項目
    if (versionData.items) {
      setItems(versionData.items)
    }

    // 設定當前編輯版本
    setCurrentEditingVersion(versionIndex)
  }

  // 格式化日期時間
  const formatDateTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 版本歷史 hover 狀態
  const [hoveredVersionIndex, setHoveredVersionIndex] = useState<number | null>(null)

  // 列印預覽
  const handlePrintPreview = () => {
    setShowPrintPreview(true)
  }

  // 列印
  const handlePrint = async () => {
    window.print()

    // 列印後自動更新狀態為「已請款」
    try {
      await onUpdate({ status: 'billed' as any })
      setShowPrintPreview(false)
    } catch (error) {
      logger.error('更新狀態失敗:', error)
    }
  }

  return (
    <>
      <ResponsiveHeader
        title={`快速報價單 ${quote.code || ''}`}
        showBackButton={true}
        onBack={() => router.push('/quotes')}
        actions={
          <div className="flex items-center gap-2">
            {/* 非編輯模式 */}
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
            {/* 編輯模式 */}
            {isEditing && (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  取消
                </Button>
                {/* 版本歷史下拉選單 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <History className="h-4 w-4" />
                      版本歷史
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72" align="end">
                    <div className="px-2 py-1.5 text-sm font-medium text-morandi-primary border-b border-border">
                      版本歷史
                    </div>
                    {quote.versions && quote.versions.length > 0 ? (
                      <>
                        {[...quote.versions]
                          .sort((a, b) => b.version - a.version)
                          .map((version, sortedIndex) => {
                            const originalIndex = quote.versions!.findIndex(v => v.id === version.id)
                            const isCurrentEditing = currentEditingVersion === originalIndex
                            return (
                              <DropdownMenuItem
                                key={version.id || sortedIndex}
                                className="flex items-center justify-between py-2 cursor-pointer hover:bg-morandi-container/30 relative"
                                onMouseEnter={() => setHoveredVersionIndex(originalIndex)}
                                onMouseLeave={() => setHoveredVersionIndex(null)}
                                onClick={() => handleLoadVersion(originalIndex)}
                              >
                                <div className="flex flex-col flex-1">
                                  <span className="font-medium">
                                    {(version as any).version_name || `版本 ${version.version}`}
                                  </span>
                                  <span className="text-xs text-morandi-secondary">
                                    {formatDateTime(version.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-morandi-secondary">
                                    NT$ {((version as any).total_amount || 0).toLocaleString()}
                                  </div>
                                  {isCurrentEditing && (
                                    <div className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">當前</div>
                                  )}
                                  {hoveredVersionIndex === originalIndex && quote.versions!.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteVersion(originalIndex)
                                      }}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="刪除版本"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </DropdownMenuItem>
                            )
                          })}
                      </>
                    ) : (
                      <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                        尚無版本，點擊「儲存」創建第一個版本
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => setIsSaveVersionDialogOpen(true)}
                  disabled={isSaving}
                  variant="outline"
                  className="gap-2"
                >
                  <FilePlus className="h-4 w-4" />
                  另存新版本
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? '儲存中...' : '儲存'}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
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
                <th className="px-3 py-2 text-center w-20">人數</th>
                {isEditing && <th className="px-3 py-2 text-center w-24">成本</th>}
                <th className="px-3 py-2 text-center w-28">單價</th>
                <th className="px-3 py-2 text-center w-28">金額</th>
                {isEditing && <th className="px-3 py-2 text-center w-24">利潤</th>}
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
                      type="text"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => {
                        let val = e.target.value
                        // 全形轉半形
                        val = val.replace(/[０-９]/g, s =>
                          String.fromCharCode(s.charCodeAt(0) - 0xfee0)
                        )
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
                      placeholder=""
                    />
                  </td>
                  {isEditing && (
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        value={(item as any).cost === 0 || (item as any).cost === undefined ? '' : (item as any).cost}
                        onChange={e => {
                          let val = e.target.value
                          val = val.replace(/[０-９]/g, s =>
                            String.fromCharCode(s.charCodeAt(0) - 0xfee0)
                          )
                          val = val.replace(/[．]/g, '.')
                          val = val.replace(/[－]/g, '-')

                          if (val === '' || val === '-') {
                            updateItem(item.id, 'cost' as any, 0)
                          } else {
                            const num = parseFloat(val)
                            if (!isNaN(num)) {
                              updateItem(item.id, 'cost' as any, num)
                            }
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                          }
                        }}
                        className="h-8 text-right"
                        placeholder=""
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      value={item.unit_price === 0 ? '' : item.unit_price}
                      onChange={e => {
                        let val = e.target.value
                        // 全形轉半形
                        val = val.replace(/[０-９]/g, s =>
                          String.fromCharCode(s.charCodeAt(0) - 0xfee0)
                        )
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
                      placeholder=""
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {item.amount.toLocaleString()}
                  </td>
                  {isEditing && (
                    <td className="px-3 py-2 text-right font-medium">
                      <span className={((item.unit_price - ((item as any).cost || 0)) * item.quantity) >= 0 ? 'text-morandi-green' : 'text-morandi-red'}>
                        {((item.unit_price - ((item as any).cost || 0)) * item.quantity).toLocaleString()}
                      </span>
                    </td>
                  )}
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
                    colSpan={isEditing ? 8 : 5}
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
        <div className={`grid gap-4 ${isEditing ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {isEditing && (
            <div className="p-4 bg-morandi-container/10 rounded-lg">
              <label className="text-sm font-medium text-morandi-secondary">總成本</label>
              <div className="mt-1 text-2xl font-bold text-morandi-primary">
                NT$ {totalCost.toLocaleString()}
              </div>
            </div>
          )}
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">應收金額</label>
            <div className="mt-1 text-2xl font-bold text-morandi-primary">
              NT$ {totalAmount.toLocaleString()}
            </div>
          </div>
          {isEditing && (
            <div className="p-4 bg-morandi-container/10 rounded-lg">
              <label className="text-sm font-medium text-morandi-secondary">總利潤</label>
              <div className={`mt-1 text-2xl font-bold ${totalProfit >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                NT$ {totalProfit.toLocaleString()}
              </div>
            </div>
          )}
          <div className="p-4 bg-morandi-container/10 rounded-lg">
            <label className="text-sm font-medium text-morandi-secondary">已收金額</label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.received_amount === 0 ? '' : formData.received_amount}
                onChange={e => {
                  let val = e.target.value
                  // 全形轉半形
                  val = val.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
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

        {/* 另存新版本對話框 */}
        <Dialog open={isSaveVersionDialogOpen} onOpenChange={setIsSaveVersionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>另存新版本</DialogTitle>
              <DialogDescription>
                請輸入版本名稱，例如：「初稿」「修訂版」「最終版」
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="版本名稱"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSaveAsNewVersion()
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveVersionDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSaveAsNewVersion}
                disabled={isSaving || !versionName.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                {isSaving ? '儲存中...' : '儲存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 列印預覽對話框 */}
        <PrintableQuickQuote
          quote={{
            ...quote,
            ...formData,
          } as any}
          items={items}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          onPrint={handlePrint}
        />
      </div>
    </>
  )
}
