'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Tour } from '@/types/tour.types'
import { RefreshCw, Edit2, Save, X, Calculator, Loader2 } from 'lucide-react'

// Hooks
import { useTourDepartureData } from './hooks/useTourDepartureData'
import { useQuoteLoader } from './hooks/useQuoteLoader'
import { useTourDepartureTotals } from './hooks/useTourDepartureTotals'

// Components
import { DepartureBasicInfo } from './components/DepartureBasicInfo'
import { DepartureTable } from './components/DepartureTable'
import { ServiceFeeSection } from './components/ServiceFeeSection'
import { TotalAmountSection } from './components/TotalAmountSection'
import { QuoteSelector } from './components/QuoteSelector'

interface TourDepartureDialogProps {
  tour: Tour
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TableItem {
  id: string
  date: string
  item_name?: string | null
  restaurant_name?: string | null
  hotel_name?: string | null
  venue_name?: string | null
  unit_price?: number | null
  quantity?: number | null
  subtotal?: number | null
  expected_amount?: number | null
  actual_amount?: number | null
  notes?: string | null
}

export function TourDepartureDialog({ tour, open, onOpenChange }: TourDepartureDialogProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Use custom hooks
  const {
    loading: dataLoading,
    saving,
    data,
    setData,
    meals,
    setMeals,
    accommodations,
    setAccommodations,
    activities,
    setActivities,
    others,
    setOthers,
    handleSave: saveData,
  } = useTourDepartureData(tour.id, open)

  const {
    linkedQuotes,
    selectedQuoteId,
    setSelectedQuoteId,
    showQuoteSelector,
    setShowQuoteSelector,
    loadingQuotes,
    loading: quoteLoading,
    loadFromQuote,
    handleSelectQuote,
  } = useQuoteLoader(tour, open, data, setMeals, setAccommodations, setActivities, setOthers, setData)

  const totals = useTourDepartureTotals(meals, accommodations, activities, others, data, tour)

  // Calculate tour days
  const tourDays = useMemo(() => {
    if (!tour.departure_date || !tour.return_date) return 0
    const start = new Date(tour.departure_date)
    const end = new Date(tour.return_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }, [tour.departure_date, tour.return_date])

  const handleSave = async () => {
    const success = await saveData()
    if (success) {
      setIsEditing(false)
    }
  }

  const loading = dataLoading || quoteLoading
  const hasQuotes = linkedQuotes.length > 0 || !!tour.quote_id

  if (loading && !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>載入出團資料中</DialogTitle>
          </VisuallyHidden>
          <div className="py-16 text-center text-morandi-secondary">載入中...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <QuoteSelector
        tour={tour}
        linkedQuotes={linkedQuotes}
        selectedQuoteId={selectedQuoteId}
        showQuoteSelector={showQuoteSelector}
        setShowQuoteSelector={setShowQuoteSelector}
        onSelectQuote={handleSelectQuote}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-xl text-morandi-primary">
                出團資料表 - {tour.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 mt-2 text-sm text-morandi-secondary">
              <span>{tour.departure_date} ~ {tour.return_date}</span>
              <span className="text-morandi-muted">|</span>
              <span>{tourDays} 天</span>
              <span className="text-morandi-muted">|</span>
              <span>{tour.current_participants || 0} 人</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 bg-morandi-container/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadFromQuote}
                disabled={loading || loadingQuotes || !hasQuotes}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Calculator size={14} />
                )}
                從報價單帶入
              </Button>

              {loadingQuotes ? (
                <span className="text-xs text-morandi-secondary flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  載入中...
                </span>
              ) : !hasQuotes ? (
                <span className="text-xs text-morandi-red">無報價單</span>
              ) : linkedQuotes.length === 1 ? (
                <span className="text-xs text-morandi-secondary">
                  報價單：<span className="text-morandi-gold font-medium">{linkedQuotes[0].code || linkedQuotes[0].name}</span>
                </span>
              ) : linkedQuotes.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-morandi-secondary">報價單：</span>
                  {linkedQuotes.map((quote) => (
                    <button
                      key={quote.id}
                      onClick={() => setSelectedQuoteId(quote.id)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                        selectedQuoteId === quote.id
                          ? 'bg-morandi-gold text-white'
                          : 'bg-morandi-container/50 text-morandi-primary hover:bg-morandi-container'
                      }`}
                    >
                      {quote.code || quote.name || '報價單'}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X size={14} className="mr-1" />
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                  >
                    <Save size={14} />
                    {saving ? '儲存中...' : '儲存'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} className="mr-1" />
                  編輯
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <DepartureBasicInfo data={data} isEditing={isEditing} setData={setData} />

            {/* Tables */}
            <DepartureTable
              title="餐食表"
              items={meals as TableItem[]}
              nameField="restaurant_name"
              nameLabel="餐廳名稱"
              isEditing={isEditing}
            />

            <DepartureTable
              title="住宿表"
              items={accommodations as TableItem[]}
              nameField="hotel_name"
              nameLabel="飯店名稱"
              isEditing={isEditing}
            />

            <DepartureTable
              title="活動表"
              items={activities as TableItem[]}
              nameField="venue_name"
              nameLabel="場地／活動名稱"
              isEditing={isEditing}
            />

            <DepartureTable
              title="其他費用"
              items={others as TableItem[]}
              nameField="item_name"
              nameLabel="項目名稱"
              isEditing={isEditing}
            />

            {/* Service Fee */}
            <ServiceFeeSection
              data={data}
              isEditing={isEditing}
              serviceFee={totals.serviceFee}
              setData={setData}
            />

            {/* Total Amount */}
            <TotalAmountSection totals={totals} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
