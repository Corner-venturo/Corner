'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Check,
  Pencil,
  Calculator,
  Zap,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuoteStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// 取得報價單顯示名稱
function getQuoteDisplayName(quote: Quote): string {
  if (quote.quote_type === 'quick') {
    return quote.customer_name || '未命名客戶'
  }
  return stripHtml(quote.name) || stripHtml(quote.destination) || '未命名報價單'
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
  anchorEl?: HTMLElement | null // 用於定位懸浮視窗
}

export function DocumentVersionPicker({
  isOpen,
  onClose,
  tour,
  anchorEl,
}: DocumentVersionPickerProps) {
  const router = useRouter()
  const { items: quotes, fetchAll, create, update, loading } = useQuoteStore()
  const [isCreating, setIsCreating] = useState<'standard' | 'quick' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 載入報價單資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
    }
  }, [isOpen, fetchAll])

  // 點擊外部關閉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // 編輯時自動聚焦
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // 已關聯此旅遊團的報價單
  const linkedQuotes = quotes.filter(
    q => q.tour_id === tour.id && !(q as { _deleted?: boolean })._deleted
  )

  // 分類：標準 vs 快速
  const standardQuotes = linkedQuotes.filter(q => q.quote_type === 'standard')
  const quickQuotes = linkedQuotes.filter(q => q.quote_type === 'quick')

  // 建立新報價單
  const handleCreate = async (type: 'standard' | 'quick') => {
    try {
      setIsCreating(type)

      const code = generateCode('TP', { quoteType: type }, quotes)
      const defaultName = type === 'standard' ? '未命名報價單' : ''

      const newQuote = await create({
        code,
        name: type === 'standard' ? defaultName : undefined,
        customer_name: type === 'quick' ? '未命名客戶' : undefined,
        quote_type: type,
        status: 'draft',
        tour_id: tour.id,
        categories: type === 'standard' ? DEFAULT_CATEGORIES : undefined,
        group_size: tour.max_participants || 20,
      })

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立報價單失敗:', error)
    } finally {
      setIsCreating(null)
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
    setEditingName(
      quote.quote_type === 'quick'
        ? quote.customer_name || ''
        : stripHtml(quote.name) || ''
    )
  }

  // 儲存改名
  const handleSaveRename = async (quote: Quote) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    try {
      const updateData =
        quote.quote_type === 'quick'
          ? { customer_name: editingName.trim() }
          : { name: editingName.trim() }

      await update(quote.id, updateData)
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

  if (!isOpen) return null

  // 計算位置（如果有 anchor）
  const style: React.CSSProperties = anchorEl
    ? {
        position: 'fixed',
        top: anchorEl.getBoundingClientRect().bottom + 8,
        left: anchorEl.getBoundingClientRect().left,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      }

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* 懸浮面板 */}
      <div
        ref={panelRef}
        style={style}
        className="bg-white rounded-xl shadow-2xl border border-border w-[600px] max-h-[500px] overflow-hidden"
      >
        {/* 標題 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-morandi-container/20">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-morandi-gold" />
            <span className="font-medium text-morandi-primary">報價單管理</span>
            <span className="text-sm text-morandi-secondary">- {tour.code}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-morandi-container rounded transition-colors"
          >
            <X size={18} className="text-morandi-secondary" />
          </button>
        </div>

        {/* 內容區：左右分欄 */}
        <div className="flex divide-x divide-border">
          {/* 左側：標準報價單 */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-morandi-container/10 border-b border-border">
              <span className="text-sm font-medium text-morandi-primary">
                標準報價單 ({standardQuotes.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                </div>
              ) : standardQuotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-morandi-secondary">
                  尚無標準報價單
                </div>
              ) : (
                <div className="space-y-1">
                  {standardQuotes.map(quote => (
                    <div
                      key={quote.id}
                      onClick={() => handleView(quote)}
                      className={cn(
                        'group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                        'hover:bg-morandi-gold/10 border border-transparent hover:border-morandi-gold/30',
                        isConfirmedQuote(quote) && 'bg-morandi-green/5 border-morandi-green/20'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isConfirmedQuote(quote) && (
                          <Check size={14} className="text-morandi-green shrink-0" />
                        )}
                        <span className="font-mono text-xs text-morandi-gold shrink-0">
                          {quote.code}
                        </span>

                        {editingId === quote.id ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => handleSaveRename(quote)}
                            onKeyDown={e => handleKeyDown(e, quote)}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-sm bg-white border border-morandi-gold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          />
                        ) : (
                          <span className="text-sm text-morandi-primary truncate">
                            {getQuoteDisplayName(quote)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => handleStartRename(e, quote)}
                          className="p-1 hover:bg-morandi-container rounded"
                          title="重新命名"
                        >
                          <Pencil size={12} className="text-morandi-secondary" />
                        </button>
                        <ExternalLink size={14} className="text-morandi-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 新增按鈕 */}
            <div className="p-2 border-t border-border">
              <button
                onClick={() => handleCreate('standard')}
                disabled={isCreating === 'standard'}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-morandi-primary hover:bg-morandi-container/50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating === 'standard' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                新增
              </button>
            </div>
          </div>

          {/* 右側：快速報價單 */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-morandi-container/10 border-b border-border">
              <span className="text-sm font-medium text-morandi-primary flex items-center gap-1">
                <Zap size={14} className="text-status-warning" />
                快速報價單 ({quickQuotes.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                </div>
              ) : quickQuotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-morandi-secondary">
                  尚無快速報價單
                </div>
              ) : (
                <div className="space-y-1">
                  {quickQuotes.map(quote => (
                    <div
                      key={quote.id}
                      onClick={() => handleView(quote)}
                      className={cn(
                        'group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                        'hover:bg-morandi-gold/10 border border-transparent hover:border-morandi-gold/30',
                        isConfirmedQuote(quote) && 'bg-morandi-green/5 border-morandi-green/20'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isConfirmedQuote(quote) && (
                          <Check size={14} className="text-morandi-green shrink-0" />
                        )}
                        <span className="font-mono text-xs text-morandi-gold shrink-0">
                          {quote.code}
                        </span>

                        {editingId === quote.id ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => handleSaveRename(quote)}
                            onKeyDown={e => handleKeyDown(e, quote)}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-sm bg-white border border-morandi-gold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          />
                        ) : (
                          <span className="text-sm text-morandi-primary truncate">
                            {getQuoteDisplayName(quote)}
                          </span>
                        )}

                        {quote.total_amount && (
                          <span className="text-xs text-morandi-secondary shrink-0">
                            NT$ {quote.total_amount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => handleStartRename(e, quote)}
                          className="p-1 hover:bg-morandi-container rounded"
                          title="重新命名"
                        >
                          <Pencil size={12} className="text-morandi-secondary" />
                        </button>
                        <ExternalLink size={14} className="text-morandi-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 新增按鈕 */}
            <div className="p-2 border-t border-border">
              <button
                onClick={() => handleCreate('quick')}
                disabled={isCreating === 'quick'}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-morandi-primary hover:bg-morandi-container/50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating === 'quick' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                新增
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
