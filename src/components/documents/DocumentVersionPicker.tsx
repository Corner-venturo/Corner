'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Check,
  Pencil,
  Calculator,
  Loader2,
  ExternalLink,
  Zap,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CurrencyCell } from '@/components/table-cells'
import { useQuoteStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// 取得報價單顯示名稱
function getQuoteDisplayName(quote: Quote): string {
  if (quote.quote_type === 'quick') {
    return quote.customer_name || '未命名客戶'
  }
  return quote.customer_name || quote.name || '未命名報價單'
}

// 判斷是否為已確認版本
function isConfirmedQuote(quote: Quote): boolean {
  return quote.confirmation_status === 'customer_confirmed' ||
         quote.confirmation_status === 'staff_confirmed' ||
         quote.confirmation_status === 'closed' ||
         quote.status === 'approved'
}

interface DocumentVersionPickerProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  /** 模式：manage=報價單管理, confirm=確認出團 */
  mode?: 'manage' | 'confirm'
  /** 確認鎖定回調（mode=confirm 時使用） */
  onConfirmLock?: () => void
}

export function DocumentVersionPicker({
  isOpen,
  onClose,
  tour,
  mode = 'manage',
  onConfirmLock,
}: DocumentVersionPickerProps) {
  const router = useRouter()
  const { items: quotes, fetchAll, create, update, loading } = useQuoteStore()
  const [isCreatingStandard, setIsCreatingStandard] = useState(false)
  const [isCreatingQuick, setIsCreatingQuick] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 載入報價單資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
    }
  }, [isOpen, fetchAll])

  // 編輯時自動聚焦
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // 已關聯此旅遊團的報價單 - 分開標準和快速
  const linkedQuotes = quotes.filter(
    q => q.tour_id === tour.id && !(q as { _deleted?: boolean })._deleted
  )
  const standardQuotes = linkedQuotes.filter(q => q.quote_type !== 'quick')
  const quickQuotes = linkedQuotes.filter(q => q.quote_type === 'quick')

  // 建立新標準報價單
  const handleCreateStandard = async () => {
    try {
      setIsCreatingStandard(true)

      const code = generateCode('TP', { quoteType: 'standard' }, quotes)

      const newQuote = await create({
        code,
        name: tour.name,
        customer_name: '未命名報價單',
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
      })

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      } else {
        logger.error('建立報價單失敗: 未取得報價單 ID', newQuote)
        alert('建立報價單失敗，請稍後再試')
      }
    } catch (error) {
      logger.error('建立報價單失敗:', error)
      const message = error instanceof Error ? error.message : '建立報價單失敗'
      alert(message)
    } finally {
      setIsCreatingStandard(false)
    }
  }

  // 建立新快速報價單
  const handleCreateQuick = async () => {
    try {
      setIsCreatingQuick(true)

      const code = generateCode('TP', { quoteType: 'quick' }, quotes)

      const newQuote = await create({
        code,
        name: '',
        customer_name: '未命名客戶',
        quote_type: 'quick',
        status: 'draft',
        tour_id: tour.id,
        group_size: 1,
      })

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      } else {
        logger.error('建立快速報價單失敗: 未取得報價單 ID', newQuote)
        alert('建立報價單失敗，請稍後再試')
      }
    } catch (error) {
      logger.error('建立快速報價單失敗:', error)
      const message = error instanceof Error ? error.message : '建立報價單失敗'
      alert(message)
    } finally {
      setIsCreatingQuick(false)
    }
  }

  // 進入編輯
  const handleView = (quote: Quote) => {
    onClose()
    router.push(`/quotes/${quote.id}`)
  }

  // 開始 inline 改名
  const handleStartRename = (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    setEditingId(quote.id)
    setEditingName(quote.customer_name || quote.name || '')
  }

  // 儲存改名
  const handleSaveRename = async (quote: Quote) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    try {
      await update(quote.id, { customer_name: editingName.trim() })
    } catch (error) {
      logger.error('更新名稱失敗:', error)
    }

    setEditingId(null)
  }

  // 按 Enter 或 Escape
  const handleKeyDown = (e: React.KeyboardEvent, quote: Quote) => {
    if (e.key === 'Enter') {
      handleSaveRename(quote)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  // 渲染報價單項目
  const renderQuoteItem = (quote: Quote, index: number) => (
    <div
      key={quote.id}
      onClick={() => handleView(quote)}
      className={cn(
        'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-morandi-gold/10 border border-border/50 hover:border-morandi-gold/30',
        isConfirmedQuote(quote) && 'bg-morandi-green/5 border-morandi-green/20'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 序號 */}
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-morandi-container/50 text-xs text-morandi-secondary shrink-0">
          {index + 1}
        </span>

        {isConfirmedQuote(quote) && (
          <Check size={16} className="text-morandi-green shrink-0" />
        )}

        {editingId === quote.id ? (
          <input
            ref={inputRef}
            type="text"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            onBlur={() => handleSaveRename(quote)}
            onKeyDown={e => handleKeyDown(e, quote)}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-sm bg-white border border-morandi-gold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-morandi-gold"
          />
        ) : (
          <span className="text-sm text-morandi-primary truncate">
            {getQuoteDisplayName(quote)}
          </span>
        )}

        {quote.total_amount ? (
          <span className="text-xs text-morandi-secondary shrink-0 ml-auto mr-2">
            <CurrencyCell amount={quote.total_amount} className="text-xs text-morandi-secondary" />
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => handleStartRename(e, quote)}
          className="p-1.5 hover:bg-morandi-container rounded"
          title="重新命名"
        >
          <Pencil size={14} className="text-morandi-secondary" />
        </button>
        <ExternalLink size={14} className="text-morandi-secondary" />
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[900px] h-[70vh] max-h-[800px] flex flex-col overflow-hidden p-0 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-5 py-3.5 border-b border-border bg-morandi-container/20">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-morandi-gold" />
            <span className="font-medium text-morandi-primary">報價單管理</span>
            <span className="text-sm text-morandi-secondary font-normal">- {tour.code}</span>
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3 p-1.5 hover:bg-morandi-container rounded transition-colors"
          >
            <X size={18} className="text-morandi-secondary" />
          </button>
        </DialogHeader>

        {/* 左右兩欄佈局 */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
          {/* 左邊：團體報價單 */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-morandi-primary/5">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-morandi-primary" />
                <span className="text-sm font-medium text-morandi-primary">團體報價單</span>
                <span className="text-xs text-morandi-secondary">(Q 開頭)</span>
              </div>
              <p className="text-xs text-morandi-secondary mt-1">完整報價單，包含分類項目與成本明細</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                </div>
              ) : standardQuotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-morandi-secondary">
                  尚無團體報價單
                </div>
              ) : (
                <div className="space-y-2">
                  {standardQuotes.map((quote, index) => renderQuoteItem(quote, index))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-border/50">
              {mode === 'confirm' ? (
                <button
                  onClick={() => {
                    onConfirmLock?.()
                    onClose()
                  }}
                  disabled={standardQuotes.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-status-success hover:bg-status-success/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  確認鎖定
                </button>
              ) : (
                <button
                  onClick={handleCreateStandard}
                  disabled={isCreatingStandard}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-morandi-primary hover:bg-morandi-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCreatingStandard ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  新增團體報價單
                </button>
              )}
            </div>
          </div>

          {/* 右邊：快速報價單 */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-status-warning-bg/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-status-warning" />
                <span className="text-sm font-medium text-morandi-primary">快速報價單</span>
                <span className="text-xs text-morandi-secondary">(X 開頭)</span>
              </div>
              <p className="text-xs text-morandi-secondary mt-1">簡易報價，快速產出客戶報價</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                </div>
              ) : quickQuotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-morandi-secondary">
                  尚無快速報價單
                </div>
              ) : (
                <div className="space-y-2">
                  {quickQuotes.map((quote, index) => renderQuoteItem(quote, index))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-border/50">
              <button
                onClick={handleCreateQuick}
                disabled={isCreatingQuick}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-status-warning hover:bg-status-warning/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreatingQuick ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={16} />
                    <Plus size={14} />
                  </>
                )}
                新增快速報價單
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
