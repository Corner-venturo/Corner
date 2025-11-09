/**
 * QuotesPage - Main quotes list page component
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Calculator } from 'lucide-react'
import { QuotesList } from './QuotesList'
import { QuoteDialog } from './QuoteDialog'
import { QuickQuoteDialog } from './QuickQuoteDialog'
import { useQuotesData } from '../hooks/useQuotesData'
import { useQuotesFilters } from '../hooks/useQuotesFilters'
import { useQuoteForm } from '../hooks/useQuoteForm'
import { useQuickQuoteForm } from '../hooks/useQuickQuoteForm'
import { useQuoteTourSync } from '../hooks/useQuoteTourSync'
import { STATUS_FILTERS } from '../constants'
import {
  useRealtimeForQuotes,
  useRealtimeForTours,
  useRealtimeForQuoteItems,
} from '@/hooks/use-realtime-hooks'
import { useRegionsStore } from '@/stores'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const QuotesPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForQuotes()
  useRealtimeForTours()
  useRealtimeForQuoteItems()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isQuickDialogOpen, setIsQuickDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Data and actions
  const {
    quotes,
    tours,
    countries,
    cities,
    getCitiesByCountry,
    addQuote,
    handleDuplicateQuote,
    handleTogglePin,
    handleDeleteQuote,
    handleQuoteClick,
  } = useQuotesData()

  // ✅ 延遲載入 regions（只在打開對話框時載入）
  const { fetchAll: fetchRegions } = useRegionsStore()

  // 打開類型選擇對話框
  const handleOpenTypeSelect = React.useCallback(async () => {
    setIsTypeSelectOpen(true)
    // 預先載入 regions（為標準報價單準備）
    if (countries.length === 0) {
      await fetchRegions()
    }
  }, [countries.length, fetchRegions])

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
    citySearchTerm,
    setCitySearchTerm,
    availableCities,
    resetForm,
    initFormWithTour,
    handleSubmit,
  } = useQuoteForm({ addQuote, getCitiesByCountry })

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
      const author = quote.created_by_name || quote.handler_name
      if (author) authorSet.add(author)
    })
    return Array.from(authorSet).sort()
  }, [quotes])

  // Filtering
  const { filteredQuotes } = useQuotesFilters({ quotes, statusFilter, searchTerm, authorFilter })

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
    resetQuickForm()
  }

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
        showFilter={true}
        filterOptions={authors.map(author => ({ value: author, label: author }))}
        filterValue={authorFilter}
        onFilterChange={setAuthorFilter}
        filterLabel="作者"
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
        setFormField={setFormField}
        citySearchTerm={citySearchTerm}
        setCitySearchTerm={setCitySearchTerm}
        availableCities={availableCities}
        tours={tours}
        countries={countries}
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
        setFormField={setQuickFormField}
        onSubmit={handleQuickSubmit}
        onClose={handleQuickDialogClose}
      />
    </div>
  )
}
