/**
 * LinkQuoteToTourDialog - 旅遊團連結報價單對話框
 * 類似行程管理的「製作報價單」對話框
 * 功能：建立新報價單 / 連結現有報價單
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Calculator, Loader2, ExternalLink, Zap } from 'lucide-react'
import { useQuoteStore, useEmployeeStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'

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
  return stripHtml(quote.name) || stripHtml(quote.destination) || '未命名'
}

interface LinkQuoteToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

export function LinkQuoteToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkQuoteToTourDialogProps) {
  const router = useRouter()
  const { items: quotes, fetchAll, create, update, loading } = useQuoteStore()
  const { items: employees, fetchAll: fetchEmployees } = useEmployeeStore()
  const currentUser = useAuthStore(state => state.user)
  const [isCreating, setIsCreating] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [salesFilter, setSalesFilter] = useState<string>('mine') // 'all' | 'mine' | employee_id

  // 載入報價單與員工資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
      fetchEmployees()
      // 預設篩選自己的報價單
      if (currentUser?.id) {
        setSalesFilter('mine')
      }
    }
  }, [isOpen, fetchAll, fetchEmployees, currentUser?.id])

  // 取得業務人員列表（有建立過報價單的）
  const salesPeople = useMemo(() => {
    const creatorIds = new Set(quotes.map(q => q.created_by).filter(Boolean))
    return employees.filter(e => creatorIds.has(e.id))
  }, [quotes, employees])

  // 已關聯此旅遊團的報價單
  const linkedQuotes = useMemo(() => {
    return quotes.filter(q => q.tour_id === tour.id && !(q as { _deleted?: boolean })._deleted)
  }, [quotes, tour.id])

  // 未關聯任何旅遊團的報價單（可用於連結，包含標準與快速報價單）
  const availableQuotes = useMemo(() => {
    return quotes
      .filter(q => {
        // 基本條件：未關聯旅遊團且未刪除
        if (q.tour_id || (q as { _deleted?: boolean })._deleted) return false

        // 業務篩選
        if (salesFilter === 'all') return true
        if (salesFilter === 'mine') return q.created_by === currentUser?.id
        return q.created_by === salesFilter
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [quotes, salesFilter, currentUser?.id])

  // 全部可用報價單數量（不含篩選）
  const totalAvailableCount = useMemo(() => {
    return quotes.filter(q => !q.tour_id && !(q as { _deleted?: boolean })._deleted).length
  }, [quotes])

  // 建立新報價單
  const handleCreateNew = async () => {
    try {
      setIsCreating(true)

      const code = generateCode('TP', { quoteType: 'standard' }, quotes)

       
      const newQuote = await create({
        code,
        name: tour.name,
        quote_type: 'standard',
        status: 'draft',
        tour_id: tour.id,
        categories: DEFAULT_CATEGORIES,
        group_size: tour.max_participants || 20,
      } as any)
       

      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      console.error('建立報價單失敗:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // 連結現有報價單
  const handleLinkQuote = async (quote: Quote) => {
    try {
      setIsLinking(true)

      await update(quote.id, {
        tour_id: tour.id,
      })

      onClose()
      router.push(`/quotes/${quote.id}`)
    } catch (error) {
      console.error('連結報價單失敗:', error)
    } finally {
      setIsLinking(false)
    }
  }

  // 查看已連結的報價單
  const handleViewQuote = (quote: Quote) => {
    onClose()
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>管理報價單</DialogTitle>
          <DialogDescription>
            為「{tour.name}」建立新報價單或連結現有報價單
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 建立新報價單 */}
          <div className="border-2 border-dashed border-morandi-primary/30 rounded-lg p-4 bg-morandi-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-morandi-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-morandi-primary" />
              </div>
              <div>
                <div className="font-medium text-morandi-primary">建立新報價單</div>
                <div className="text-sm text-morandi-secondary">為此旅遊團建立全新的報價單</div>
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  建立中...
                </>
              ) : (
                '建立新報價單'
              )}
            </Button>
          </div>

          {/* 已關聯的報價單 */}
          {linkedQuotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-morandi-gold" />
                <span className="text-sm font-medium text-morandi-primary">已關聯的報價單</span>
              </div>
              <div className="space-y-2">
                {linkedQuotes.map(quote => (
                  <button
                    key={quote.id}
                    onClick={() => handleViewQuote(quote)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5 hover:bg-morandi-gold/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-morandi-gold">{quote.code}</span>
                      {quote.quote_type === 'quick' && (
                        <span className="flex items-center gap-0.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                          <Zap className="w-3 h-3" />
                          快速
                        </span>
                      )}
                      <span className="text-morandi-text">{getQuoteDisplayName(quote)}</span>
                      {quote.versions && quote.versions.length > 0 && (
                        <span className="text-xs bg-morandi-gold/20 text-morandi-gold px-1.5 py-0.5 rounded">
                          {quote.versions.length} 版
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-morandi-secondary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 連結現有報價單 */}
          {totalAvailableCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-morandi-secondary" />
                  <span className="text-sm font-medium text-morandi-primary">連結現有報價單</span>
                  <span className="text-xs text-morandi-secondary">({availableQuotes.length}/{totalAvailableCount})</span>
                </div>
                <Select value={salesFilter} onValueChange={setSalesFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="篩選業務" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">我的報價單</SelectItem>
                    <SelectItem value="all">全部報價單</SelectItem>
                    {salesPeople.map(emp => (
                      emp.id !== currentUser?.id && (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.display_name || emp.chinese_name || emp.id}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {availableQuotes.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {availableQuotes.map(quote => (
                    <button
                      key={quote.id}
                      onClick={() => handleLinkQuote(quote)}
                      disabled={isLinking}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-container bg-white hover:bg-morandi-container/30 hover:border-morandi-secondary/30 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-morandi-gold">{quote.code}</span>
                        {quote.quote_type === 'quick' && (
                          <span className="flex items-center gap-0.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                            <Zap className="w-3 h-3" />
                            快速
                          </span>
                        )}
                        <span className="text-morandi-text">{getQuoteDisplayName(quote)}</span>
                        {quote.versions && quote.versions.length > 0 && (
                          <span className="text-xs bg-morandi-container text-morandi-secondary px-1.5 py-0.5 rounded">
                            {quote.versions.length} 版
                          </span>
                        )}
                      </div>
                      {quote.created_by_name && (
                        <span className="text-xs text-morandi-secondary shrink-0">{quote.created_by_name}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-morandi-secondary text-sm border border-dashed border-morandi-container rounded-lg">
                  此業務沒有可連結的報價單
                </div>
              )}
            </div>
          )}

          {/* 無可用報價單提示 */}
          {totalAvailableCount === 0 && linkedQuotes.length === 0 && !loading && (
            <div className="text-center py-4 text-morandi-secondary text-sm">
              目前沒有可連結的報價單，請建立新報價單
            </div>
          )}

          {/* 載入中 */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
              <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
