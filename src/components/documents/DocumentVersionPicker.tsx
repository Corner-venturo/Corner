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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuoteStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
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
}

export function DocumentVersionPicker({
  isOpen,
  onClose,
  tour,
}: DocumentVersionPickerProps) {
  const router = useRouter()
  const { items: quotes, fetchAll, create, update, loading } = useQuoteStore()
  const [isCreating, setIsCreating] = useState(false)
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

  // 已關聯此旅遊團的報價單
  const linkedQuotes = quotes.filter(
    q => q.tour_id === tour.id && !(q as { _deleted?: boolean })._deleted
  )

  // 建立新報價單
  const handleCreate = async () => {
    try {
      setIsCreating(true)

      const code = generateCode('TP', {}, quotes)

      const newQuote = await create({
        code,
        name: '',
        customer_name: '未命名報價單',
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
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
      setIsCreating(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[600px] h-[70vh] max-h-[800px] flex flex-col overflow-hidden p-0 [&>button]:hidden">
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

        {/* 報價單列表 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-morandi-secondary" />
            </div>
          ) : linkedQuotes.length === 0 ? (
            <div className="text-center py-12 text-sm text-morandi-secondary">
              尚無報價單，點擊下方按鈕新增
            </div>
          ) : (
            <div className="space-y-2">
              {linkedQuotes.map((quote, index) => (
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
                        NT$ {quote.total_amount.toLocaleString()}
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
              ))}
            </div>
          )}
        </div>

        {/* 新增按鈕 */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded-lg transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            新增報價單
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
