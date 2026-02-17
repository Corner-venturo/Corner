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
import { ID_LABELS } from './constants/labels'
import { QUOTE_PAGE_LABELS } from '@/app/(main)/quotes/[id]/constants/labels'

export default function QuickQuoteDetailPage() {
  const params = useParams()
  const quoteId = params.id as string

  const { item: quote, loading } = useQuote(quoteId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-morandi-gold mx-auto mb-4" />
          <p className="text-morandi-secondary">{ID_LABELS.LOADING_6912}</p>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <NotFoundState
          title={ID_LABELS.NOT_FOUND_4550}
          description={ID_LABELS.DELETE_642}
          backButtonLabel={QUOTE_PAGE_LABELS.BACK_TO_LIST}
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
