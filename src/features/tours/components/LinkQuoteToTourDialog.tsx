/**
 * LinkQuoteToTourDialog - 旅遊團報價單對話框
 * 功能：建立新報價單 / 查看已關聯報價單
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
import { Button } from '@/components/ui/button'
import { Plus, Calculator, Loader2, ExternalLink, Zap } from 'lucide-react'
import { useQuoteStore } from '@/stores'
import { generateCode } from '@/stores/utils/code-generator'
import { DEFAULT_CATEGORIES } from '@/features/quotes/constants'
import type { Tour, Quote } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/string-utils'

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
  const { items: quotes, fetchAll, create, loading } = useQuoteStore()
  const [isCreating, setIsCreating] = useState(false)

  // 載入報價單資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
    }
  }, [isOpen, fetchAll])

  // 已關聯此旅遊團的報價單
  const linkedQuotes = useMemo(() => {
    return quotes.filter(q => q.tour_id === tour.id && !(q as { _deleted?: boolean })._deleted)
  }, [quotes, tour.id])

  // 建立新報價單
  const handleCreateNew = async (quoteType: 'standard' | 'quick') => {
    try {
      setIsCreating(true)

      const code = generateCode('TP', { quoteType }, quotes)

      const baseData = {
        code,
        name: tour.name,
        quote_type: quoteType,
        status: 'draft' as const,
        tour_id: tour.id,
        customer_name: '',
      }

      const newQuote = await create(
        quoteType === 'standard'
          ? {
              ...baseData,
              categories: DEFAULT_CATEGORIES,
              group_size: tour.max_participants || 20,
            }
          : baseData
      )


      if (newQuote?.id) {
        onClose()
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      logger.error('建立報價單失敗:', error)
    } finally {
      setIsCreating(false)
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
          <DialogTitle>報價單</DialogTitle>
          <DialogDescription>
            為「{tour.name}」建立報價單
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 建立新報價單 - 兩個選項 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 團體報價單 */}
            <div className="border-2 border-dashed border-morandi-primary/30 rounded-lg p-4 bg-morandi-primary/5">
              <div className="flex flex-col items-center text-center mb-3">
                <div className="w-12 h-12 rounded-lg bg-morandi-primary/20 flex items-center justify-center mb-2">
                  <Calculator className="w-6 h-6 text-morandi-primary" />
                </div>
                <div className="font-medium text-morandi-primary">團體報價單</div>
                <div className="text-xs text-morandi-secondary mt-1">完整行程報價</div>
              </div>
              <Button
                onClick={() => handleCreateNew('standard')}
                disabled={isCreating}
                variant="outline"
                className="w-full"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    建立
                  </>
                )}
              </Button>
            </div>

            {/* 快速報價單 */}
            <div className="border-2 border-dashed border-amber-400/30 rounded-lg p-4 bg-amber-50">
              <div className="flex flex-col items-center text-center mb-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div className="font-medium text-amber-700">快速報價單</div>
                <div className="text-xs text-amber-600 mt-1">簡易項目報價</div>
              </div>
              <Button
                onClick={() => handleCreateNew('quick')}
                disabled={isCreating}
                variant="outline"
                className="w-full border-amber-400 text-amber-700 hover:bg-amber-100"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    建立
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 已關聯的報價單 */}
          {linkedQuotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-morandi-gold" />
                <span className="text-sm font-medium text-morandi-primary">已建立的報價單</span>
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
                        <span className="flex items-center gap-0.5 text-xs bg-status-warning-bg text-status-warning px-1.5 py-0.5 rounded">
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
