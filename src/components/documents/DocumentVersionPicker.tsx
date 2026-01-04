'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Pencil,
  Calculator,
  Loader2,
  ExternalLink,
  Zap,
  Lock,
  Eye,
  Copy,
  FilePlus,
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

// 取得確認狀態文字
function getConfirmStatusText(quote: Quote): string {
  if (quote.confirmation_status === 'customer_confirmed') return '客戶已確認'
  if (quote.confirmation_status === 'staff_confirmed') return '內部已確認'
  if (quote.confirmation_status === 'closed') return '已結案'
  if (quote.status === 'approved') return '已核准'
  return ''
}

interface DocumentVersionPickerProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  /** 模式：manage=報價單管理, confirm=確認出團 */
  mode?: 'manage' | 'confirm'
  /** 確認鎖定回調（mode=confirm 時使用） */
  onConfirmLock?: () => void
  /** 當前正在編輯的報價單 ID（用於「另存」功能） */
  currentQuoteId?: string
}

export function DocumentVersionPicker({
  isOpen,
  onClose,
  tour,
  mode = 'manage',
  onConfirmLock,
  currentQuoteId,
}: DocumentVersionPickerProps) {
  const router = useRouter()
  const { items: quotes, fetchAll, create, update, loading } = useQuoteStore()
  const [isCreatingStandard, setIsCreatingStandard] = useState(false)
  const [isCreatingQuick, setIsCreatingQuick] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null)
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
  // 過濾掉沒有實際內容的報價單（沒有金額且沒有項目）
  const linkedQuotes = quotes.filter(q => {
    if (q.tour_id !== tour.id) return false
    if ((q as { _deleted?: boolean })._deleted) return false

    // 有金額就顯示
    if (q.total_amount && q.total_amount > 0) return true

    // 有分類項目就顯示
    const categories = q.categories as Array<{ items?: unknown[] }> | null
    if (categories && categories.some(cat => cat.items && cat.items.length > 0)) return true

    // 已確認的報價單一定要顯示
    if (q.confirmation_status || q.status === 'approved') return true

    return false
  })
  const standardQuotes = linkedQuotes.filter(q => q.quote_type !== 'quick')
  const quickQuotes = linkedQuotes.filter(q => q.quote_type === 'quick')

  // 取得當前正在編輯的報價單
  const currentQuote = currentQuoteId ? quotes.find(q => q.id === currentQuoteId) : null
  const currentQuoteType = currentQuote?.quote_type

  // 另存當前報價單為新版本
  const [isSavingAs, setIsSavingAs] = useState(false)
  const handleSaveAsNew = async (targetType: 'standard' | 'quick') => {
    if (!currentQuote) return
    try {
      setIsSavingAs(true)
      const code = generateCode('TP', { quoteType: targetType }, quotes)
      const originalName = currentQuote.customer_name || currentQuote.name || '未命名'

      const newQuote = await create({
        code,
        name: currentQuote.name,
        customer_name: `${originalName} (副本)`,
        quote_type: targetType,
        status: 'draft',
        tour_id: tour.id,
        categories: currentQuote.categories,
        group_size: currentQuote.group_size,
      })

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('另存報價單失敗:', error)
    } finally {
      setIsSavingAs(false)
    }
  }

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

  // 進入編輯頁面
  const handleEdit = (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    onClose()
    router.push(`/quotes/${quote.id}`)
  }

  // 預覽報價單
  const handlePreview = (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    setPreviewQuote(quote)
  }

  // 複製報價單（另存新檔）
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const handleCopy = async (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation()
    try {
      setCopyingId(quote.id)
      const code = generateCode('TP', { quoteType: quote.quote_type === 'quick' ? 'quick' : 'standard' }, quotes)
      const originalName = quote.customer_name || quote.name || '未命名'

      const newQuote = await create({
        code,
        name: quote.name,
        customer_name: `${originalName} (副本)`,
        quote_type: quote.quote_type,
        status: 'draft',
        tour_id: tour.id,
        categories: quote.categories,
        group_size: quote.group_size,
      })

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('複製報價單失敗:', error)
    } finally {
      setCopyingId(null)
    }
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
  const renderQuoteItem = (quote: Quote, index: number) => {
    const isLocked = isConfirmedQuote(quote)

    return (
      <div
        key={quote.id}
        className={cn(
          'group flex items-center justify-between p-3 rounded-lg transition-colors',
          'border border-border/50',
          isLocked && 'bg-morandi-green/5 border-morandi-green/30'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 序號 */}
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-morandi-container/50 text-xs text-morandi-secondary shrink-0">
            {index + 1}
          </span>

          {/* 鎖定標記 */}
          {isLocked && (
            <div className="flex items-center gap-1 shrink-0">
              <Lock size={14} className="text-morandi-green" />
              <span className="text-xs text-morandi-green">{getConfirmStatusText(quote)}</span>
            </div>
          )}

          {/* 名稱 */}
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

          {/* 金額 */}
          {quote.total_amount ? (
            <span className="text-xs text-morandi-secondary shrink-0 ml-auto mr-2">
              <CurrencyCell amount={quote.total_amount} className="text-xs text-morandi-secondary" />
            </span>
          ) : null}
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-1">
          {/* 預覽 */}
          <button
            onClick={e => handlePreview(e, quote)}
            className="p-1.5 hover:bg-morandi-container rounded-lg transition-colors"
            title="預覽"
          >
            <Eye size={15} className="text-morandi-secondary" />
          </button>

          {/* 改名 */}
          <button
            onClick={e => handleStartRename(e, quote)}
            className="p-1.5 hover:bg-morandi-container rounded-lg transition-colors"
            title="重新命名"
          >
            <Pencil size={15} className="text-morandi-secondary" />
          </button>

          {/* 複製（另存新檔） */}
          <button
            onClick={e => handleCopy(e, quote)}
            disabled={copyingId === quote.id}
            className="p-1.5 hover:bg-morandi-container rounded-lg transition-colors"
            title="複製為新版本"
          >
            {copyingId === quote.id ? (
              <Loader2 size={15} className="animate-spin text-morandi-secondary" />
            ) : (
              <Copy size={15} className="text-morandi-secondary" />
            )}
          </button>

          {/* 編輯（跳轉） */}
          <button
            onClick={e => handleEdit(e, quote)}
            className="p-1.5 hover:bg-morandi-gold/10 rounded-lg transition-colors"
            title="編輯報價單"
          >
            <ExternalLink size={15} className="text-morandi-gold" />
          </button>
        </div>
      </div>
    )
  }

  // 預覽 Dialog 內容
  const renderPreviewContent = () => {
    if (!previewQuote) return null

    const categories = previewQuote.categories as Array<{
      name: string
      items?: Array<{ name: string; amount?: number; quantity?: number }>
    }> | null

    return (
      <div className="space-y-4">
        {/* 基本資訊 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-morandi-secondary">狀態：</span>
              <span className={cn(
                'ml-1 font-medium',
                isConfirmedQuote(previewQuote) ? 'text-morandi-green' : 'text-morandi-secondary'
              )}>
                {isConfirmedQuote(previewQuote) ? getConfirmStatusText(previewQuote) : '草稿'}
              </span>
            </div>
            <div>
              <span className="text-morandi-secondary">人數：</span>
              <span className="text-morandi-primary ml-1">{previewQuote.group_size || '-'} 人</span>
            </div>
          </div>
          <div>
            <span className="text-morandi-secondary">總金額：</span>
            <span className="text-morandi-gold font-medium ml-1">
              {previewQuote.total_amount ? (
                <CurrencyCell amount={previewQuote.total_amount} />
              ) : '-'}
            </span>
          </div>
        </div>

        {/* 分割線 */}
        <div className="mx-0">
          <div className="border-t border-border" />
        </div>

        {/* 成本細項表格 */}
        {previewQuote.quote_type !== 'quick' && categories && categories.length > 0 ? (
          <div className="space-y-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-morandi-secondary">
                  <th className="text-left py-1.5 font-medium">分類</th>
                  <th className="text-left py-1.5 font-medium">項目</th>
                  <th className="text-right py-1.5 font-medium">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {categories.flatMap((cat, catIdx) =>
                  cat.items?.map((item, itemIdx) => (
                    <tr key={`${catIdx}-${itemIdx}`}>
                      <td className="py-1.5 text-morandi-secondary">{itemIdx === 0 ? cat.name : ''}</td>
                      <td className="py-1.5 text-morandi-primary">
                        {item.name}
                        {(item.quantity || 1) > 1 && <span className="text-morandi-muted ml-1">x{item.quantity}</span>}
                      </td>
                      <td className="py-1.5 text-right">
                        <CurrencyCell amount={(item.amount || 0) * (item.quantity || 1)} />
                      </td>
                    </tr>
                  )) || []
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-morandi-gold/30 bg-morandi-gold/5">
                  <td colSpan={2} className="py-2 font-medium text-morandi-primary">總成本</td>
                  <td className="py-2 text-right">
                    <CurrencyCell
                      amount={categories.reduce((sum, cat) => {
                        return sum + (cat.items?.reduce((catSum, item) => {
                          return catSum + ((item.amount || 0) * (item.quantity || 1))
                        }, 0) || 0)
                      }, 0)}
                      className="font-bold text-morandi-gold"
                    />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : previewQuote.quote_type === 'quick' ? (
          <div className="text-sm text-morandi-secondary text-center py-4">
            快速報價單，請點擊「編輯」查看詳細內容
          </div>
        ) : (
          <div className="text-sm text-morandi-secondary text-center py-4">
            尚無成本項目
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-[900px] h-[70vh] max-h-[800px] flex flex-col overflow-hidden p-0 [&>button]:hidden">
          {/* 標題區 */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-morandi-gold" />
              <span className="font-medium text-morandi-primary">報價單管理</span>
              <span className="text-sm text-morandi-secondary font-normal">- {tour.code}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-morandi-container rounded-lg transition-colors"
            >
              <X size={18} className="text-morandi-secondary" />
            </button>
          </div>

          {/* 分割線 */}
          <div className="border-t border-border/60 mx-6" />

          {/* 左右兩欄佈局 */}
          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-6 px-6 pt-4 pb-6">
            {/* 左邊：團體報價單 */}
            <div className="flex flex-col min-h-0 overflow-hidden border border-border rounded-lg">
              <div className="flex-shrink-0 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-morandi-primary" />
                  <span className="text-sm font-medium text-morandi-primary">團體報價單</span>
                </div>
                <p className="text-xs text-morandi-secondary mt-1">完整報價單，包含分類項目與成本明細</p>
              </div>

              {/* 分割線留白 */}
              <div className="mx-4">
                <div className="border-t border-border" />
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

              {/* 分割線留白 */}
              <div className="mx-4">
                <div className="border-t border-border" />
              </div>

              <div className="flex-shrink-0 p-4">
                {mode === 'confirm' ? (
                  <button
                    onClick={() => {
                      onConfirmLock?.()
                      onClose()
                    }}
                    disabled={standardQuotes.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-morandi-green hover:bg-morandi-green/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock size={16} />
                    確認出團
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateStandard}
                      disabled={isCreatingStandard}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isCreatingStandard ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      新增
                    </button>
                    {currentQuote && (
                      <button
                        onClick={() => handleSaveAsNew('standard')}
                        disabled={isSavingAs}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-morandi-gold border border-morandi-gold hover:bg-morandi-gold/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSavingAs ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <FilePlus size={16} />
                        )}
                        另存
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 右邊：快速報價單 */}
            <div className="flex flex-col min-h-0 overflow-hidden border border-border rounded-lg">
              <div className="flex-shrink-0 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-morandi-gold" />
                  <span className="text-sm font-medium text-morandi-primary">快速報價單</span>
                </div>
                <p className="text-xs text-morandi-secondary mt-1">簡易報價，快速產出客戶報價</p>
              </div>

              {/* 分割線留白 */}
              <div className="mx-4">
                <div className="border-t border-border" />
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

              {/* 分割線留白 */}
              <div className="mx-4">
                <div className="border-t border-border" />
              </div>

              <div className="flex-shrink-0 p-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateQuick}
                    disabled={isCreatingQuick}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCreatingQuick ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={16} />
                        <Plus size={14} />
                      </>
                    )}
                    新增
                  </button>
                  {currentQuote && (
                    <button
                      onClick={() => handleSaveAsNew('quick')}
                      disabled={isSavingAs}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-morandi-gold border border-morandi-gold hover:bg-morandi-gold/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingAs ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FilePlus size={16} />
                      )}
                      另存
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 預覽 Dialog */}
      <Dialog open={!!previewQuote} onOpenChange={open => !open && setPreviewQuote(null)}>
        <DialogContent className="max-w-md p-0 [&>button]:hidden">
          <DialogHeader className="flex-shrink-0 px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-morandi-gold" />
              <span className="font-medium text-morandi-primary">報價單預覽</span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => setPreviewQuote(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-morandi-container rounded-lg transition-colors"
            >
              <X size={18} className="text-morandi-secondary" />
            </button>
          </DialogHeader>

          {/* 分割線留白 */}
          <div className="mx-5">
            <div className="border-t border-border" />
          </div>

          <div className="p-5">
            {renderPreviewContent()}
          </div>

          {/* 分割線留白 */}
          <div className="mx-5">
            <div className="border-t border-border" />
          </div>

          {/* 底部按鈕 */}
          <div className="p-5 flex gap-3">
            <button
              onClick={() => setPreviewQuote(null)}
              className="flex-1 py-2.5 text-sm font-medium text-morandi-secondary border border-border rounded-lg hover:bg-morandi-container/50 transition-colors"
            >
              關閉
            </button>
            <button
              onClick={() => {
                if (previewQuote) {
                  onClose()
                  setPreviewQuote(null)
                  router.push(`/quotes/${previewQuote.id}`)
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              前往編輯
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
