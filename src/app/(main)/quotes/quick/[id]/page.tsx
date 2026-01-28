'use client'

/**
 * 快速報價單詳細頁面
 * 路由：/quotes/quick/[id]
 */

import { useParams } from 'next/navigation'
import { useQuote, updateQuote } from '@/data'
import { QuickQuoteDetail } from '@/features/quotes/components'
import { NotFoundState } from '@/components/ui/not-found-state'
import { Loader2 } from 'lucide-react'

export default function QuickQuoteDetailPage() {
  const params = useParams()
  const quoteId = params.id as string

  const { item: quote, loading } = useQuote(quoteId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-morandi-gold mx-auto mb-4" />
          <p className="text-morandi-secondary">載入中...</p>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <NotFoundState
          title="找不到該報價單"
          description="您要找的報價單可能已被刪除或不存在"
          backButtonLabel="返回報價單列表"
          backHref="/quotes"
        />
      </div>
    )
  }

  return (
    <QuickQuoteDetail
      quote={quote}
      onUpdate={(data) => updateQuote(quote.id, data)}
    />
  )
}
