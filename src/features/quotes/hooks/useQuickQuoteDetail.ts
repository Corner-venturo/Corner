'use client'

import { getTodayString } from '@/lib/utils/format-date'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Quote, QuickQuoteItem, QuoteVersion } from '@/stores/types'
import { alert } from '@/lib/ui/alert-dialog'

interface UseQuickQuoteDetailProps {
  quote: Quote
  onUpdate: (data: Partial<Quote>) => Promise<void> | Promise<Quote>
}

interface FormData {
  customer_name: string
  contact_phone: string
  contact_address: string
  tour_code: string
  handler_name: string
  issue_date: string
  received_amount: number
  expense_description: string
}

export function useQuickQuoteDetail({ quote, onUpdate }: UseQuickQuoteDetailProps) {
  // 狀態管理
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [currentEditingVersion, setCurrentEditingVersion] = useState<number | null>(null)
  const [isSaveVersionDialogOpen, setIsSaveVersionDialogOpen] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [hoveredVersionIndex, setHoveredVersionIndex] = useState<number | null>(null)

  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    customer_name: quote.customer_name || '',
    contact_phone: quote.contact_phone || '',
    contact_address: quote.contact_address || '',
    tour_code: quote.tour_code || '',
    handler_name: quote.handler_name || 'William',
    issue_date: quote.issue_date || getTodayString(),
    received_amount: quote.received_amount || 0,
    expense_description: (quote as typeof quote & { expense_description?: string }).expense_description || '',
  })

  // 項目管理
  const [items, setItems] = useState<QuickQuoteItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)

  useEffect(() => {
    if (quote.quick_quote_items && Array.isArray(quote.quick_quote_items)) {
      setItems(quote.quick_quote_items)
    } else {
      setItems([])
    }
    setIsLoadingItems(false)
  }, [quote.quick_quote_items])

  const setFormField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 計算金額
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0)
  const totalProfit = totalAmount - totalCost
  const balanceAmount = totalAmount - formData.received_amount

  // 項目操作
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

  // 準備版本資料
  const prepareVersionData = (versionNumber: number, versionName: string): QuoteVersion => ({
    id: Date.now().toString(),
    version: versionNumber,
    mode: 'simple',
    name: versionName,
    created_at: new Date().toISOString(),
    quick_quote_items: items,
    customer_name: formData.customer_name,
    contact_phone: formData.contact_phone,
    contact_address: formData.contact_address,
    handler_name: formData.handler_name,
    issue_date: formData.issue_date,
    received_amount: formData.received_amount,
    expense_description: formData.expense_description,
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
        expense_description: formData.expense_description,
        total_amount: totalAmount,
        total_cost: totalCost,
        received_amount: formData.received_amount,
        balance_amount: totalAmount - formData.received_amount,
        quick_quote_items: items,
      }

      const existingVersions = quote.versions || []

      if (currentEditingVersion !== null && existingVersions.length > 0) {
        const updatedVersions = [...existingVersions]
        updatedVersions[currentEditingVersion] = {
          ...updatedVersions[currentEditingVersion],
          ...prepareVersionData(
            updatedVersions[currentEditingVersion].version,
            updatedVersions[currentEditingVersion].name || `版本 ${updatedVersions[currentEditingVersion].version}`
          ),
        }

        await onUpdate({
          ...baseUpdate,
          versions: updatedVersions,
        })
      } else if (existingVersions.length === 0) {
        const versionName = formData.tour_code || formData.customer_name || '版本 1'
        const firstVersion = prepareVersionData(1, versionName)

        await onUpdate({
          ...baseUpdate,
          version: 1,
          versions: [firstVersion],
        })
        setCurrentEditingVersion(0)
      } else {
        await onUpdate(baseUpdate)
      }

      logger.log('✅ [QuickQuote] 儲存成功')
      if (showAlert) {
        setIsEditing(false)
      }
    } catch (error) {
      logger.error('❌ [QuickQuote] 儲存失敗:', error)
      if (showAlert) {
        await alert('儲存失敗：' + (error as Error).message, 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // 另存新版本
  const handleSaveAsNewVersion = async () => {
    if (!versionName.trim()) {
      await alert('請輸入版本名稱', 'warning')
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
        expense_description: formData.expense_description,
        total_amount: totalAmount,
        total_cost: totalCost,
        received_amount: formData.received_amount,
        balance_amount: totalAmount - formData.received_amount,
        quick_quote_items: items,
        version: newVersionNumber,
        versions: newVersions,
      })

      setCurrentEditingVersion(newVersions.length - 1)
      setIsSaveVersionDialogOpen(false)
      setVersionName('')
      logger.log('✅ [QuickQuote] 新版本儲存成功')
    } catch (error) {
      logger.error('❌ [QuickQuote] 儲存版本失敗:', error)
      await alert('版本儲存失敗：' + (error as Error).message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 載入版本
  const handleLoadVersion = (versionIndex: number) => {
    const versions = quote.versions || []

    if (versionIndex < 0 || versionIndex >= versions.length) return

    const versionData = versions[versionIndex] as QuoteVersion & {
      customer_name?: string
      contact_phone?: string
      contact_address?: string
      tour_code?: string
      handler_name?: string
      issue_date?: string
      received_amount?: number
      expense_description?: string
      items?: QuickQuoteItem[]
    }

    setFormData({
      customer_name: versionData.customer_name || '',
      contact_phone: versionData.contact_phone || '',
      contact_address: versionData.contact_address || '',
      tour_code: versionData.tour_code || '',
      handler_name: versionData.handler_name || 'William',
      issue_date: versionData.issue_date || getTodayString(),
      received_amount: versionData.received_amount || 0,
      expense_description: versionData.expense_description || '',
    })

    if (versionData.items) {
      setItems(versionData.items)
    }

    setCurrentEditingVersion(versionIndex)
  }

  return {
    // 狀態
    isEditing,
    setIsEditing,
    isSaving,
    showPrintPreview,
    setShowPrintPreview,
    currentEditingVersion,
    isSaveVersionDialogOpen,
    setIsSaveVersionDialogOpen,
    versionName,
    setVersionName,
    hoveredVersionIndex,
    setHoveredVersionIndex,

    // 表單資料
    formData,
    setFormField,

    // 項目資料
    items,
    isLoadingItems,

    // 計算結果
    totalAmount,
    totalCost,
    totalProfit,
    balanceAmount,

    // 操作方法
    addItem,
    removeItem,
    updateItem,
    handleSave,
    handleSaveAsNewVersion,
    handleLoadVersion,
  }
}
