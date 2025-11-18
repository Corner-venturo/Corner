/**
 * QuotesPage - Main quotes list page component
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Calculator } from 'lucide-react'
import { QuotesList } from './QuotesList'
import { QuoteDialog } from './QuoteDialog'
import { QuickQuoteDialog } from './QuickQuoteDialog'
import { PrintableQuickQuote } from './PrintableQuickQuote'
import { PrintableQuotation } from './PrintableQuotation'
import { useQuotesData } from '../hooks/useQuotesData'
import { useQuotesFilters } from '../hooks/useQuotesFilters'
import { useQuoteForm } from '../hooks/useQuoteForm'
import { useQuickQuoteForm } from '../hooks/useQuickQuoteForm'
import { useQuoteTourSync } from '../hooks/useQuoteTourSync'
import { STATUS_FILTERS, TYPE_FILTERS } from '../constants'
import {
  useRealtimeForQuotes,
  useRealtimeForTours,
  useRealtimeForQuoteItems,
} from '@/hooks/use-realtime-hooks'
import { useRegionsStore } from '@/stores'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const QuotesPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForQuotes()
  useRealtimeForTours()
  useRealtimeForQuoteItems()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isQuickDialogOpen, setIsQuickDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewQuoteId, setPreviewQuoteId] = useState<string | null>(null)
  const [previewQuoteItems, setPreviewQuoteItems] = useState<any[]>([])

  // Data and actions
  const {
    quotes,
    tours,
    addQuote,
    handleDuplicateQuote,
    handleTogglePin,
    handleDeleteQuote,
    handleQuoteClick,
  } = useQuotesData()

  // 打開類型選擇對話框
  const handleOpenTypeSelect = React.useCallback(async () => {
    setIsTypeSelectOpen(true)
  }, [])

  // 選擇標準報價單
  const handleSelectStandard = () => {
    setIsTypeSelectOpen(false)
    setIsAddDialogOpen(true)
  }

  // 選擇快速報價單
  const handleSelectQuick = () => {
    setIsTypeSelectOpen(false)
    setIsQuickDialogOpen(true)
  }

  // Standard quote form management
  const {
    formData,
    setFormField,
    resetForm,
    initFormWithTour,
    handleSubmit,
  } = useQuoteForm({ addQuote })

  // Quick quote form management
  const {
    formData: quickFormData,
    setFormField: setQuickFormField,
    resetForm: resetQuickForm,
    handleSubmit: handleQuickSubmit,
  } = useQuickQuoteForm({ addQuote })

  // 取得所有作者列表
  const authors = React.useMemo(() => {
    const authorSet = new Set<string>()
    quotes.forEach(quote => {
      const author = (quote as any).created_by_name || quote.handler_name
      if (author) authorSet.add(author)
    })
    return Array.from(authorSet).sort()
  }, [quotes])

  // Filtering
  const { filteredQuotes } = useQuotesFilters({
    quotes,
    statusFilter,
    searchTerm,
    authorFilter,
    typeFilter,
  })

  // Tour sync - auto-open dialog when coming from tours page
  const { clearTourParam } = useQuoteTourSync({
    quotes,
    tours,
    isAddDialogOpen,
    onOpenDialog: (tourId: string) => {
      const tour = tours.find(t => t.id === tourId)
      if (tour) {
        initFormWithTour(tour)
        setIsAddDialogOpen(true)
      }
    },
    onNavigateToQuote: (quoteId: string) => {
      router.replace(`/quotes/${quoteId}`)
    },
  })

  const handleDialogClose = () => {
    setIsAddDialogOpen(false)
    resetForm()
    clearTourParam()
  }

  const handleQuickDialogClose = () => {
    setIsQuickDialogOpen(false)
    // 不要在關閉時清除草稿，只有成功建立後才清除
  }

  const handlePreview = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const quote = quotes.find(q => q.id === quoteId)
    if (!quote) return

    logger.log('🔍 Preview quote:', {
      id: quote.id,
      name: quote.name,
      quote_type: (quote as any).quote_type,
      categories: quote.categories,
      selling_prices: quote.selling_prices,
      participant_counts: quote.participant_counts,
    })

    logger.log('💰 Selling prices detailed:', JSON.stringify(quote.selling_prices, null, 2))

    // 如果是快速報價單，需要載入 items
    if ((quote as any).quote_type === 'quick') {
      const { supabase } = await import('@/lib/supabase/client')
      const { data: items, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })

      logger.log('📦 Quick quote items:', items, 'Error:', error)
      setPreviewQuoteItems(items || [])
    } else {
      setPreviewQuoteItems([])
    }

    setPreviewQuoteId(quoteId)
  }

  const previewQuote = previewQuoteId ? quotes.find(q => q.id === previewQuoteId) : null

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' },
        ]}
        tabs={STATUS_FILTERS.map(f => ({
          value: f.value,
          label: f.label,
          icon: f.icon,
        }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋報價單名稱..."
        filters={
          <>
            {/* 類型篩選 */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="類型" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 作者篩選 */}
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="作者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部作者</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        onAdd={handleOpenTypeSelect}
        addLabel="新增報價單"
      />

      {/* 類型選擇對話框 */}
      <Dialog open={isTypeSelectOpen} onOpenChange={setIsTypeSelectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>選擇報價單類型</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={handleSelectStandard}
              className="w-full h-20 flex-col bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <div className="text-lg font-bold">團體報價單</div>
              <div className="text-xs opacity-80">完整的旅遊行程報價（含國家、城市、行程等）</div>
            </Button>
            <Button
              onClick={handleSelectQuick}
              className="w-full h-20 flex-col bg-morandi-green hover:bg-morandi-green/90 text-white"
            >
              <div className="text-lg font-bold">快速報價單</div>
              <div className="text-xs opacity-80">簡單收款用（類似 Excel 報價單）</div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <QuotesList
            quotes={filteredQuotes}
            tours={tours}
            searchTerm={searchTerm}
            onQuoteClick={handleQuoteClick}
            onPreview={handlePreview}
            onDuplicate={handleDuplicateQuote}
            onTogglePin={handleTogglePin}
            onDelete={handleDeleteQuote}
          />
        </div>
      </div>

      <QuoteDialog
        open={isAddDialogOpen}
        onOpenChange={open => {
          if (!open) handleDialogClose()
          setIsAddDialogOpen(open)
        }}
        formData={formData}
        setFormField={setFormField as any}
        tours={tours}
        onSubmit={handleSubmit}
        onClose={handleDialogClose}
      />

      <QuickQuoteDialog
        open={isQuickDialogOpen}
        onOpenChange={open => {
          if (!open) handleQuickDialogClose()
          setIsQuickDialogOpen(open)
        }}
        formData={quickFormData}
        setFormField={setQuickFormField as any}
        onSubmit={handleQuickSubmit}
        onClose={handleQuickDialogClose}
      />

      {/* 預覽對話框 */}
      {previewQuote && (
        <>
          {/* 快速報價單 */}
          {(previewQuote as any).quote_type === 'quick' &&
            previewQuoteItems.length > 0 && (
              <PrintableQuickQuote
                quote={previewQuote as any}
                items={previewQuoteItems}
                isOpen={!!previewQuoteId}
                onClose={() => setPreviewQuoteId(null)}
                onPrint={() => window.print()}
              />
            )}

          {/* 團體報價單 */}
          {(previewQuote as any).quote_type !== 'quick' &&
            previewQuote.categories &&
            previewQuote.categories.length > 0 && (
              <PrintableQuotation
                quote={previewQuote as any}
                quoteName={previewQuote.name || ''}
                participantCounts={
                  previewQuote.participant_counts || {
                    adult: previewQuote.group_size || 1,
                    child_with_bed: 0,
                    child_no_bed: 0,
                    single_room: 0,
                    infant: 0,
                  }
                }
                sellingPrices={
                  previewQuote.selling_prices || {
                    adult: 0,
                    child_with_bed: 0,
                    child_no_bed: 0,
                    single_room: 0,
                    infant: 0,
                  }
                }
                categories={previewQuote.categories || []}
                totalCost={previewQuote.total_cost || 0}
                isOpen={!!previewQuoteId}
                onClose={() => setPreviewQuoteId(null)}
                onPrint={() => window.print()}
              />
            )}

          {/* 草稿編輯中 */}
          {(((previewQuote as any).quote_type === 'quick' && previewQuoteItems.length === 0) ||
            ((previewQuote as any).quote_type !== 'quick' &&
              (!previewQuote.categories || previewQuote.categories.length === 0))) && (
            <Dialog open={!!previewQuoteId} onOpenChange={open => !open && setPreviewQuoteId(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>報價單預覽</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <div className="text-xl font-medium text-muted-foreground">草稿編輯中</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      此報價單尚未新增任何{(previewQuote as any).quote_type === 'quick' ? '項目' : '費用'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewQuoteId(null)
                      handleQuoteClick(previewQuote.id)
                    }}
                  >
                    開啟編輯
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewQuoteId(null)}>
                    關閉
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  )
}
